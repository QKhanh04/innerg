using System;
using System.Security.Claims;
using System.Threading.Tasks;
using InnerG.Api.DTOs;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/hr/members")]
    public class MembersController : ControllerBase
    {
        private readonly IMemberService _memberService;

        public MembersController(IMemberService memberService)
        {
            _memberService = memberService;
        }

        private Guid GetCurrentUserId()
        {
            var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return string.IsNullOrEmpty(id) ? Guid.Empty : Guid.Parse(id);
        }

        private Guid GetCurrentCompanyId()
        {
            var companyIdValue = User.FindFirstValue("company_id") ?? User.FindFirstValue("CompanyId");
            return string.IsNullOrEmpty(companyIdValue) ? Guid.Empty : Guid.Parse(companyIdValue);
        }

        [HttpGet]
        public async Task<IActionResult> GetMembers([FromQuery] MemberListQuery query)
        {
            var result = await _memberService.GetMembersAsync(query, GetCurrentCompanyId());
            return Ok(result);
        }

        [HttpGet("{userId:guid}")]
        public async Task<IActionResult> GetMemberDetail(Guid userId)
        {
            var result = await _memberService.GetMemberDetailAsync(userId, GetCurrentCompanyId());
            return Ok(result);
        }

        [HttpPatch("{userId:guid}")]
        public async Task<IActionResult> UpdateMember(Guid userId, [FromBody] UpdateMemberRequest request)
        {
            await _memberService.UpdateMemberAsync(userId, GetCurrentCompanyId(), GetCurrentUserId(), request);
            return NoContent();
        }

        [HttpPost("{userId:guid}/roles/mentor")]
        public async Task<IActionResult> AssignMentorRole(Guid userId)
        {
            await _memberService.AssignMentorRoleAsync(userId, GetCurrentCompanyId(), GetCurrentUserId());
            return NoContent();
        }

        [HttpDelete("{userId:guid}/roles/mentor")]
        public async Task<IActionResult> RevokeMentorRole(Guid userId)
        {
            await _memberService.RevokeMentorRoleAsync(userId, GetCurrentCompanyId(), GetCurrentUserId());
            return NoContent();
        }

        [HttpPatch("{userId:guid}/status")]
        public async Task<IActionResult> UpdateMemberStatus(Guid userId, [FromBody] UpdateMemberStatusRequest request)
        {
            await _memberService.UpdateMemberStatusAsync(userId, GetCurrentCompanyId(), GetCurrentUserId(), request);
            return NoContent();
        }

        [HttpDelete("{userId:guid}")]
        public async Task<IActionResult> DeleteMember(Guid userId)
        {
            await _memberService.DeleteMemberAsync(userId, GetCurrentCompanyId(), GetCurrentUserId());
            return NoContent();
        }
    }
}
