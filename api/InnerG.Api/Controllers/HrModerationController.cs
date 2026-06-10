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
    [Route("api/hr/moderation")]
    [Authorize(Roles = AuthRoles.HR)]
    public class HrModerationController : HrControllerBase
    {
        private readonly IHrModerationService _service;

        public HrModerationController(IHrModerationService service) => _service = service;

        [HttpGet("events")]
        public async Task<IActionResult> PendingEvents([FromQuery] TrainingEventStatus? status) =>
            Ok(await _service.GetPendingEventsAsync(GetCurrentCompanyId(), status));

        [HttpPatch("events/{eventId:guid}/review")]
        public async Task<IActionResult> ReviewEvent(Guid eventId, [FromBody] ReviewEventRequest request)
        {
            await _service.ReviewEventAsync(eventId, GetCurrentCompanyId(), GetCurrentUserId(), request);
            return NoContent();
        }

        [HttpGet("resources")]
        public async Task<IActionResult> PendingResources() =>
            Ok(await _service.GetPendingResourcesAsync(GetCurrentCompanyId()));

        [HttpPatch("resources/{resourceId:guid}/review")]
        public async Task<IActionResult> ReviewResource(Guid resourceId, [FromBody] ReviewResourceRequest request)
        {
            await _service.ReviewResourceAsync(resourceId, GetCurrentCompanyId(), GetCurrentUserId(), request);
            return NoContent();
        }

        [HttpGet("escalations")]
        public async Task<IActionResult> Escalations() =>
            Ok(await _service.GetEscalationReportsAsync(GetCurrentCompanyId()));

        [HttpGet("report-center")]
        public async Task<IActionResult> ReportCenter() =>
            Ok(await _service.GetModerationReportCenterAsync(GetCurrentCompanyId()));

        [HttpPost("escalations")]
        public async Task<IActionResult> CreateEscalation([FromBody] CreateModerationEscalationRequest request)
        {
            var report = await _service.CreateEscalationReportAsync(GetCurrentCompanyId(), GetCurrentUserId(), request);
            return StatusCode(StatusCodes.Status201Created, report);
        }
    }
}
