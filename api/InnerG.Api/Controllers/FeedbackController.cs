using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InnerG.Api.DTOs;
using InnerG.Api.Models;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using System.Security.Claims;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize]
    public class FeedbackController : ControllerBase
    {
        private readonly IFeedbackService _feedbackService;

        public FeedbackController(IFeedbackService feedbackService)
        {
            _feedbackService = feedbackService;
        }

        [HttpGet("criteria/learner")]
        public async Task<ActionResult<List<CriteriaDto>>> GetLearnerCriteria()
        {
            var companyIdClaim = User.FindFirstValue("company_id") ?? User.FindFirst("company_id")?.Value;
            if (!Guid.TryParse(companyIdClaim, out var companyId))
                return Unauthorized("CompanyId is missing or invalid in token.");

            var criteria = await _feedbackService.GetLearnerCriteriaAsync(companyId);
            return Ok(criteria);
        }

        [HttpPost("event/{eventId}")]
        [Authorize(Roles = AuthRoles.Mentee)]
        public async Task<IActionResult> SubmitFeedback(Guid eventId, [FromBody] SubmitFeedbackRequestDto request)
        {
            var companyIdClaim = User.FindFirstValue("company_id") ?? User.FindFirst("company_id")?.Value;
            var userIdClaim = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (!Guid.TryParse(companyIdClaim, out var companyId) || !Guid.TryParse(userIdClaim, out var userId))
                return Unauthorized("Invalid token claims.");

            try
            {
                var result = await _feedbackService.SubmitFeedbackAsync(companyId, userId, eventId, request);
                if (!result) return NotFound("Event not found.");
                return Ok(new { message = "Feedback submitted successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("event/{eventId}")]
        [AllowAnonymous]
        public async Task<ActionResult<List<FeedbackResponseDto>>> GetEventFeedbacks(Guid eventId)
        {
            // For simplicity, we just use a dummy companyId or bypass if allow anonymous.
            // But since our DB requires companyId for safety, let's just get it from the event itself inside the service.
            // Wait, the service requires companyId. We can fetch it from user claims if logged in, or bypass if not.
            var companyIdClaim = User.FindFirst("CompanyId")?.Value;
            Guid companyId = Guid.Empty;
            if (Guid.TryParse(companyIdClaim, out var cid)) companyId = cid;

            // If not logged in, we shouldn't fail if we want it public, but right now let's just require it or handle it.
            // For now, if companyId is empty, the service might return empty. So let's just use it.
            var feedbacks = await _feedbackService.GetEventFeedbacksAsync(companyId, eventId);
            return Ok(feedbacks);
        }
    }
}
