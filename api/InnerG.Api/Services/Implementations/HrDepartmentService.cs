using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Exceptions;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InnerG.Api.Services.Implementations
{
    public class HrDepartmentService : IHrDepartmentService
    {
        private readonly AppDbContext _context;

        public HrDepartmentService(AppDbContext context)
        {
            _context = context;
        }

        private async Task<Department> GetOrThrow(Guid id, Guid companyId)
        {
            var dept = await _context.Departments
                .Include(d => d.ParentDepartment)
                .Include(d => d.Manager)
                .FirstOrDefaultAsync(d => d.Id == id && d.CompanyId == companyId);
            if (dept == null)
                throw new BusinessException("DEPARTMENT_NOT_FOUND", "Không tìm thấy phòng ban.", 404);
            return dept;
        }

        private static DepartmentResponse Map(Department d, int userCount) => new()
        {
            Id = d.Id,
            Name = d.Name,
            Code = d.Code,
            ParentDepartmentId = d.ParentDepartmentId,
            ParentDepartmentName = d.ParentDepartment?.Name,
            ManagerUserId = d.ManagerUserId,
            ManagerName = d.Manager?.FullName,
            UserCount = userCount
        };

        public async Task<List<DepartmentResponse>> GetAllAsync(Guid companyId)
        {
            var depts = await _context.Departments
                .Include(d => d.ParentDepartment)
                .Include(d => d.Manager)
                .Where(d => d.CompanyId == companyId)
                .ToListAsync();

            var counts = await _context.Users
                .Where(u => u.CompanyId == companyId && u.DepartmentId != null)
                .GroupBy(u => u.DepartmentId!.Value)
                .Select(g => new { DeptId = g.Key, Count = g.Count() })
                .ToDictionaryAsync(x => x.DeptId, x => x.Count);

            return depts.Select(d => Map(d, counts.GetValueOrDefault(d.Id, 0))).ToList();
        }

        public async Task<DepartmentResponse> GetByIdAsync(Guid id, Guid companyId)
        {
            var dept = await GetOrThrow(id, companyId);
            var count = await _context.Users.CountAsync(u => u.DepartmentId == id);
            return Map(dept, count);
        }

        public async Task<DepartmentStatsDto> GetStatsAsync(Guid id, Guid companyId)
        {
            await GetOrThrow(id, companyId);
            var userIds = await _context.Users
                .Where(u => u.DepartmentId == id)
                .Select(u => u.Id)
                .ToListAsync();

            var enrollmentCount = await _context.Enrollments
                .CountAsync(e => userIds.Contains(e.UserId));

            var eventIds = await _context.Enrollments
                .Where(e => userIds.Contains(e.UserId))
                .Select(e => e.TrainingEventId)
                .Distinct()
                .ToListAsync();

            var totalHours = await _context.TrainingSessions
                .Where(s => eventIds.Contains(s.TrainingEventId))
                .SumAsync(s => (double?)(s.EndTime - s.StartTime).TotalHours) ?? 0;

            var avgRating = await _context.Feedbacks
                .Where(f => userIds.Contains(f.ReviewerUserId))
                .AverageAsync(f => (double?)f.OverallRating);

            return new DepartmentStatsDto
            {
                EnrollmentCount = enrollmentCount,
                TotalHours = totalHours,
                AvgRating = avgRating
            };
        }

        public async Task<DepartmentResponse> CreateAsync(Guid companyId, DepartmentRequest request)
        {
            if (request.ParentDepartmentId.HasValue)
            {
                var parent = await _context.Departments
                    .AnyAsync(d => d.Id == request.ParentDepartmentId && d.CompanyId == companyId);
                if (!parent)
                    throw new BusinessException("INVALID_PARENT", "Phòng ban cha không hợp lệ.", 400);
            }

            var dept = new Department
            {
                CompanyId = companyId,
                Name = request.Name,
                Code = request.Code,
                ParentDepartmentId = request.ParentDepartmentId,
                ManagerUserId = request.ManagerUserId
            };
            _context.Departments.Add(dept);
            await _context.SaveChangesAsync();
            return Map(dept, 0);
        }

        public async Task<DepartmentResponse> UpdateAsync(Guid id, Guid companyId, DepartmentRequest request)
        {
            var dept = await GetOrThrow(id, companyId);
            if (request.ParentDepartmentId.HasValue && request.ParentDepartmentId != id)
            {
                var parentOk = await _context.Departments
                    .AnyAsync(d => d.Id == request.ParentDepartmentId && d.CompanyId == companyId);
                if (!parentOk)
                    throw new BusinessException("INVALID_PARENT", "Phòng ban cha không hợp lệ.", 400);
            }

            dept.Name = request.Name;
            dept.Code = request.Code;

            if (dept.ParentDepartmentId != request.ParentDepartmentId)
            {
                if (request.ParentDepartmentId.HasValue)
                {
                    if (request.ParentDepartmentId == id)
                        throw new BusinessException("INVALID_PARENT", "Phòng ban không thể là cha của chính nó.", 400);

                    if (await IsDescendantAsync(id, request.ParentDepartmentId.Value, companyId))
                        throw new BusinessException("CIRCULAR_DEPENDENCY", "Không thể gán phòng ban con làm phòng ban cha.", 400);
                }
                dept.ParentDepartmentId = request.ParentDepartmentId;
            }

            dept.ManagerUserId = request.ManagerUserId;
            await _context.SaveChangesAsync();
            var count = await _context.Users.CountAsync(u => u.DepartmentId == id);
            return Map(dept, count);
        }

        private async Task<bool> IsDescendantAsync(Guid parentId, Guid potentialDescendantId, Guid companyId)
        {
            var currentId = potentialDescendantId;
            while (currentId != Guid.Empty)
            {
                var dept = await _context.Departments
                    .AsNoTracking()
                    .Where(d => d.Id == currentId && d.CompanyId == companyId)
                    .Select(d => new { d.ParentDepartmentId })
                    .FirstOrDefaultAsync();

                if (dept == null || !dept.ParentDepartmentId.HasValue)
                    break;

                if (dept.ParentDepartmentId == parentId)
                    return true;

                currentId = dept.ParentDepartmentId.Value;
            }
            return false;
        }

        public async Task DeleteAsync(Guid id, Guid companyId)
        {
            await GetOrThrow(id, companyId);
            var hasUsers = await _context.Users.AnyAsync(u => u.DepartmentId == id);
            if (hasUsers)
                throw new BusinessException("DEPARTMENT_HAS_USERS", "Không thể xóa phòng ban còn nhân viên.", 400);

            var dept = await _context.Departments.FindAsync(id);
            if (dept != null)
            {
                dept.DeletedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
            }
        }
    }
}
