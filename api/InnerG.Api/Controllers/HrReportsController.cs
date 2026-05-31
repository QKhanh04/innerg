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
    [Route("api/hr/reports")]
    [Authorize(Roles = AuthRoles.HR)]
    public class HrReportsController : HrControllerBase
    {
        private readonly IHrReportsService _service;

        public HrReportsController(IHrReportsService service) => _service = service;

        [HttpGet("events")]
        public async Task<IActionResult> Events([FromQuery] HrDateRangeQuery query, [FromQuery] Guid? departmentId) =>
            Ok(await _service.GetEventReportsAsync(GetCurrentCompanyId(), query, departmentId));

        [HttpGet("events/{eventId:guid}")]
        public async Task<IActionResult> EventDetail(Guid eventId) =>
            Ok(await _service.GetEventDetailAsync(eventId, GetCurrentCompanyId()));

        [HttpGet("members/{userId:guid}")]
        public async Task<IActionResult> MemberReport(Guid userId) =>
            Ok(await _service.GetMemberReportAsync(userId, GetCurrentCompanyId()));

        [HttpGet("export")]
        public async Task<IActionResult> Export(
            [FromQuery] string type = "events",
            [FromQuery] string format = "csv",
            [FromQuery] HrDateRangeQuery? range = null)
        {
            var companyId = GetCurrentCompanyId();
            byte[] data;
            string fileName;

            if (type.Equals("members", StringComparison.OrdinalIgnoreCase))
            {
                data = await _service.ExportMembersCsvAsync(companyId);
                fileName = "members.csv";
            }
            else
            {
                data = await _service.ExportEventsCsvAsync(companyId, range ?? new HrDateRangeQuery());
                fileName = "events.csv";
            }

            return File(data, "text/csv", fileName);
        }
    }
}
