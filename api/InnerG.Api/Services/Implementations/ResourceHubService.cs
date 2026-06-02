using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using InnerG.Api.DTOs;
using InnerG.Api.Models;
using InnerG.Api.Repositories.Interfaces;
using InnerG.Api.Services.Interfaces;

namespace InnerG.Api.Services.Implementations
{
    public class ResourceHubService : IResourceHubService
    {
        private readonly IUnitOfWork _unitOfWork;

        public ResourceHubService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<IEnumerable<ResourceHubItemDto>> GetResourcesAsync(Guid companyId, Guid userId, string userRole)
        {
            // 1. Fetch all confirmed/completed enrollments for the current user
            var enrolledEventIds = await _unitOfWork.Repository<Enrollment>()
                .GetQueryable()
                .Where(e => e.UserId == userId && 
                            (e.Status == EnrollmentStatus.Confirmed || 
                             e.Status == EnrollmentStatus.Completed ||
                             e.Status == EnrollmentStatus.Pending))
                .Select(e => e.TrainingEventId)
                .ToListAsync();

            var enrolledSet = new HashSet<Guid>(enrolledEventIds);

            // 2. Fetch all resources in the user's company scope
            var resources = await _unitOfWork.Repository<Resource>()
                .GetQueryable()
                .Include(r => r.TrainingEvent)
                    .ThenInclude(te => te.Trainer)
                        .ThenInclude(t => t.User)
                .Include(r => r.TrainingEvent)
                    .ThenInclude(te => te.Skill)
                .Where(r => r.CompanyId == companyId && 
                            (r.TrainingEvent.Status == TrainingEventStatus.Published || 
                             r.TrainingEvent.Status == TrainingEventStatus.Completed))
                .OrderByDescending(r => r.TrainingEvent.StartDate)
                .ToListAsync();

            var result = new List<ResourceHubItemDto>();
            var now = DateTime.UtcNow;

            foreach (var r in resources)
            {
                var te = r.TrainingEvent;
                if (te == null) continue; // skip orphan resources safely

                var trainer = te.Trainer;
                var skill = te.Skill;

                // access rule checks
                bool isTrainer = trainer != null && trainer.UserId == userId;
                bool isHrOrAdmin = userRole.Equals("HR", StringComparison.OrdinalIgnoreCase) || 
                                   userRole.Equals("Admin", StringComparison.OrdinalIgnoreCase);
                bool isEnrolled = enrolledSet.Contains(te.Id);
                
                // USER'S NEW REQUIREMENT: "sau buổi workshop đó thì tài nguyên được xem và tải bởi tất cả mọi người luôn (là public ấy)"
                bool isWorkshopFinished = te.Status == TrainingEventStatus.Completed || te.EndDate <= DateTime.UtcNow || te.EndDate <= DateTime.Now;

                bool hasAccess = r.IsPublic || isTrainer || isHrOrAdmin || isEnrolled || isWorkshopFinished;

                result.Add(new ResourceHubItemDto
                {
                    Id = r.Id,
                    Title = r.Title,
                    Description = r.Description,
                    Type = r.Type.ToString(),
                    Url = r.Url,
                    FileType = r.FileType,
                    FileSizeBytes = r.FileSizeBytes,
                    IsPublic = r.IsPublic,
                    
                    WorkshopId = te.Id,
                    WorkshopTitle = te.Title,
                    WorkshopDate = te.StartDate.ToString("MMM dd, yyyy"),
                    MentorName = trainer?.FullName ?? "Unknown Mentor",
                    MentorAvatar = trainer?.User?.AvatarUrl,
                    Tag = skill?.Category ?? "General",
                    
                    HasAccess = hasAccess
                });
            }

            return result;
        }
    }
}
