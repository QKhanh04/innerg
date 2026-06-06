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
    [Route("api/integrations")]
    [Authorize]
    public class IntegrationController : ControllerBase
    {
        private readonly IIntegrationService _integrationService;

        public IntegrationController(IIntegrationService integrationService)
        {
            _integrationService = integrationService;
        }

        [HttpGet("google/status")]
        public async Task<IActionResult> GetGoogleStatusAsync()
        {
            try
            {
                var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdValue) || !Guid.TryParse(userIdValue, out var userId))
                    return Unauthorized();

                var email = User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirst(ClaimTypes.Email)?.Value;

                var result = await _integrationService.GetGoogleStatusAsync(userId, email);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("google/connect")]
        public async Task<IActionResult> ConnectGoogleAsync([FromBody] ConnectGoogleRequest request)
        {
            try
            {
                var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdValue) || !Guid.TryParse(userIdValue, out var userId))
                    return Unauthorized();

                var result = await _integrationService.ConnectGoogleAsync(userId, request.AccessToken);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("google/disconnect")]
        public async Task<IActionResult> DisconnectGoogleAsync()
        {
            try
            {
                var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
                if (string.IsNullOrEmpty(userIdValue) || !Guid.TryParse(userIdValue, out var userId))
                    return Unauthorized();

                var result = await _integrationService.DisconnectGoogleAsync(userId);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
