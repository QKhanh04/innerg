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
    public class HrWishlistService : IHrWishlistService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public HrWishlistService(AppDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<List<HrWishlistItemDto>> GetWishlistsAsync(Guid companyId, HrWishlistQuery query)
        {
            var q = _context.LearningWishlists
                .Include(w => w.User).ThenInclude(u => u.Department)
                .Include(w => w.Skill)
                .Where(w => w.CompanyId == companyId);

            if (query.Status.HasValue)
                q = q.Where(w => w.Status == query.Status.Value);
            if (query.MinVotes.HasValue)
                q = q.Where(w => w.VoteCount >= query.MinVotes.Value);
            if (query.DepartmentId.HasValue)
                q = q.Where(w => w.User.DepartmentId == query.DepartmentId.Value);

            return await q
                .OrderByDescending(w => w.VoteCount)
                .Select(w => new HrWishlistItemDto
                {
                    Id = w.Id,
                    ProposerName = w.User.FullName,
                    DepartmentName = w.User.Department != null ? w.User.Department.Name : null,
                    SkillName = w.Skill != null ? w.Skill.Name : (w.SkillNameCustom ?? ""),
                    Category = w.Category,
                    Description = w.Description,
                    Urgency = w.Urgency.ToString(),
                    VoteCount = w.VoteCount,
                    Status = w.Status.ToString(),
                    CreatedAt = w.CreatedAt
                })
                .ToListAsync();
        }

        private async Task<LearningWishlist> GetWishlistOrThrow(Guid wishlistId, Guid companyId)
        {
            var wishlist = await _context.LearningWishlists
                .FirstOrDefaultAsync(w => w.Id == wishlistId && w.CompanyId == companyId);
            if (wishlist == null)
                throw new BusinessException("WISHLIST_NOT_FOUND", "Không tìm thấy wishlist.", 404);
            return wishlist;
        }

        private async Task NotifyWishlistStakeholdersAsync(LearningWishlist wishlist, string title, string body)
        {
            var voterIds = await _context.WishlistVotes
                .Where(v => v.WishlistId == wishlist.Id)
                .Select(v => v.UserId)
                .ToListAsync();

            var recipients = voterIds.Append(wishlist.UserId).Distinct();
            await _notificationService.SendToManyAsync(
                recipients, "WISHLIST_UPDATE", title, body,
                referenceType: "Wishlist", referenceId: wishlist.Id);
        }

        public async Task UpdateStatusAsync(Guid wishlistId, Guid companyId, Guid hrUserId, UpdateWishlistStatusRequest request)
        {
            var wishlist = await GetWishlistOrThrow(wishlistId, companyId);
            wishlist.Status = request.Status;
            wishlist.ReviewedByUserId = hrUserId == Guid.Empty ? null : hrUserId;
            wishlist.ReviewedAt = DateTime.UtcNow;
            if (request.Status == WishlistStatus.Rejected)
                wishlist.RejectionReason = request.RejectionReason;

            await _context.SaveChangesAsync();
            await NotifyWishlistStakeholdersAsync(wishlist,
                "Cập nhật Learning Wishlist",
                $"Trạng thái wishlist đã được cập nhật thành {request.Status}.");
        }

        public async Task AssignTrainerAsync(Guid wishlistId, Guid companyId, Guid hrUserId, AssignTrainerRequest request)
        {
            var wishlist = await GetWishlistOrThrow(wishlistId, companyId);
            var trainer = await _context.Trainers
                .FirstOrDefaultAsync(t => t.Id == request.TrainerId && t.CompanyId == companyId && t.IsActive);
            if (trainer == null)
                throw new BusinessException("TRAINER_NOT_FOUND", "Không tìm thấy trainer.", 404);

            wishlist.AssignedTrainerId = request.TrainerId;
            wishlist.Status = WishlistStatus.FindingTrainer;
            wishlist.ReviewedByUserId = hrUserId;
            wishlist.ReviewedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await NotifyWishlistStakeholdersAsync(wishlist,
                "Trainer được gán cho Wishlist",
                $"Một trainer đã được gán cho wishlist của bạn.");

            if (trainer.UserId.HasValue)
            {
                await _notificationService.SendAsync(
                    trainer.UserId.Value,
                    "WISHLIST_ASSIGNMENT",
                    "Bạn được gán làm mentor cho Wishlist",
                    $"HR đã gán bạn làm mentor cho chủ đề \"{wishlist.SkillNameCustom ?? "Learning Wishlist"}\".",
                    referenceType: "Wishlist",
                    referenceId: wishlist.Id);
            }
        }

        public async Task LinkEventAsync(Guid wishlistId, Guid companyId, Guid hrUserId, LinkEventRequest request)
        {
            var wishlist = await GetWishlistOrThrow(wishlistId, companyId);
            var evt = await _context.TrainingEvents
                .FirstOrDefaultAsync(e => e.Id == request.TrainingEventId && e.CompanyId == companyId);
            if (evt == null)
                throw new BusinessException("EVENT_NOT_FOUND", "Không tìm thấy lớp học.", 404);

            wishlist.ResultingTrainingEventId = request.TrainingEventId;
            wishlist.Status = WishlistStatus.Scheduled;
            wishlist.ReviewedByUserId = hrUserId;
            wishlist.ReviewedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            await NotifyWishlistStakeholdersAsync(wishlist,
                "Wishlist đã được lên lịch",
                $"Wishlist của bạn đã được liên kết với lớp học \"{evt.Title}\".");
        }

        public async Task<List<SuggestedTrainerDto>> SuggestTrainersAsync(Guid wishlistId, Guid companyId)
        {
            var wishlist = await _context.LearningWishlists
                .Include(w => w.Skill)
                .FirstOrDefaultAsync(w => w.Id == wishlistId && w.CompanyId == companyId);
            if (wishlist == null)
                throw new BusinessException("WISHLIST_NOT_FOUND", "Không tìm thấy wishlist.", 404);

            var skillTopic = (wishlist.Skill?.Name ?? wishlist.SkillNameCustom ?? "").Trim().ToLower();
            var skillTokens = skillTopic
                .Split(new[] { ' ', ',', '-', '/', '&' }, StringSplitOptions.RemoveEmptyEntries)
                .Where(t => t.Length > 2)
                .ToHashSet();

            var trainers = await _context.Trainers
                .Include(t => t.TrainerSkills)
                    .ThenInclude(ts => ts.Skill)
                .Where(t => t.CompanyId == companyId && t.IsActive)
                .ToListAsync();

            bool IsSkillMatch(Trainer trainer)
            {
                if (wishlist.SkillId.HasValue)
                    return trainer.TrainerSkills.Any(ts => ts.SkillId == wishlist.SkillId.Value);

                if (string.IsNullOrWhiteSpace(skillTopic))
                    return false;

                return trainer.TrainerSkills.Any(ts =>
                {
                    var skillName = ts.Skill.Name.ToLower();
                    return skillName.Contains(skillTopic)
                        || skillTopic.Contains(skillName)
                        || skillTokens.Any(token => skillName.Contains(token));
                });
            }

            return trainers
                .Select(t =>
                {
                    var matchedSkill = t.TrainerSkills
                        .OrderByDescending(ts => ts.Proficiency)
                        .FirstOrDefault(ts =>
                            wishlist.SkillId.HasValue
                                ? ts.SkillId == wishlist.SkillId.Value
                                : !string.IsNullOrWhiteSpace(skillTopic) && (
                                    ts.Skill.Name.ToLower().Contains(skillTopic)
                                    || skillTopic.Contains(ts.Skill.Name.ToLower())
                                    || skillTokens.Any(token => ts.Skill.Name.ToLower().Contains(token))));

                    var isRecommended = IsSkillMatch(t);

                    return new SuggestedTrainerDto
                    {
                        TrainerId = t.Id,
                        FullName = t.FullName,
                        AvgRating = t.AvgRating,
                        Proficiency = matchedSkill != null
                            ? matchedSkill.Proficiency.ToString()
                            : "Mentor",
                        IsRecommended = isRecommended
                    };
                })
                .OrderByDescending(t => t.IsRecommended)
                .ThenByDescending(t => t.AvgRating)
                .ThenBy(t => t.FullName)
                .ToList();
        }
    }
}
