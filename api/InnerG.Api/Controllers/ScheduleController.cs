using System;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InnerG.Api.DTOs;
using InnerG.Api.Services.Interfaces;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/schedule")]
    [Authorize]
    public class ScheduleController : ControllerBase
    {
        private readonly IScheduleService _scheduleService;

        public ScheduleController(IScheduleService scheduleService)
        {
            _scheduleService = scheduleService;
        }

        [HttpGet]
        public async Task<IActionResult> GetPersonalScheduleAsync([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdValue) || !Guid.TryParse(userIdValue, out var userId))
                    return Unauthorized();

                var companyIdValue = User.FindFirstValue("company_id") ?? User.FindFirstValue("CompanyId");
                if (string.IsNullOrEmpty(companyIdValue) || !Guid.TryParse(companyIdValue, out var companyId))
                    return BadRequest("Company context is required.");

                var schedule = await _scheduleService.GetPersonalScheduleAsync(companyId, userId, startDate, endDate);
                return Ok(schedule);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
