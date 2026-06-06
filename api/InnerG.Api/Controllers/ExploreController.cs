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
    [Route("api/explore")]
    [Authorize]
    public class ExploreController : ControllerBase
    {
        private readonly IExploreService _exploreService;

        public ExploreController(IExploreService exploreService)
        {
            _exploreService = exploreService;
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
        public async Task<IActionResult> GetExploreClasses()
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing from token." });
                }

                var classes = await _exploreService.GetExploreClassesAsync(companyId, userId);
                return Ok(classes);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{eventId}/register")]
        public async Task<IActionResult> RegisterClass(Guid eventId)
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing from token." });
                }

                var result = await _exploreService.RegisterClassAsync(companyId, userId, eventId);
                return Ok(new { message = result });
            }
            catch (KeyNotFoundException ex)
            {
                return NotFound(new { message = ex.Message });
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{eventId}/unregister")]
        public async Task<IActionResult> UnregisterClass(Guid eventId)
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing from token." });
                }

                var success = await _exploreService.UnregisterClassAsync(companyId, userId, eventId);
                if (!success)
                {
                    return NotFound(new { message = "Enrollment not found." });
                }

                return Ok(new { message = "Successfully cancelled registration." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{eventId}")]
        public async Task<IActionResult> GetExploreClassDetail(Guid eventId)
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing from token." });
                }

                var te = await _exploreService.GetExploreClassDetailAsync(companyId, userId, eventId);
                if (te == null)
                {
                    return NotFound(new { message = "Class not found." });
                }

                return Ok(te);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("mentee-dashboard")]
        public async Task<IActionResult> GetMenteeDashboard()
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing from token." });
                }

                var dashboardDto = await _exploreService.GetMenteeDashboardAsync(companyId, userId);
                return Ok(dashboardDto);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
        [HttpGet("my-classes")]
        public async Task<IActionResult> GetMyClasses()
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing from token." });
                }

                var classes = await _exploreService.GetMyClassesAsync(companyId, userId);
                return Ok(classes);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
// trigger restart
