using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/hr/analytics")]
    [Authorize(Roles = AuthRoles.HR)]
    public class HrAnalyticsController : HrControllerBase
    {
        private readonly IHrAnalyticsService _service;

        public HrAnalyticsController(IHrAnalyticsService service) => _service = service;

        [HttpGet("overview")]
        public async Task<IActionResult> Overview([FromQuery] HrDateRangeQuery query) =>
            Ok(await _service.GetOverviewAsync(GetCurrentCompanyId(), query));

        [HttpGet("charts")]
        public async Task<IActionResult> Charts([FromQuery] HrChartsQuery query) =>
            Ok(await _service.GetChartsAsync(GetCurrentCompanyId(), query));

        [HttpGet("skill-map")]
        public async Task<IActionResult> SkillMap() =>
            Ok(await _service.GetSkillMapAsync(GetCurrentCompanyId()));
    }
}
