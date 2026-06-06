using System;
using System.Security.Claims;
using System.Threading.Tasks;
using InnerG.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/resource-hub")]
    [Authorize]
    public class ResourceHubController : ControllerBase
    {
        private readonly IResourceHubService _resourceHubService;

        public ResourceHubController(IResourceHubService resourceHubService)
        {
            _resourceHubService = resourceHubService;
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

        private string GetCurrentUserRole()
        {
            return User.FindFirstValue(ClaimTypes.Role) ?? User.FindFirst(ClaimTypes.Role)?.Value ?? "Mentee";
        }

        [HttpGet]
        public async Task<IActionResult> GetResources()
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();
                var role = GetCurrentUserRole();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing from token." });
                }

                var resources = await _resourceHubService.GetResourcesAsync(companyId, userId, role);
                return Ok(resources);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
