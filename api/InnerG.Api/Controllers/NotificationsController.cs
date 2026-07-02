using System;
using System.Security.Claims;
using System.Threading.Tasks;
using InnerG.Api.DTOs;
using InnerG.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/notifications")]
    public class NotificationsController : ControllerBase
    {
        private readonly IUserNotificationService _userNotificationService;
        private readonly IPushNotificationService _pushNotificationService;

        public NotificationsController(
            IUserNotificationService userNotificationService,
            IPushNotificationService pushNotificationService)
        {
            _userNotificationService = userNotificationService;
            _pushNotificationService = pushNotificationService;
        }

        [HttpGet("vapid-public-key")]
        [AllowAnonymous]
        public IActionResult GetVapidPublicKey()
        {
            var key = _pushNotificationService.GetVapidPublicKey();
            if (string.IsNullOrEmpty(key))
                return NotFound(new { message = "Web Push is not configured on this server." });

            return Ok(new { publicKey = key });
        }

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetNotifications([FromQuery] int limit = 20, [FromQuery] bool unreadOnly = false)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            return Ok(await _userNotificationService.GetNotificationsAsync(userId, limit, unreadOnly));
        }

        [HttpGet("unread-count")]
        [Authorize]
        public async Task<IActionResult> GetUnreadCount()
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var count = await _userNotificationService.GetUnreadCountAsync(userId);
            return Ok(new { count });
        }

        [HttpPatch("{id:guid}/read")]
        [Authorize]
        public async Task<IActionResult> MarkAsRead(Guid id)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            await _userNotificationService.MarkAsReadAsync(userId, id);
            return Ok(new { success = true });
        }

        [HttpPatch("read-all")]
        [Authorize]
        public async Task<IActionResult> MarkAllAsRead()
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            await _userNotificationService.MarkAllAsReadAsync(userId);
            return Ok(new { success = true });
        }

        [HttpPost("subscribe")]
        [Authorize]
        public async Task<IActionResult> Subscribe([FromBody] SubscribePushRequest request)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            var userAgent = Request.Headers.UserAgent.ToString();
            await _pushNotificationService.SubscribeAsync(
                userId,
                request.Endpoint,
                request.P256dh,
                request.Auth,
                userAgent);

            return Ok(new { success = true });
        }

        [HttpDelete("subscribe")]
        [Authorize]
        public async Task<IActionResult> Unsubscribe([FromBody] UnsubscribePushRequest request)
        {
            if (!TryGetUserId(out var userId))
                return Unauthorized();

            await _pushNotificationService.UnsubscribeAsync(userId, request.Endpoint);
            return Ok(new { success = true });
        }

        private bool TryGetUserId(out Guid userId)
        {
            userId = Guid.Empty;
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return !string.IsNullOrEmpty(userIdValue) && Guid.TryParse(userIdValue, out userId);
        }
    }
}
