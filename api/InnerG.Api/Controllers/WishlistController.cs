using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InnerG.Api.DTOs;
using InnerG.Api.Services.Interfaces;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/wishlist")]
    [Authorize]
    public class WishlistController : ControllerBase
    {
        private readonly IWishlistService _wishlistService;

        public WishlistController(IWishlistService wishlistService)
        {
            _wishlistService = wishlistService;
        }

        private Guid GetCurrentUserId()
        {
            var id = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return string.IsNullOrEmpty(id) ? Guid.Empty : Guid.Parse(id);
        }

        private Guid GetCurrentCompanyId()
        {
            var companyIdValue = User.FindFirstValue("company_id") ?? User.FindFirstValue("CompanyId") ?? User.FindFirst("company_id")?.Value;
            return string.IsNullOrEmpty(companyIdValue) ? Guid.Empty : Guid.Parse(companyIdValue);
        }

        [HttpGet]
        public async Task<IActionResult> GetWishlist()
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing from token." });
                }

                var wishlist = await _wishlistService.GetWishlistAsync(companyId, userId);
                return Ok(wishlist);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateWishlist([FromBody] CreateWishlistRequest request)
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing." });
                }

                var result = await _wishlistService.CreateWishlistAsync(companyId, userId, request);
                return Ok(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/vote")]
        public async Task<IActionResult> ToggleVote(Guid id)
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing." });
                }

                var result = await _wishlistService.ToggleVoteAsync(companyId, userId, id);
                return Ok(result);
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
