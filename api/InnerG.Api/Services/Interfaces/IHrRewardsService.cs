using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Models;

namespace InnerG.Api.Services.Interfaces
{
    public interface IHrRewardsService
    {
        Task<List<PointRuleDto>> GetPointRulesAsync(Guid companyId);
        Task<PointRuleDto> CreatePointRuleAsync(Guid companyId, Guid userId, PointRuleRequest request);
        Task<PointRuleDto> UpdatePointRuleAsync(Guid id, Guid companyId, PointRuleRequest request);
        Task DeletePointRuleAsync(Guid id, Guid companyId);

        Task<List<RewardDto>> GetRewardsAsync(Guid companyId);
        Task<RewardDto> CreateRewardAsync(Guid companyId, RewardRequest request);
        Task<RewardDto> UpdateRewardAsync(Guid id, Guid companyId, RewardRequest request);
        Task DeleteRewardAsync(Guid id, Guid companyId);

        Task<List<BadgeDto>> GetBadgesAsync(Guid companyId);
        Task<BadgeDto> CreateBadgeAsync(Guid companyId, BadgeRequest request);
        Task<BadgeDto> UpdateBadgeAsync(Guid id, Guid companyId, BadgeRequest request);
        Task DeleteBadgeAsync(Guid id, Guid companyId);

        Task<List<UserRewardDto>> GetRedemptionsAsync(Guid companyId, RedemptionStatus? status);
        Task UpdateRedemptionAsync(Guid id, Guid companyId, UpdateRedemptionRequest request);

        Task AdjustPointsAsync(Guid companyId, Guid hrUserId, AdjustPointsRequest request);
    }
}
