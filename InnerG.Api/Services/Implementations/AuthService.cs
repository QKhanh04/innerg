using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using InnerG.Api.Data;
using InnerG.Api.DTOs;
using InnerG.Api.Exceptions;
using InnerG.Api.Exceptions.Helpers;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Google.Apis.Auth;
using static InnerG.Api.DTOs.GoogleAuthDTO;

namespace InnerG.Api.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private const string GoogleProvider = "Google";
        private const string DefaultRole = "User";

        private readonly UserManager<AppUser> _userManager;
        private readonly RoleManager<AppRole> _roleManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;

        public AuthService(
            UserManager<AppUser> userManager,
            RoleManager<AppRole> roleManager,
            SignInManager<AppUser> signInManager,
            ITokenService tokenService,
            AppDbContext context,
            IEmailService emailService,
            IConfiguration configuration,
            ILogger<AuthService> logger)
        {
            _userManager = userManager;
            _roleManager = roleManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
        }

        public async Task<RegisterResponse> RegisterAsync(RegisterRequest register)
        {
            var existingUsername = await _userManager.FindByNameAsync(register.UserName);
            if (existingUsername != null)
                throw new ConflictException("Username already exists");

            var existingEmail = await _userManager.FindByEmailAsync(register.Email);

            if (existingEmail == null)
            {
                await CreateNewUserAsync(register);
                return new RegisterResponse { RequiresEmailConfirmation = true };
            }

            if (await _userManager.HasPasswordAsync(existingEmail))
                throw new ConflictException("Email already exists");

            await AddPasswordToExistingUserAsync(existingEmail, register);
            return new RegisterResponse { RequiresEmailConfirmation = false };
        }

        private async Task CreateNewUserAsync(RegisterRequest register)
        {
            // Note: In a real SaaS, we would need to know which Company the user is registering for.
            // For now, we'll assume a default company or handle it via a specific invitation flow.
            // For Phase 1, we'll just create a user with an empty CompanyId and let the seeder or admin fix it,
            // or we pick the first company available.
            var defaultCompany = await _context.Companies.FirstOrDefaultAsync() 
                                ?? throw new BadRequestException("No company found in the system. Please contact admin.");

            var user = new AppUser
            {
                UserName = register.UserName,
                Email = register.Email,
                EmailConfirmed = false,
                CompanyId = defaultCompany.Id,
                FullName = register.UserName // Placeholder
            };

            var createResult = await _userManager.CreateAsync(user, register.Password);
            if (!createResult.Succeeded)
                throw IdentityErrorMapper.ToValidationException(createResult);

            try
            {
                await EnsureDefaultRoleAsync(user);
                await SendConfirmEmailAsync(user);
            }
            catch
            {
                await _userManager.DeleteAsync(user);
                throw;
            }
        }

        private async Task AddPasswordToExistingUserAsync(AppUser user, RegisterRequest register)
        {
            var usernameOwner = await _userManager.FindByNameAsync(register.UserName);
            if (usernameOwner != null && usernameOwner.Id != user.Id)
                throw new ConflictException("Username already exists");

            var addPasswordResult = await _userManager.AddPasswordAsync(user, register.Password);
            if (!addPasswordResult.Succeeded)
                throw IdentityErrorMapper.ToValidationException(addPasswordResult);

            if (!string.Equals(user.UserName, register.UserName, StringComparison.OrdinalIgnoreCase))
            {
                user.UserName = register.UserName;
                var updateResult = await _userManager.UpdateAsync(user);
                if (!updateResult.Succeeded)
                    throw IdentityErrorMapper.ToValidationException(updateResult);
            }

            if (!await _userManager.IsInRoleAsync(user, DefaultRole))
            {
                await EnsureDefaultRoleAsync(user);
            }
        }

        private async Task<AppUser?> FindUserAsync(string account)
        {
            var userByEmail = await _userManager.FindByEmailAsync(account);
            if (userByEmail != null) return userByEmail;
            return await _userManager.FindByNameAsync(account);
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var user = await FindUserAsync(request.EmailOrUsername)
                       ?? throw new UnauthorizedException("Invalid credentials");

            if (!user.EmailConfirmed)
                throw new UnauthorizedException("Email is not confirmed");

            var result = await _signInManager.CheckPasswordSignInAsync(user, request.Password, lockoutOnFailure: true);

            if (result.IsLockedOut)
                throw new UnauthorizedException("User account is locked");

            if (!result.Succeeded)
                throw new UnauthorizedException("Invalid credentials");

            return await GenerateAuthResponseAsync(user);
        }

        public async Task<AuthResponse> LoginWithGoogleAsync(string idToken)
        {
            var payload = await VerifyGoogleTokenAsync(idToken);
            if (payload.EmailVerified != true)
                throw new UnauthorizedException("Google email is not verified");

            if (string.IsNullOrWhiteSpace(payload.Email))
                throw new UnauthorizedException("Google account has no email");

            var providerKey = payload.Id;
            var user = await _userManager.FindByLoginAsync(GoogleProvider, providerKey);

            if (user == null)
            {
                user = await _userManager.FindByEmailAsync(payload.Email);
                if (user == null)
                {
                    var defaultCompany = await _context.Companies.FirstOrDefaultAsync() 
                                        ?? throw new BadRequestException("No company found in the system.");

                    user = new AppUser
                    {
                        UserName = payload.Email,
                        Email = payload.Email,
                        EmailConfirmed = true,
                        CompanyId = defaultCompany.Id,
                        FullName = payload.Name ?? payload.Email
                    };

                    var result = await _userManager.CreateAsync(user);
                    if (!result.Succeeded)
                        throw IdentityErrorMapper.ToValidationException(result);

                    await EnsureDefaultRoleAsync(user);
                }

                var existingLogins = await _userManager.GetLoginsAsync(user);
                if (!existingLogins.Any(x => x.LoginProvider == GoogleProvider))
                {
                    var loginInfo = new UserLoginInfo(GoogleProvider, providerKey, GoogleProvider);
                    var addLoginResult = await _userManager.AddLoginAsync(user, loginInfo);
                    if (!addLoginResult.Succeeded)
                        throw IdentityErrorMapper.ToValidationException(addLoginResult);
                }
            }

            if (await _userManager.IsLockedOutAsync(user))
                throw new UnauthorizedException("User account is locked");

            return await GenerateAuthResponseAsync(user);
        }

        public async Task<GoogleUserInfo> VerifyGoogleTokenAsync(string idToken)
        {
            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings()
                {
                    Audience = new List<string>() {
                        _configuration["GOOGLE_CLIENT_ID"] ?? throw new ConfigurationException("GOOGLE_CLIENT_ID")
                    }
                };
                var payload = await GoogleJsonWebSignature.ValidateAsync(idToken, settings);
                return new GoogleUserInfo
                {
                    Id = payload.Subject,
                    Email = payload.Email,
                    Name = payload.Name,
                    GivenName = payload.GivenName,
                    FamilyName = payload.FamilyName,
                    Picture = payload.Picture,
                    EmailVerified = payload.EmailVerified
                };
            }
            catch
            {
                throw new UnauthorizedException("Invalid Google ID token");
            }
        }

        private async Task<AuthResponse> GenerateAuthResponseAsync(AppUser user)
        {
            var roles = await _userManager.GetRolesAsync(user);

            var accessToken = _tokenService.GenerateAccessToken(user, roles);
            var refreshToken = _tokenService.GenerateRefreshToken(user.Id);

            await RevokeOldRefreshTokensAsync(user.Id);

            _context.UserSessions.Add(refreshToken);
            await _context.SaveChangesAsync();

            return new AuthResponse
            {
                Token = accessToken,
                RefreshToken = refreshToken.TokenHash,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty
            };
        }

        private async Task EnsureDefaultRoleAsync(AppUser user)
        {
            if (!await _roleManager.RoleExistsAsync(DefaultRole))
            {
                await _roleManager.CreateAsync(new AppRole(DefaultRole));
            }

            var result = await _userManager.AddToRoleAsync(user, DefaultRole);
            if (!result.Succeeded)
                throw IdentityErrorMapper.ToValidationException(result);
        }

        private async Task RevokeOldRefreshTokensAsync(Guid userId)
        {
            var sessions = await _context.UserSessions
                .Where(x => x.UserId == userId && x.IsActive)
                .ToListAsync();

            foreach (var session in sessions)
            {
                session.IsActive = false;
                session.RevokedAt = DateTime.UtcNow;
            }
        }

        public async Task LogoutAsync(string refreshToken)
        {
            var session = await _context.UserSessions
                .FirstOrDefaultAsync(x => x.TokenHash == refreshToken);

            if (session == null) return;

            session.IsActive = false;
            session.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task LogoutAllAsync(string userId)
        {
            var userGuid = Guid.Parse(userId);
            await RevokeOldRefreshTokensAsync(userGuid);
            await _context.SaveChangesAsync();
        }

        public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
        {
            var session = await _context.UserSessions
                .Include(x => x.User)
                .FirstOrDefaultAsync(x => x.TokenHash == refreshToken);

            if (session == null)
                throw new UnauthorizedException("Invalid refresh token");

            if (session.ExpiresAt <= DateTime.UtcNow)
                throw new UnauthorizedException("Refresh token expired");

            if (!session.IsActive)
            {
                await RevokeOldRefreshTokensAsync(session.UserId);
                await _context.SaveChangesAsync();
                throw new UnauthorizedException("Revoked refresh token");
            }

            var user = session.User ?? throw new UnauthorizedException("User not found");
            if (await _userManager.IsLockedOutAsync(user))
                throw new UnauthorizedException("User account is locked");

            var roles = await _userManager.GetRolesAsync(user);

            session.IsActive = false;
            session.RevokedAt = DateTime.UtcNow;

            var newAccessToken = _tokenService.GenerateAccessToken(user, roles);
            var newRefreshToken = _tokenService.GenerateRefreshToken(user.Id);

            _context.UserSessions.Add(newRefreshToken);
            await _context.SaveChangesAsync();

            return new AuthResponse
            {
                Token = newAccessToken,
                RefreshToken = newRefreshToken.TokenHash,
                UserName = user.UserName!,
                Email = user.Email!
            };
        }

        public async Task<UserInfoResponse> GetCurrentUserInfoAsync(string userId)
        {
            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                throw new NotFoundException("User not found");

            var roles = await _userManager.GetRolesAsync(user);

            return new UserInfoResponse
            {
                UserName = user.UserName ?? "",
                Email = user.Email ?? "",
                Roles = roles
            };
        }

        private async Task SendConfirmEmailAsync(AppUser user)
        {
            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            var confirmBaseUrl = _configuration["Frontend:ConfirmEmailUrl"] ?? throw new ConfigurationException("Frontend:ConfirmEmailUrl");
            var confirmLink = $"{confirmBaseUrl}?userId={user.Id}&token={Uri.EscapeDataString(token)}";

            await _emailService.SendEmailConfirmationAsync(
                user.Email!,
                "Confirm your email",
                $"<h3>Welcome!</h3><p>Please confirm your email by clicking the link below:</p><a href=\"{confirmLink}\">Confirm Email</a>"
            );
        }

        public async Task ConfirmEmailAsync(string userId, string token)
        {
            var user = await _userManager.FindByIdAsync(userId) ?? throw new NotFoundException("User not found");
            var result = await _userManager.ConfirmEmailAsync(user, Uri.UnescapeDataString(token));
            if (!result.Succeeded)
                throw new BadRequestException("Invalid or expired confirmation token");
        }

        public async Task ResendConfirmEmailAsync(string email)
        {
            var user = await _userManager.FindByEmailAsync(email) ?? throw new NotFoundException("User not found");
            if (user.EmailConfirmed)
                throw new BadRequestException("Email already confirmed");
            await SendConfirmEmailAsync(user);
        }
    }
}