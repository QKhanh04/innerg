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
    [Route("api/hr/meeting-rooms")]
    [Authorize(Roles = AuthRoles.HR)]
    public class HrMeetingRoomsController : HrControllerBase
    {
        private readonly IHrMeetingRoomService _service;

        public HrMeetingRoomsController(IHrMeetingRoomService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> List() =>
            Ok(await _service.GetAllAsync(GetCurrentCompanyId()));

        [HttpGet("availability")]
        public async Task<IActionResult> Availability([FromQuery] RoomAvailabilityQuery query) =>
            Ok(await _service.GetAvailableAsync(GetCurrentCompanyId(), query));

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id) =>
            Ok(await _service.GetByIdAsync(id, GetCurrentCompanyId()));

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] MeetingRoomRequest request) =>
            Ok(await _service.CreateAsync(GetCurrentCompanyId(), request));

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] MeetingRoomRequest request) =>
            Ok(await _service.UpdateAsync(id, GetCurrentCompanyId(), request));

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteAsync(id, GetCurrentCompanyId());
            return NoContent();
        }
    }
}
