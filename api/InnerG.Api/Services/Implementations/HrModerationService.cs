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
    public class HrModerationService : IHrModerationService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public HrModerationService(AppDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<List<HrPendingEventDto>> GetPendingEventsAsync(Guid companyId)
        {
            return await _context.TrainingEvents
                .Include(e => e.Trainer)
                .Where(e => e.CompanyId == companyId && e.Status == TrainingEventStatus.PendingApproval)
                .OrderBy(e => e.StartDate)
                .Select(e => new HrPendingEventDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    TrainerName = e.Trainer.FullName,
                    StartDate = e.StartDate,
                    Type = e.Type.ToString()
                })
                .ToListAsync();
        }

        public async Task ReviewEventAsync(Guid eventId, Guid companyId, Guid hrUserId, ReviewEventRequest request)
        {
            var evt = await _context.TrainingEvents
                .Include(e => e.Trainer).ThenInclude(t => t.User)
                .Include(e => e.TargetDepartments)
                .FirstOrDefaultAsync(e => e.Id == eventId && e.CompanyId == companyId);

            if (evt == null)
                throw new BusinessException("EVENT_NOT_FOUND", "Không tìm thấy lớp học.", 404);

            if (request.Approved)
            {
                evt.Status = TrainingEventStatus.Published;
                await _context.SaveChangesAsync();

                var deptIds = evt.TargetDepartments.Select(td => td.DepartmentId).ToList();
                if (deptIds.Count > 0)
                {
                    var userIds = await _context.Users
                        .Where(u => u.CompanyId == companyId && u.IsActive &&
                                    u.DepartmentId != null && deptIds.Contains(u.DepartmentId.Value))
                        .Select(u => u.Id)
                        .ToListAsync();

                    await _notificationService.SendToManyAsync(
                        userIds, "EVENT_PUBLISHED",
                        $"Lớp học mới: {evt.Title}",
                        $"Một lớp học mới đã được publish trong phòng ban của bạn.",
                        referenceType: "TrainingEvent", referenceId: evt.Id);
                }

                if (evt.Trainer.UserId.HasValue)
                {
                    await _notificationService.SendAsync(
                        evt.Trainer.UserId.Value, "CONTENT_APPROVED",
                        "Lớp học đã được duyệt",
                        $"Lớp \"{evt.Title}\" đã được HR phê duyệt và publish.",
                        referenceType: "TrainingEvent", referenceId: evt.Id);
                }
            }
            else
            {
                evt.Status = TrainingEventStatus.Draft;
                await _context.SaveChangesAsync();

                if (evt.Trainer.UserId.HasValue)
                {
                    await _notificationService.SendAsync(
                        evt.Trainer.UserId.Value, "CONTENT_REJECTED",
                        "Lớp học bị từ chối",
                        request.Reason ?? "Lớp học cần chỉnh sửa trước khi gửi lại.",
                        referenceType: "TrainingEvent", referenceId: evt.Id);
                }
            }
        }

        public async Task<List<HrPendingResourceDto>> GetPendingResourcesAsync(Guid companyId)
        {
            return await _context.Resources
                .Include(r => r.TrainingEvent)
                .Where(r => r.CompanyId == companyId && !r.IsPublic)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new HrPendingResourceDto
                {
                    Id = r.Id,
                    Title = r.Title,
                    EventTitle = r.TrainingEvent.Title,
                    Type = r.Type.ToString()
                })
                .ToListAsync();
        }

        public async Task ReviewResourceAsync(Guid resourceId, Guid companyId, ReviewResourceRequest request)
        {
            var resource = await _context.Resources
                .FirstOrDefaultAsync(r => r.Id == resourceId && r.CompanyId == companyId);
            if (resource == null)
                throw new BusinessException("RESOURCE_NOT_FOUND", "Không tìm thấy tài nguyên.", 404);

            if (request.Approved)
                resource.IsPublic = true;

            await _context.SaveChangesAsync();
        }
    }
}
