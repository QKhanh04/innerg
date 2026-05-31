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
    [Route("api/hr/wishlists")]
    [Authorize(Roles = AuthRoles.HR)]
    public class HrWishlistsController : HrControllerBase
    {
        private readonly IHrWishlistService _service;

        public HrWishlistsController(IHrWishlistService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> List([FromQuery] HrWishlistQuery query) =>
            Ok(await _service.GetWishlistsAsync(GetCurrentCompanyId(), query));

        [HttpPatch("{wishlistId:guid}/status")]
        public async Task<IActionResult> UpdateStatus(Guid wishlistId, [FromBody] UpdateWishlistStatusRequest request)
        {
            await _service.UpdateStatusAsync(wishlistId, GetCurrentCompanyId(), GetCurrentUserId(), request);
            return NoContent();
        }

        [HttpPatch("{wishlistId:guid}/assign-trainer")]
        public async Task<IActionResult> AssignTrainer(Guid wishlistId, [FromBody] AssignTrainerRequest request)
        {
            await _service.AssignTrainerAsync(wishlistId, GetCurrentCompanyId(), GetCurrentUserId(), request);
            return NoContent();
        }

        [HttpPatch("{wishlistId:guid}/link-event")]
        public async Task<IActionResult> LinkEvent(Guid wishlistId, [FromBody] LinkEventRequest request)
        {
            await _service.LinkEventAsync(wishlistId, GetCurrentCompanyId(), GetCurrentUserId(), request);
            return NoContent();
        }

        [HttpGet("{wishlistId:guid}/suggest-trainers")]
        public async Task<IActionResult> SuggestTrainers(Guid wishlistId) =>
            Ok(await _service.SuggestTrainersAsync(wishlistId, GetCurrentCompanyId()));
    }
}
