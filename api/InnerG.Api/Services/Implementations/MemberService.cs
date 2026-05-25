using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.DTOs;
using InnerG.Api.Exceptions;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;

namespace InnerG.Api.Services.Implementations
{
    public class MemberService : IMemberService
    {
        private readonly AppDbContext _context;
        private readonly UserManager<AppUser> _userManager;
        
        // Stub methods for external services not fully implemented in scope
        private Task RevokeAllSessionsStubAsync(Guid userId) => Task.CompletedTask;
        private Task SendNotificationStubAsync(Guid userId, string type, string message) => Task.CompletedTask;

        public MemberService(AppDbContext context, UserManager<AppUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<PaginatedResponse<MemberResponse>> GetMembersAsync(MemberListQuery query, Guid companyId)
        {
            var usersQuery = _context.Users
                .Include(u => u.Department)
                .AsQueryable();

            if (!string.IsNullOrEmpty(query.Search))
            {
                var lowerSearch = query.Search.ToLower();
                usersQuery = usersQuery.Where(u => u.FullName.ToLower().Contains(lowerSearch) || 
                                                   (u.Email != null && u.Email.ToLower().Contains(lowerSearch)));
            }

            if (query.DepartmentId.HasValue)
            {
                usersQuery = usersQuery.Where(u => u.DepartmentId == query.DepartmentId.Value);
            }

            if (!string.IsNullOrWhiteSpace(query.Status))
            {
                bool isActive = query.Status.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase);
                usersQuery = usersQuery.Where(u => u.IsActive == isActive);
            }
            
            // To filter by role, we find users that belong to that role
            if (!string.IsNullOrWhiteSpace(query.Role))
            {
                var upperRole = query.Role.ToUpper(); 
                var dbRoleName = query.Role; 
                if (upperRole == "MENTOR") dbRoleName = AuthRoles.Mentor;
                else if (upperRole == "HR") dbRoleName = AuthRoles.HR;
                else if (upperRole == "MENTEE") dbRoleName = AuthRoles.Mentee;

                var usersInRole = await _userManager.GetUsersInRoleAsync(dbRoleName);
                var userIds = usersInRole.Select(u => u.Id).ToList();
                usersQuery = usersQuery.Where(u => userIds.Contains(u.Id));
            }

            var total = await usersQuery.CountAsync();
            var users = await usersQuery
                .OrderByDescending(u => u.CreatedAt)
                .Skip((query.Page - 1) * query.PageSize)
                .Take(query.PageSize)
                .ToListAsync();

            var result = new List<MemberResponse>();
            foreach (var user in users)
            {
                var roles = await _userManager.GetRolesAsync(user);
                result.Add(new MemberResponse
                {
                    Id = user.Id,
                    Name = user.FullName,
                    Email = user.Email ?? string.Empty,
                    AvatarUrl = user.AvatarUrl,
                    Department = user.Department != null ? new DepartmentDTO { Id = user.Department.Id, Name = user.Department.Name } : null,
                    Position = user.JobTitle,
                    Roles = roles.Select(r => r.ToUpper()).ToList(), // format as uppercase in response
                    Status = GetStatus(user),
                    JoinedAt = user.CreatedAt,
                    LearningPoints = user.TotalInnerGPoints
                });
            }

            return new PaginatedResponse<MemberResponse>
            {
                Data = result,
                Total = total,
                Page = query.Page,
                PageSize = query.PageSize
            };
        }

        public async Task<MemberDetailResponse> GetMemberDetailAsync(Guid userId, Guid companyId)
        {
            var user = await _context.Users
                .Include(u => u.Department)
                .Include(u => u.TrainerProfiles)
                .Include(u => u.UserSkills).ThenInclude(us => us.Skill)
                .Include(u => u.Badges).ThenInclude(ub => ub.Badge)
                .Include(u => u.Enrollments).ThenInclude(e => e.TrainingEvent)
                .FirstOrDefaultAsync(u => u.Id == userId);

            if (user == null)
            {
                throw new BusinessException("USER_NOT_FOUND", "Không tìm thấy nhân viên.", 404);
            }

            var roles = await _userManager.GetRolesAsync(user);
            
            var response = new MemberDetailResponse
            {
                Id = user.Id,
                Name = user.FullName,
                Email = user.Email ?? string.Empty,
                AvatarUrl = user.AvatarUrl,
                Department = user.Department != null ? new DepartmentDTO { Id = user.Department.Id, Name = user.Department.Name } : null,
                Position = user.JobTitle,
                Roles = roles.Select(r => r.ToUpper()).ToList(),
                Status = GetStatus(user),
                JoinedAt = user.CreatedAt,
                LearningPoints = user.TotalInnerGPoints,
                
                Skills = user.UserSkills.Select(us => new SkillDTO
                {
                    SkillName = us.Skill.Name,
                    Level = us.Proficiency.ToString().ToUpper()
                }).ToList(),
                
                Badges = user.Badges.Select(b => new BadgeDTO
                {
                    Name = b.Badge.Name,
                    IconUrl = b.Badge.IconUrl ?? string.Empty,
                    AwardedAt = b.AwardedAt
                }).ToList(),
                
                LearningHistory = user.Enrollments.Select(e => new LearningHistoryDTO
                {
                    ClassId = e.TrainingEventId,
                    ClassTitle = e.TrainingEvent.Title,
                    ScheduledAt = e.TrainingEvent.StartDate,
                    Status = e.Status.ToString().ToUpper()
                }).ToList()
            };

            // Estimate total learning hours for response placeholder if field logic is missing
            response.TotalLearningHours = user.Enrollments.Count * 2; 

            if (roles.Contains(AuthRoles.Mentor) && user.TrainerProfiles.Any())
            {
                var trainer = user.TrainerProfiles.First();
                response.TrainerProfile = new TrainerProfileDTO
                {
                    Bio = trainer.Bio,
                    AvgRating = trainer.AvgRating,
                    TotalClassesTaught = trainer.TotalClassesTaught,
                    TotalStudents = trainer.TotalStudents,
                    MentorStatus = trainer.MentorStatus.ToUpper()
                };
            }

            return response;
        }

        public async Task UpdateMemberAsync(Guid userId, Guid companyId, Guid currentUserId, UpdateMemberRequest request)
        {
            if (userId == currentUserId)
                throw new BusinessException("CANNOT_MODIFY_SELF", "Không thể thao tác trên tài khoản của chính bạn.", 403);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                throw new BusinessException("USER_NOT_FOUND", "Không tìm thấy nhân viên.", 404);

            if (await _userManager.IsInRoleAsync(user, "Admin") || await _userManager.IsInRoleAsync(user, "SuperAdmin"))
                throw new BusinessException("CANNOT_MODIFY_ADMIN", "Không thể thay đổi tài khoản Admin.", 403);

            if (request.DepartmentId.HasValue) user.DepartmentId = request.DepartmentId.Value;
            if (request.Position != null) user.JobTitle = request.Position;

            await _context.SaveChangesAsync();
        }

        public async Task AssignMentorRoleAsync(Guid userId, Guid companyId, Guid currentUserId)
        {
            if (userId == currentUserId)
                throw new BusinessException("CANNOT_MODIFY_SELF", "Không thể thao tác trên tài khoản của chính bạn.", 403);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                throw new BusinessException("USER_NOT_FOUND", "Không tìm thấy nhân viên.", 404);

            if (!user.IsActive)
                throw new BusinessException("USER_NOT_ACTIVE", "Tài khoản phải đang hoạt động.", 400);

            if (await _userManager.IsInRoleAsync(user, AuthRoles.Mentor))
                throw new BusinessException("USER_ALREADY_HAS_MENTOR_ROLE", "Nhân viên này đã là Mentor.", 409);

            await using var transaction = await _context.Database.BeginTransactionAsync();
            try
            {
                var trainer = await _context.Trainers.FirstOrDefaultAsync(t => t.UserId == userId);
                if (trainer != null)
                {
                    trainer.MentorStatus = "PENDING_VERIFICATION";
                    trainer.IsActive = true;
                }
                else
                {
                    trainer = new Trainer
                    {
                        UserId = userId,
                        CompanyId = companyId,
                        TrainerType = TrainerType.Internal,
                        MentorStatus = "PENDING_VERIFICATION",
                        IsActive = true,
                        FullName = user.FullName,
                        Email = user.Email
                    };
                    _context.Trainers.Add(trainer);
                }

                await _userManager.AddToRoleAsync(user, AuthRoles.Mentor);
                await _context.SaveChangesAsync();
                await transaction.CommitAsync();

                await SendNotificationStubAsync(userId, "ROLE_ASSIGNED", "Bạn đã được gán role Mentor");
            }
            catch
            {
                await transaction.RollbackAsync();
                throw;
            }
        }

        public async Task RevokeMentorRoleAsync(Guid userId, Guid companyId, Guid currentUserId)
        {
            if (userId == currentUserId)
                throw new BusinessException("CANNOT_MODIFY_SELF", "Không thể thao tác trên tài khoản của chính bạn.", 403);

            var user = await _context.Users.Include(u => u.TrainerProfiles).FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                throw new BusinessException("USER_NOT_FOUND", "Không tìm thấy nhân viên.", 404);

            var trainer = user.TrainerProfiles.FirstOrDefault();
            if (trainer != null)
            {
                var upcomingClasses = await _context.TrainingEvents
                    .Where(te => te.TrainerId == trainer.Id && 
                                 (te.Status == TrainingEventStatus.Published || te.Status == TrainingEventStatus.PendingApproval) && 
                                 te.StartDate > DateTime.UtcNow)
                    .ToListAsync();

                if (upcomingClasses.Any())
                {
                    throw new BusinessException("MENTOR_HAS_UPCOMING_CLASSES", "Không thể thu hồi role Mentor vì còn lớp học sắp diễn ra.", 400);
                }

                trainer.MentorStatus = "INACTIVE";
                await _context.SaveChangesAsync();
            }

            if (await _userManager.IsInRoleAsync(user, AuthRoles.Mentor))
            {
                await _userManager.RemoveFromRoleAsync(user, AuthRoles.Mentor);
            }
        }

        public async Task UpdateMemberStatusAsync(Guid userId, Guid companyId, Guid currentUserId, UpdateMemberStatusRequest request)
        {
            if (userId == currentUserId)
                throw new BusinessException("CANNOT_MODIFY_SELF", "Không thể thao tác trên tài khoản của chính bạn.", 403);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                throw new BusinessException("USER_NOT_FOUND", "Không tìm thấy nhân viên.", 404);

            if (await _userManager.IsInRoleAsync(user, "Admin") || await _userManager.IsInRoleAsync(user, "SuperAdmin"))
                throw new BusinessException("CANNOT_MODIFY_ADMIN", "Không thể thay đổi tài khoản Admin.", 403);

            bool newActive = request.Status.Equals("ACTIVE", StringComparison.OrdinalIgnoreCase);
            
            if (user.IsActive && !newActive)
            {
                await RevokeAllSessionsStubAsync(userId);
            }
            
            user.IsActive = newActive;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteMemberAsync(Guid userId, Guid companyId, Guid currentUserId)
        {
            if (userId == currentUserId)
                throw new BusinessException("CANNOT_MODIFY_SELF", "Không thể thao tác trên tài khoản của chính bạn.", 403);

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == userId);
            if (user == null)
                throw new BusinessException("USER_NOT_FOUND", "Không tìm thấy nhân viên.", 404);

            if (await _userManager.IsInRoleAsync(user, "Admin") || await _userManager.IsInRoleAsync(user, "SuperAdmin"))
                throw new BusinessException("CANNOT_MODIFY_ADMIN", "Không thể thay đổi tài khoản Admin.", 403);

            user.IsActive = false;
            user.DeletedAt = DateTime.UtcNow;
            
            await _context.SaveChangesAsync();
            await RevokeAllSessionsStubAsync(userId);
        }

        private string GetStatus(AppUser user)
        {
            if (user.DeletedAt != null) return "DELETED";
            return user.IsActive ? "ACTIVE" : "INACTIVE";
        }
    }
}
