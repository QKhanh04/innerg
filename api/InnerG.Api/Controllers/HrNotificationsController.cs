using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/hr/notifications")]
    [Authorize(Roles = AuthRoles.HR)]
    public class HrNotificationsController : HrControllerBase
    {
        private readonly IHrBroadcastService _service;

        public HrNotificationsController(IHrBroadcastService service) => _service = service;

        [HttpPost("broadcast")]
        public async Task<IActionResult> Broadcast([FromBody] BroadcastNotificationRequest request)
        {
            var count = await _service.BroadcastAsync(GetCurrentCompanyId(), request);
            return Ok(new { recipientCount = count });
        }

        [HttpGet("history")]
        public async Task<IActionResult> History() =>
            Ok(await _service.GetHistoryAsync(GetCurrentCompanyId()));
    }
}
