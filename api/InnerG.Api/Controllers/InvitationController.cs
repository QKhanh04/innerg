using System;
using System.Security.Claims;
using System.Threading.Tasks;
using InnerG.Api.DTOs;
using InnerG.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/hr/invitations")]
    [Authorize(Roles = "HR,SystemAdmin")]
    public class InvitationController : ControllerBase
    {
        private readonly IInvitationService _invitationService;

        public InvitationController(IInvitationService invitationService)
        {
            _invitationService = invitationService;
        }

        private Guid? GetCurrentCompanyId()
        {
            var companyIdClaim = User.FindFirst("CompanyId")?.Value;
            return Guid.TryParse(companyIdClaim, out var id) ? id : null;
        }

        private bool IsSystemAdmin()
        {
            return User.IsInRole("SystemAdmin");
        }

        [HttpGet]
        public async Task<IActionResult> GetInvitesAsync([FromQuery] InviteListQuery query)
        {
            var companyId = GetCurrentCompanyId();
            if (companyId == null && !IsSystemAdmin())
                return Unauthorized();

            var result = await _invitationService.GetInvitesAsync(query, companyId ?? Guid.Empty, IsSystemAdmin());
            return Ok(result);
        }

        [HttpPost]
        public async Task<IActionResult> CreateInviteAsync([FromBody] CreateInviteRequest request)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized();

            var result = await _invitationService.CreateInviteAsync(
                request,
                currentUserId,
                GetCurrentCompanyId(),
                IsSystemAdmin());

            return Ok(result);
        }

        [HttpPost("bulk")]
        public async Task<IActionResult> CreateBulkInvitesAsync([FromBody] BulkInviteRequest request)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized();

            var result = await _invitationService.CreateBulkInvitesAsync(
                request,
                currentUserId,
                GetCurrentCompanyId(),
                IsSystemAdmin());

            return Ok(result);
        }

        [HttpPost("{inviteId:guid}/resend")]
        public async Task<IActionResult> ResendInviteAsync(Guid inviteId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized();

            var result = await _invitationService.ResendInviteAsync(
                inviteId,
                currentUserId,
                GetCurrentCompanyId(),
                IsSystemAdmin());

            return Ok(result);
        }

        [HttpPost("{inviteId:guid}/revoke")]
        public async Task<IActionResult> RevokeInviteAsync(Guid inviteId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized();

            await _invitationService.RevokeInviteAsync(
                inviteId,
                currentUserId,
                GetCurrentCompanyId(),
                IsSystemAdmin());

            return NoContent();
        }

        [HttpPost("bulk-delete")]
        public async Task<IActionResult> BulkDeleteInvitesAsync([FromBody] BulkRevokeRequest request)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized();

            await _invitationService.DeleteBulkInvitesAsync(
                request,
                currentUserId,
                GetCurrentCompanyId(),
                IsSystemAdmin());

            return NoContent();
        }

        [HttpDelete("{inviteId:guid}")]
        public async Task<IActionResult> DeleteInviteAsync(Guid inviteId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized();

            await _invitationService.DeleteInviteAsync(
                inviteId,
                currentUserId,
                GetCurrentCompanyId(),
                IsSystemAdmin());

            return NoContent();
        }

        [HttpPost("validate-file")]
        public async Task<IActionResult> ValidateInviteFileAsync([FromForm] IFormFile file)
        {
            var companyId = GetCurrentCompanyId();
            if (companyId == null)
                return Unauthorized();

            var result = await _invitationService.ValidateInviteFileAsync(file, companyId.Value);
            return Ok(result);
        }
    }
}
