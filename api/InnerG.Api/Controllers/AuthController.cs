using System.Security.Claims;
using InnerG.Api.DTOs;
using InnerG.Api.Exceptions.Helpers;
using InnerG.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using static InnerG.Api.DTOs.GoogleAuthDTO;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthService _authService;

        public AuthController(IAuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> LoginAsync([FromBody] LoginRequest request)
        {
            ValidationHelper.FromModelState(ModelState);
            var result = await _authService.LoginAsync(request);

            if (!string.IsNullOrEmpty(result.RefreshToken))
                SetRefreshTokenCookie(result.RefreshToken);

            return Ok(result);
        }

        [HttpPost("google-login")]
        [AllowAnonymous]
        public async Task<IActionResult> GoogleLoginAsync([FromBody] GoogleLoginRequest request)
        {
            ValidationHelper.FromModelState(ModelState);
            var result = await _authService.LoginWithGoogleAsync(request.IdToken, request.CompanyId);

            if (!string.IsNullOrEmpty(result.RefreshToken))
                SetRefreshTokenCookie(result.RefreshToken);

            return Ok(result);
        }

        [HttpPost("bootstrap-company")]
        [AllowAnonymous]
        public async Task<IActionResult> BootstrapCompanyAsync([FromBody] BootstrapCompanyRequest request)
        {
            ValidationHelper.FromModelState(ModelState);
            var result = await _authService.BootstrapCompanyAsync(request);
            SetRefreshTokenCookie(result.RefreshToken);
            return StatusCode(StatusCodes.Status201Created, result);
        }

        [HttpPost("companies")]
        [Authorize(Roles = "SystemAdmin")]
        public async Task<IActionResult> CreateCompanyAsync([FromBody] CreateCompanyRequest request)
        {
            ValidationHelper.FromModelState(ModelState);
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(currentUserId))
                return Unauthorized();

            var result = await _authService.CreateCompanyAsync(request, currentUserId);
            return StatusCode(StatusCodes.Status201Created, result);
        }


        [HttpGet("invites/{token}")]
        [AllowAnonymous]
        public async Task<IActionResult> GetInviteAsync(string token)
        {
            var result = await _authService.GetInviteAsync(token);
            return Ok(result);
        }

        [HttpPost("accept-invite")]
        [AllowAnonymous]
        public async Task<IActionResult> AcceptInviteAsync([FromBody] AcceptInviteRequest request)
        {
            ValidationHelper.FromModelState(ModelState);
            var result = await _authService.AcceptInviteAsync(request);
            SetRefreshTokenCookie(result.RefreshToken);
            return Ok(result);
        }

        [HttpPost("refresh-token")]
        [AllowAnonymous]
        public async Task<IActionResult> RefreshTokenAsync()
        {
            var refreshToken = Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(refreshToken))
                return Unauthorized();

            var result = await _authService.RefreshTokenAsync(refreshToken);
            SetRefreshTokenCookie(result.RefreshToken);
            return Ok(result);
        }

        [HttpPost("forgot-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ForgotPasswordAsync([FromBody] ForgotPasswordRequest request)
        {
            ValidationHelper.FromModelState(ModelState);
            await _authService.ForgotPasswordAsync(request);
            return Ok(new { message = "If the email is valid, you will receive reset instructions." });
        }

        [HttpPost("reset-password")]
        [AllowAnonymous]
        public async Task<IActionResult> ResetPasswordAsync([FromBody] ResetPasswordRequest request)
        {
            ValidationHelper.FromModelState(ModelState);
            await _authService.ResetPasswordAsync(request);
            return NoContent();
        }

        [Authorize]
        [HttpPost("2fa/send-enable-code")]
        public async Task<IActionResult> SendTwoFactorEnableCodeAsync()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            await _authService.SendTwoFactorEnableCodeAsync(userId);
            return NoContent();
        }

        [Authorize]
        [HttpPost("2fa/enable")]
        public async Task<IActionResult> EnableTwoFactorAsync([FromBody] TwoFactorVerifyRequest request)
        {
            ValidationHelper.FromModelState(ModelState);
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            await _authService.EnableTwoFactorAsync(userId, request);
            return NoContent();
        }

        [Authorize]
        [HttpPost("2fa/disable")]
        public async Task<IActionResult> DisableTwoFactorAsync([FromBody] TwoFactorVerifyRequest request)
        {
            ValidationHelper.FromModelState(ModelState);
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            await _authService.DisableTwoFactorAsync(userId, request);
            return NoContent();
        }

        [Authorize]
        [HttpGet("sessions")]
        public async Task<IActionResult> GetSessionsAsync()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var result = await _authService.GetSessionsAsync(userId);
            return Ok(result);
        }

        [Authorize]
        [HttpPost("sessions/{sessionId:guid}/revoke")]
        public async Task<IActionResult> RevokeSessionAsync(Guid sessionId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            await _authService.RevokeSessionAsync(userId, sessionId);
            return NoContent();
        }

        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var refreshToken = Request.Cookies["refresh_token"];
            if (string.IsNullOrEmpty(refreshToken))
                return NoContent();

            await _authService.LogoutAsync(refreshToken);
            DeleteRefreshTokenCookie();
            return NoContent();
        }

        [Authorize]
        [HttpPost("logout-all")]
        public async Task<IActionResult> LogoutAll()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            await _authService.LogoutAllAsync(userId);
            DeleteRefreshTokenCookie();
            return NoContent();
        }

        [HttpGet("verify-email")]
        public async Task<IActionResult> VerifyEmail([FromQuery] string userId, [FromQuery] string token)
        {
            await _authService.ConfirmEmailAsync(userId, token);
            return Ok(new { message = "Email verified successfully" });
        }

        [HttpPost("resend-verification-email")]
        public async Task<IActionResult> ResendVerificationEmail([FromBody] string email)
        {
            await _authService.ResendConfirmEmailAsync(email);
            return Ok(new { message = "Confirmation email resent" });
        }

        [Authorize]
        [HttpGet("users/{userId}")]
        public async Task<IActionResult> GetUserInfo(string userId)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId != userId)
                return Forbid();

            var result = await _authService.GetCurrentUserInfoAsync(userId, GetCurrentCompanyId());
            return Ok(result);
        }

        [Authorize]
        [HttpPatch("users/{userId}")]
        public async Task<IActionResult> UpdateProfile(string userId, [FromBody] UpdateProfileRequest request)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (currentUserId != userId)
                return Forbid();

            await _authService.UpdateProfileAsync(userId, request);
            return NoContent();
        }

        [Authorize]
        [HttpPost("change-password")]
        public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordRequest request)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            await _authService.ChangePasswordAsync(userId, request);
            return NoContent();
        }

        [Authorize]
        [HttpGet("claims")]
        public IActionResult Claims()
        {
            return Ok(User.Claims.Select(c => new { c.Type, c.Value }));
        }

        private void SetRefreshTokenCookie(string refreshToken)
        {
            var isHttps = Request.IsHttps;
            var options = new CookieOptions
            {
                HttpOnly = true,
                SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
                Secure = isHttps,
                Expires = DateTime.UtcNow.AddDays(7),
                Path = "/api/auth"
            };

            Response.Cookies.Append("refresh_token", refreshToken, options);
        }

        private void DeleteRefreshTokenCookie()
        {
            var isHttps = Request.IsHttps;
            var options = new CookieOptions
            {
                SameSite = isHttps ? SameSiteMode.None : SameSiteMode.Lax,
                Secure = isHttps,
                Path = "/api/auth"
            };
            Response.Cookies.Delete("refresh_token", options);
        }

        private Guid? GetCurrentCompanyId()
        {
            var companyIdValue = User.FindFirstValue("company_id") ?? User.FindFirstValue("CompanyId");
            if (Guid.TryParse(companyIdValue, out var companyId))
                return companyId;

            return null;
        }

        private bool IsSystemAdmin()
        {
            return User.IsInRole("SystemAdmin");
        }
    }
}
// Trigger watch rebuild
