using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/hr/events")]
    [Authorize(Roles = AuthRoles.HR)]
    public class HrEventsController : HrControllerBase
    {
        private readonly IHrEventService _service;

        public HrEventsController(IHrEventService service) => _service = service;

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] HrCreateEventRequest request)
        {
            var id = await _service.CreateEventAsync(GetCurrentCompanyId(), GetCurrentUserId(), request);
            return Ok(new { id });
        }
    }
}
