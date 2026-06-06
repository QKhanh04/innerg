using System;
using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/hr")]
    [Authorize(Roles = AuthRoles.HR)]
    public class HrRewardsController : HrControllerBase
    {
        private readonly IHrRewardsService _service;

        public HrRewardsController(IHrRewardsService service) => _service = service;

        [HttpGet("point-rules")]
        public async Task<IActionResult> GetPointRules() =>
            Ok(await _service.GetPointRulesAsync(GetCurrentCompanyId()));

        [HttpPost("point-rules")]
        public async Task<IActionResult> CreatePointRule([FromBody] PointRuleRequest request) =>
            Ok(await _service.CreatePointRuleAsync(GetCurrentCompanyId(), GetCurrentUserId(), request));

        [HttpPut("point-rules/{id:guid}")]
        public async Task<IActionResult> UpdatePointRule(Guid id, [FromBody] PointRuleRequest request) =>
            Ok(await _service.UpdatePointRuleAsync(id, GetCurrentCompanyId(), request));

        [HttpDelete("point-rules/{id:guid}")]
        public async Task<IActionResult> DeletePointRule(Guid id)
        {
            await _service.DeletePointRuleAsync(id, GetCurrentCompanyId());
            return NoContent();
        }

        [HttpGet("rewards")]
        public async Task<IActionResult> GetRewards() =>
            Ok(await _service.GetRewardsAsync(GetCurrentCompanyId()));

        [HttpPost("rewards")]
        public async Task<IActionResult> CreateReward([FromBody] RewardRequest request) =>
            Ok(await _service.CreateRewardAsync(GetCurrentCompanyId(), request));

        [HttpPut("rewards/{id:guid}")]
        public async Task<IActionResult> UpdateReward(Guid id, [FromBody] RewardRequest request) =>
            Ok(await _service.UpdateRewardAsync(id, GetCurrentCompanyId(), request));

        [HttpDelete("rewards/{id:guid}")]
        public async Task<IActionResult> DeleteReward(Guid id)
        {
            await _service.DeleteRewardAsync(id, GetCurrentCompanyId());
            return NoContent();
        }

        [HttpGet("badges")]
        public async Task<IActionResult> GetBadges() =>
            Ok(await _service.GetBadgesAsync(GetCurrentCompanyId()));

        [HttpPost("badges")]
        public async Task<IActionResult> CreateBadge([FromBody] BadgeRequest request) =>
            Ok(await _service.CreateBadgeAsync(GetCurrentCompanyId(), request));

        [HttpPut("badges/{id:guid}")]
        public async Task<IActionResult> UpdateBadge(Guid id, [FromBody] BadgeRequest request) =>
            Ok(await _service.UpdateBadgeAsync(id, GetCurrentCompanyId(), request));

        [HttpDelete("badges/{id:guid}")]
        public async Task<IActionResult> DeleteBadge(Guid id)
        {
            await _service.DeleteBadgeAsync(id, GetCurrentCompanyId());
            return NoContent();
        }

        [HttpGet("redemptions")]
        public async Task<IActionResult> GetRedemptions([FromQuery] RedemptionStatus? status) =>
            Ok(await _service.GetRedemptionsAsync(GetCurrentCompanyId(), status));

        [HttpPatch("redemptions/{id:guid}/status")]
        public async Task<IActionResult> UpdateRedemption(Guid id, [FromBody] UpdateRedemptionRequest request)
        {
            await _service.UpdateRedemptionAsync(id, GetCurrentCompanyId(), request);
            return NoContent();
        }

        [HttpPost("points/adjust")]
        public async Task<IActionResult> AdjustPoints([FromBody] AdjustPointsRequest request)
        {
            await _service.AdjustPointsAsync(GetCurrentCompanyId(), GetCurrentUserId(), request);
            return NoContent();
        }
    }
}
