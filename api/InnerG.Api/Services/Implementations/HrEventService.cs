using System;
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
    public class HrEventService : IHrEventService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public HrEventService(AppDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<Guid> CreateEventAsync(Guid companyId, Guid hrUserId, HrCreateEventRequest request)
        {
            var trainer = await _context.Trainers
                .Include(t => t.User)
                .FirstOrDefaultAsync(t => t.Id == request.TrainerId && t.CompanyId == companyId && t.IsActive);

            if (trainer == null)
                throw new BusinessException("TRAINER_NOT_FOUND", "Không tìm thấy trainer.", 404);

            if (trainer.UserId == hrUserId)
                throw new BusinessException("CANNOT_ASSIGN_SELF", "HR không thể tự gán mình làm trainer.", 400);

            var skillExists = await _context.Skills.AnyAsync(s => s.Id == request.SkillId);
            if (!skillExists)
                throw new BusinessException("SKILL_NOT_FOUND", "Không tìm thấy kỹ năng.", 404);

            var evt = new TrainingEvent
            {
                CompanyId = companyId,
                Title = request.Title,
                Description = request.Description,
                Type = request.Type,
                Status = TrainingEventStatus.Published,
                SkillId = request.SkillId,
                TrainerId = request.TrainerId,
                StartDate = request.StartDate,
                EndDate = request.EndDate,
                MaxParticipants = request.MaxParticipants,
                RewardPoints = request.RewardPoints,
                IsExternal = trainer.TrainerType == TrainerType.External
            };

            _context.TrainingEvents.Add(evt);
            await _context.SaveChangesAsync();

            if (request.TargetDepartmentIds?.Count > 0)
            {
                foreach (var deptId in request.TargetDepartmentIds.Distinct())
                {
                    _context.TrainingEventTargetDepartments.Add(new TrainingEventTargetDepartment
                    {
                        TrainingEventId = evt.Id,
                        DepartmentId = deptId
                    });
                }
                await _context.SaveChangesAsync();
            }

            if (trainer.UserId.HasValue)
            {
                await _notificationService.SendAsync(
                    trainer.UserId.Value,
                    "EVENT_ASSIGNED",
                    "Bạn được gán phụ trách lớp học",
                    $"Bạn được gán phụ trách lớp học \"{evt.Title}\".",
                    referenceType: "TrainingEvent",
                    referenceId: evt.Id);
            }

            return evt.Id;
        }
    }
}
