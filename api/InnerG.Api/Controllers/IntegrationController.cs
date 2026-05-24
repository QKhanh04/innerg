using System;
using System.Security.Claims;
using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/integrations")]
    [Authorize]
    public class IntegrationController : ControllerBase
    {
        private readonly AppDbContext _context;

        public IntegrationController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet("google/status")]
        public async Task<IActionResult> GetGoogleStatusAsync()
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdValue) || !Guid.TryParse(userIdValue, out var userId))
                return Unauthorized();

            var integration = await _context.UserIntegrations
                .FirstOrDefaultAsync(ui => ui.UserId == userId && ui.Provider == IntegrationProvider.GoogleCalendar);

            return Ok(new
            {
                isConnected = integration != null && integration.IsActive,
                lastSyncedAt = integration?.LastSyncedAt,
                email = integration != null && integration.IsActive ? User.FindFirstValue(ClaimTypes.Email) ?? "user@company.com" : null
            });
        }

        public class ConnectGoogleRequest
        {
            public string AccessToken { get; set; } = string.Empty;
        }

        [HttpPost("google/connect")]
        public async Task<IActionResult> ConnectGoogleAsync([FromBody] ConnectGoogleRequest request)
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdValue) || !Guid.TryParse(userIdValue, out var userId))
                return Unauthorized();

            var integration = await _context.UserIntegrations
                .FirstOrDefaultAsync(ui => ui.UserId == userId && ui.Provider == IntegrationProvider.GoogleCalendar);

            if (integration == null)
            {
                integration = new UserIntegration
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Provider = IntegrationProvider.GoogleCalendar,
                    AccessTokenEncrypted = request.AccessToken,
                    RefreshTokenEncrypted = "",
                    TokenExpiresAt = DateTime.UtcNow.AddHours(1),
                    CalendarId = "primary",
                    Scope = "https://www.googleapis.com/auth/calendar.readonly",
                    IsActive = true,
                    LastSyncedAt = DateTime.UtcNow
                };
                _context.UserIntegrations.Add(integration);
            }
            else
            {
                integration.AccessTokenEncrypted = request.AccessToken;
                integration.IsActive = true;
                integration.LastSyncedAt = DateTime.UtcNow;
                _context.UserIntegrations.Update(integration);
            }

            await _context.SaveChangesAsync();

            return Ok(new
            {
                message = "Connected to Google Calendar successfully.",
                isConnected = true,
                lastSyncedAt = integration.LastSyncedAt
            });
        }

        [HttpPost("google/disconnect")]
        public async Task<IActionResult> DisconnectGoogleAsync()
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdValue) || !Guid.TryParse(userIdValue, out var userId))
                return Unauthorized();

            var integration = await _context.UserIntegrations
                .FirstOrDefaultAsync(ui => ui.UserId == userId && ui.Provider == IntegrationProvider.GoogleCalendar);

            if (integration != null)
            {
                integration.IsActive = false;
                _context.UserIntegrations.Update(integration);
                await _context.SaveChangesAsync();
            }

            return Ok(new
            {
                message = "Disconnected from Google Calendar.",
                isConnected = false
            });
        }
    }
}
