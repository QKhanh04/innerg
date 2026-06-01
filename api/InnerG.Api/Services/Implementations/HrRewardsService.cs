using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Exceptions;
using InnerG.Api.Helpers;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InnerG.Api.Services.Implementations
{
    public class HrRewardsService : IHrRewardsService
    {
        private readonly AppDbContext _context;

        public HrRewardsService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<PointRuleDto>> GetPointRulesAsync(Guid companyId)
        {
            var rules = await _context.PointRules.Where(r => r.CompanyId == companyId).ToListAsync();
            return rules.Select(MapRule).ToList();
        }

        private static PointRuleDto MapRule(PointRule r) => new()
        {
            Id = r.Id, Name = r.Name, Description = r.Description,
            RuleType = r.RuleType, ConditionType = r.ConditionType,
            ConditionOperator = r.ConditionOperator, ConditionValue = r.ConditionValue,
            PointsValue = r.PointsValue, Priority = r.Priority, IsActive = r.IsActive
        };

        public async Task<PointRuleDto> CreatePointRuleAsync(Guid companyId, Guid userId, PointRuleRequest request)
        {
            var rule = new PointRule
            {
                CompanyId = companyId,
                CreatedByUserId = userId,
                Name = request.Name,
                Description = request.Description,
                RuleType = request.RuleType,
                ConditionType = request.ConditionType,
                ConditionOperator = request.ConditionOperator,
                ConditionValue = request.ConditionValue,
                PointsValue = request.PointsValue,
                Priority = request.Priority,
                IsActive = request.IsActive
            };
            _context.PointRules.Add(rule);
            await _context.SaveChangesAsync();
            return MapRule(rule);
        }

        public async Task<PointRuleDto> UpdatePointRuleAsync(Guid id, Guid companyId, PointRuleRequest request)
        {
            var rule = await _context.PointRules.FirstOrDefaultAsync(r => r.Id == id && r.CompanyId == companyId)
                ?? throw new BusinessException("NOT_FOUND", "Không tìm thấy rule.", 404);
            rule.Name = request.Name;
            rule.Description = request.Description;
            rule.RuleType = request.RuleType;
            rule.ConditionType = request.ConditionType;
            rule.ConditionOperator = request.ConditionOperator;
            rule.ConditionValue = request.ConditionValue;
            rule.PointsValue = request.PointsValue;
            rule.Priority = request.Priority;
            rule.IsActive = request.IsActive;
            await _context.SaveChangesAsync();
            return MapRule(rule);
        }

        public async Task DeletePointRuleAsync(Guid id, Guid companyId)
        {
            var rule = await _context.PointRules.FirstOrDefaultAsync(r => r.Id == id && r.CompanyId == companyId)
                ?? throw new BusinessException("NOT_FOUND", "Không tìm thấy rule.", 404);
            rule.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task<List<RewardDto>> GetRewardsAsync(Guid companyId) =>
            await _context.Rewards.Where(r => r.CompanyId == companyId)
                .Select(r => new RewardDto
                {
                    Id = r.Id, Name = r.Name, Description = r.Description,
                    Type = r.Type, PointCost = r.PointCost, StockQuantity = r.StockQuantity,
                    ImageUrl = r.ImageUrl, IsActive = r.IsActive
                }).ToListAsync();

        public async Task<RewardDto> CreateRewardAsync(Guid companyId, RewardRequest request)
        {
            var reward = new Reward
            {
                CompanyId = companyId,
                Name = request.Name,
                Description = request.Description,
                Type = request.Type,
                PointCost = request.PointCost,
                StockQuantity = request.StockQuantity,
                ImageUrl = request.ImageUrl,
                IsActive = request.IsActive
            };
            _context.Rewards.Add(reward);
            await _context.SaveChangesAsync();
            return new RewardDto
            {
                Id = reward.Id, Name = reward.Name, Description = reward.Description,
                Type = reward.Type, PointCost = reward.PointCost, StockQuantity = reward.StockQuantity,
                ImageUrl = reward.ImageUrl, IsActive = reward.IsActive
            };
        }

        public async Task<RewardDto> UpdateRewardAsync(Guid id, Guid companyId, RewardRequest request)
        {
            var reward = await _context.Rewards.FirstOrDefaultAsync(r => r.Id == id && r.CompanyId == companyId)
                ?? throw new BusinessException("NOT_FOUND", "Không tìm thấy reward.", 404);
            reward.Name = request.Name;
            reward.Description = request.Description;
            reward.Type = request.Type;
            reward.PointCost = request.PointCost;
            reward.StockQuantity = request.StockQuantity;
            reward.ImageUrl = request.ImageUrl;
            reward.IsActive = request.IsActive;
            await _context.SaveChangesAsync();
            return new RewardDto
            {
                Id = reward.Id, Name = reward.Name, Description = reward.Description,
                Type = reward.Type, PointCost = reward.PointCost, StockQuantity = reward.StockQuantity,
                ImageUrl = reward.ImageUrl, IsActive = reward.IsActive
            };
        }

        public async Task DeleteRewardAsync(Guid id, Guid companyId)
        {
            var reward = await _context.Rewards.FirstOrDefaultAsync(r => r.Id == id && r.CompanyId == companyId)
                ?? throw new BusinessException("NOT_FOUND", "Không tìm thấy reward.", 404);
            reward.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task<List<BadgeDto>> GetBadgesAsync(Guid companyId) =>
            await _context.Badges
                .Where(b => b.CompanyId == null || b.CompanyId == companyId)
                .Select(b => new BadgeDto
                {
                    Id = b.Id, Name = b.Name, Description = b.Description,
                    IconUrl = b.IconUrl, ConditionType = b.ConditionType,
                    ConditionValue = b.ConditionValue, IsSystem = b.IsSystem
                }).ToListAsync();

        public async Task<BadgeDto> CreateBadgeAsync(Guid companyId, BadgeRequest request)
        {
            var badge = new Badge
            {
                CompanyId = companyId,
                Name = request.Name,
                Description = request.Description,
                IconUrl = request.IconUrl,
                ConditionType = request.ConditionType,
                ConditionValue = request.ConditionValue
            };
            _context.Badges.Add(badge);
            await _context.SaveChangesAsync();
            return new BadgeDto
            {
                Id = badge.Id, Name = badge.Name, Description = badge.Description,
                IconUrl = badge.IconUrl, ConditionType = badge.ConditionType,
                ConditionValue = badge.ConditionValue, IsSystem = badge.IsSystem
            };
        }

        public async Task<BadgeDto> UpdateBadgeAsync(Guid id, Guid companyId, BadgeRequest request)
        {
            var badge = await _context.Badges
                .FirstOrDefaultAsync(b => b.Id == id && b.CompanyId == companyId)
                ?? throw new BusinessException("NOT_FOUND", "Không tìm thấy badge.", 404);
            badge.Name = request.Name;
            badge.Description = request.Description;
            badge.IconUrl = request.IconUrl;
            badge.ConditionType = request.ConditionType;
            badge.ConditionValue = request.ConditionValue;
            await _context.SaveChangesAsync();
            return new BadgeDto
            {
                Id = badge.Id, Name = badge.Name, Description = badge.Description,
                IconUrl = badge.IconUrl, ConditionType = badge.ConditionType,
                ConditionValue = badge.ConditionValue, IsSystem = badge.IsSystem
            };
        }

        public async Task DeleteBadgeAsync(Guid id, Guid companyId)
        {
            var badge = await _context.Badges
                .FirstOrDefaultAsync(b => b.Id == id && b.CompanyId == companyId)
                ?? throw new BusinessException("NOT_FOUND", "Không tìm thấy badge.", 404);
            badge.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task<List<UserRewardDto>> GetRedemptionsAsync(Guid companyId, RedemptionStatus? status)
        {
            var q = _context.UserRewards
                .Include(ur => ur.User)
                .Include(ur => ur.Reward)
                .Where(ur => ur.CompanyId == companyId);
            if (status.HasValue)
                q = q.Where(ur => ur.Status == status.Value);

            return await q.OrderByDescending(ur => ur.RedeemedAt)
                .Select(ur => new UserRewardDto
                {
                    Id = ur.Id,
                    UserName = ur.User.FullName,
                    RewardName = ur.Reward.Name,
                    Status = ur.Status,
                    PointsSpent = ur.PointsSpent,
                    RedeemedAt = ur.RedeemedAt,
                    AdminNotes = ur.AdminNotes
                }).ToListAsync();
        }

        public async Task UpdateRedemptionAsync(Guid id, Guid companyId, UpdateRedemptionRequest request)
        {
            var ur = await _context.UserRewards.FirstOrDefaultAsync(r => r.Id == id && r.CompanyId == companyId)
                ?? throw new BusinessException("NOT_FOUND", "Không tìm thấy redemption.", 404);
            ur.Status = request.Status;
            ur.AdminNotes = request.AdminNotes;
            await _context.SaveChangesAsync();
        }

        public async Task AdjustPointsAsync(Guid companyId, Guid hrUserId, AdjustPointsRequest request)
        {
            var user = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == request.UserId && u.CompanyId == companyId)
                ?? throw new BusinessException("USER_NOT_FOUND", "Không tìm thấy nhân viên.", 404);

            user.TotalInnerGPoints += request.Amount;
            var ledger = new InnerGPointsLedger
            {
                UserId = user.Id,
                Amount = request.Amount,
                BalanceAfter = user.TotalInnerGPoints,
                Type = PointTransactionType.AdjustedByHR,
                Note = request.Note,
                CreatedByUserId = hrUserId
            };
            _context.InnerGPointsLedger.Add(ledger);
            await _context.SaveChangesAsync();

            await HrAuditHelper.LogAsync(_context, companyId, hrUserId,
                "InnerGPointsLedger", ledger.Id, "PointAdjust",
                null, new { request.UserId, request.Amount, request.Note });
        }
    }
}
