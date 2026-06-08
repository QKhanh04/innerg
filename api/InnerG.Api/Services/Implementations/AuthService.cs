using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using Google.Apis.Auth;
using InnerG.Api.Data;
using InnerG.Api.DTOs;
using InnerG.Api.Exceptions;
using InnerG.Api.Exceptions.Helpers;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using static InnerG.Api.DTOs.GoogleAuthDTO;

namespace InnerG.Api.Services.Implementations
{
    public class AuthService : IAuthService
    {
        private const string GoogleProvider = "Google";
        private readonly UserManager<AppUser> _userManager;
        private readonly SignInManager<AppUser> _signInManager;
        private readonly ITokenService _tokenService;
        private readonly IEmailService _emailService;
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AuthService> _logger;
        private readonly IInvitationService _invitationService;

        public AuthService(
            UserManager<AppUser> userManager,
            RoleManager<AppRole> roleManager,
            SignInManager<AppUser> signInManager,
            ITokenService tokenService,
            AppDbContext context,
            IEmailService emailService,
            IConfiguration configuration,
            ILogger<AuthService> logger,
            IInvitationService invitationService)
        {
            _userManager = userManager;
            _signInManager = signInManager;
            _tokenService = tokenService;
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
            _logger = logger;
            _invitationService = invitationService;
        }

        public async Task<AuthResponse> BootstrapCompanyAsync(BootstrapCompanyRequest request)
        {
            if (await _context.Users.IgnoreQueryFilters().AnyAsync(x => x.DeletedAt == null))
                throw new ConflictException("Bootstrap is only available before the first user is created");

            var domain = NormalizeDomain(request.EmailDomain);
            var hrEmail = NormalizeEmail(request.HrEmail);
            if (!EmailMatchesDomain(hrEmail, domain))
                throw new BadRequestException("HR email must belong to the company domain");

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var company = await _context.Companies.IgnoreQueryFilters().FirstOrDefaultAsync();
            if (company == null)
            {
                company = new Company();
                _context.Companies.Add(company);
            }

            company.Name = request.CompanyName.Trim();
            company.Domain = domain;
            company.Timezone = request.Timezone.Trim();
            company.Language = request.Language.Trim();
            company.IsActive = true;
            company.DeletedAt = null;
            await _context.SaveChangesAsync();

            var user = new AppUser
            {
                CompanyId = company.Id,
                UserName = await GenerateUniqueUserNameAsync(hrEmail),
                Email = hrEmail,
                FullName = request.HrFullName.Trim(),
                EmailConfirmed = true,
                IsActive = true
            };

            var createResult = await _userManager.CreateAsync(user, request.HrPassword);
            if (!createResult.Succeeded)
                throw IdentityErrorMapper.ToValidationException(createResult);

            await AddRolesAsync(user, [AuthRoles.HR]);
            await transaction.CommitAsync();

            return await CreateSessionAsync(user);
        }

        public async Task<CompanyOnboardingResponse> CreateCompanyAsync(CreateCompanyRequest request, string systemAdminUserId)
        {
            var domain = NormalizeDomain(request.EmailDomain);
            var hrEmail = NormalizeEmail(request.HrEmail);

            if (!Guid.TryParse(systemAdminUserId, out var inviterId))
                throw new UnauthorizedException();

            if (!request.AllowExternalHrEmail && !EmailMatchesDomain(hrEmail, domain))
                throw new BadRequestException("HR email must belong to the company domain");

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var existingCompany = await _context.Companies
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Domain == domain && x.DeletedAt == null);

            Company company;
            var action = "Create";
            if (existingCompany != null)
            {
                var hasMembers = await _context.Users
                    .IgnoreQueryFilters()
                    .AnyAsync(x => x.CompanyId == existingCompany.Id && x.DeletedAt == null);

                if (hasMembers)
                    throw new ConflictException("Company domain already exists");

                company = existingCompany;
                company.Name = request.CompanyName.Trim();
                company.Timezone = request.Timezone.Trim();
                company.Language = request.Language.Trim();
                company.IsActive = false;
                company.UpdatedAt = DateTime.UtcNow;
                action = "ResumeOnboarding";
            }
            else
            {
                company = new Company
                {
                    Name = request.CompanyName.Trim(),
                    Domain = domain,
                    Timezone = request.Timezone.Trim(),
                    Language = request.Language.Trim(),
                    IsActive = false
                };

                _context.Companies.Add(company);
            }

            await _context.SaveChangesAsync();

            var invite = await _invitationService.CreateFirstHrInviteAsync(
                company.Id,
                hrEmail,
                request.HrFullName,
                inviterId.ToString(),
                request.AllowExternalHrEmail);

            _context.AuditLogs.Add(new AuditLog
            {
                CompanyId = company.Id,
                UserId = inviterId,
                EntityType = "Company",
                EntityId = company.Id,
                Action = action,
                NewValueJson = JsonSerializer.Serialize(new
                {
                    company.Name,
                    company.Domain,
                    company.Timezone,
                    company.Language,
                    HrEmail = hrEmail,
                    request.AllowExternalHrEmail
                })
            });

            await _context.SaveChangesAsync();

            await transaction.CommitAsync();

            return new CompanyOnboardingResponse
            {
                Company = ToCompanyResponse(company),
                HrInvite = invite
            };
        }
        public async Task<InviteResponse> CreateInviteAsync(CreateInviteRequest request, string inviterUserId, Guid? currentCompanyId, bool isSystemAdmin, bool allowExternalEmail = false)
        {
            var companyId = request.CompanyId ?? currentCompanyId
                ?? throw new BadRequestException("CompanyId is required");

            if (!Guid.TryParse(inviterUserId, out var inviterId))
                throw new UnauthorizedException();

            if (!isSystemAdmin && currentCompanyId != companyId)
                throw new ForbiddenException("You cannot invite users outside your current company");

            var company = await _context.Companies
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == companyId && x.DeletedAt == null)
                ?? throw new NotFoundException("Company not found");

            if (!company.IsActive && !(isSystemAdmin && request.Roles.Any(x => string.Equals(x, AuthRoles.HR, StringComparison.OrdinalIgnoreCase))))
                throw new BadRequestException("Company is pending onboarding and can only receive the first HR invite");

            if (request.DepartmentId.HasValue)
            {
                var departmentExists = await _context.Departments
                    .IgnoreQueryFilters()
                    .AnyAsync(x => x.Id == request.DepartmentId && x.CompanyId == companyId && x.DeletedAt == null);

                if (!departmentExists)
                    throw new BadRequestException("Department does not belong to this company");
            }

            var email = NormalizeEmail(request.Email);
            if (!allowExternalEmail && !EmailMatchesDomain(email, company.Domain))
                throw new BadRequestException("Invite email must belong to the company domain");

            if (await _context.Users.IgnoreQueryFilters().AnyAsync(x => x.CompanyId == companyId && x.Email == email && x.DeletedAt == null))
                throw new ConflictException("User is already a member of this company");

            var pendingInvite = await _context.Invites
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.CompanyId == companyId && x.Email == email && x.Status == InviteStatus.Pending);

            if (pendingInvite != null && pendingInvite.ExpiresAt > DateTime.UtcNow)
                throw new ConflictException("A pending invite already exists for this email");

            if (pendingInvite != null && pendingInvite.ExpiresAt <= DateTime.UtcNow)
                pendingInvite.Status = InviteStatus.Expired;

            var roles = NormalizeCompanyRoles(request.Roles);
            var rawToken = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(48));
            var invite = new Invite
            {
                CompanyId = companyId,
                InviterId = inviterId,
                DepartmentId = request.DepartmentId,
                Email = email,
                FullName = string.IsNullOrWhiteSpace(request.FullName) ? null : request.FullName.Trim(),
                Position = string.IsNullOrWhiteSpace(request.Position) ? null : request.Position.Trim(),
                RolesCsv = string.Join(",", roles),
                TokenHash = HashToken(rawToken),
                ExpiresAt = DateTime.UtcNow.AddDays(GetInviteExpiryDays())
            };

            _context.Invites.Add(invite);
            await _context.SaveChangesAsync();

            var inviteLink = BuildInviteLink(rawToken);
            var emailDelivery = await TrySendInviteEmailAsync(
                email,
                $"You're invited to join {company.Name} on InnerG",
                $"""
                <h3>You're invited to InnerG</h3>
                <p>{company.Name} has invited you to join its internal learning workspace.</p>
                <p>Please click the link below to activate your account. This invite expires on {invite.ExpiresAt:yyyy-MM-dd HH:mm} UTC.</p>
                <a href="{inviteLink}">Accept invite</a>
                """);

            return ToInviteResponse(invite, company, rawToken, emailDelivery.Sent, emailDelivery.Message);
        }

        public async Task<BulkInviteResponse> CreateBulkInvitesAsync(BulkInviteRequest request, string inviterUserId, Guid? currentCompanyId, bool isSystemAdmin)
        {
            var response = new BulkInviteResponse();
            for (var i = 0; i < request.Invites.Count; i++)
            {
                var inviteRequest = request.Invites[i];
                try
                {
                    response.SuccessfulInvites.Add(await CreateInviteAsync(inviteRequest, inviterUserId, currentCompanyId, isSystemAdmin));
                }
                catch (AppException ex)
                {
                    response.Errors.Add(new BulkInviteError { Row = i + 1, Email = inviteRequest.Email, Error = ex.Message });
                }
            }

            response.SuccessCount = response.SuccessfulInvites.Count;
            response.ErrorCount = response.Errors.Count;
            return response;
        }

        public async Task<InviteResponse> ResendInviteAsync(Guid inviteId, string inviterUserId, Guid? currentCompanyId, bool isSystemAdmin)
        {
            var invite = await GetInviteForMutationAsync(inviteId, currentCompanyId, isSystemAdmin);
            if (invite.Status == InviteStatus.Accepted)
                throw new BadRequestException("Accepted invite cannot be resent");
            if (invite.Status == InviteStatus.Revoked)
                throw new BadRequestException("Revoked invite cannot be resent");
            if (!Guid.TryParse(inviterUserId, out var actorId))
                throw new UnauthorizedException();

            var rawToken = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(48));
            invite.InviterId = actorId;
            invite.TokenHash = HashToken(rawToken);
            invite.Status = InviteStatus.Pending;
            invite.ExpiresAt = DateTime.UtcNow.AddDays(GetInviteExpiryDays());
            invite.RevokedAt = null;
            invite.AcceptedAt = null;
            await _context.SaveChangesAsync();

            var inviteLink = BuildInviteLink(rawToken);
            var emailDelivery = await TrySendInviteEmailAsync(
                invite.Email,
                $"You're invited to join {invite.Company.Name} on InnerG",
                $"""<h3>You're invited to InnerG</h3><p>Please click the link below to activate your account.</p><a href="{inviteLink}">Accept invite</a>""");

            return ToInviteResponse(invite, invite.Company, rawToken, emailDelivery.Sent, emailDelivery.Message);
        }

        public async Task RevokeInviteAsync(Guid inviteId, string actorUserId, Guid? currentCompanyId, bool isSystemAdmin)
        {
            var invite = await GetInviteForMutationAsync(inviteId, currentCompanyId, isSystemAdmin);
            if (invite.Status != InviteStatus.Pending)
                throw new BadRequestException("Only pending invites can be revoked");

            invite.Status = InviteStatus.Revoked;
            invite.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task<InvitePreviewResponse> GetInviteAsync(string token)
        {
            var invite = await FindInviteByTokenAsync(token);
            await ExpireInviteIfNeededAsync(invite);

            return new InvitePreviewResponse
            {
                Email = invite.Email,
                FullName = invite.FullName,
                Position = invite.Position,
                CompanyId = invite.CompanyId,
                CompanyName = invite.Company.Name,
                Status = invite.Status,
                ExpiresAt = invite.ExpiresAt,
                Roles = invite.Roles.ToList()
            };
        }

        public async Task<AuthResponse> AcceptInviteAsync(AcceptInviteRequest request)
        {
            var invite = await FindInviteByTokenAsync(request.Token);
            await ExpireInviteIfNeededAsync(invite);

            if (invite.Status != InviteStatus.Pending)
                throw new BadRequestException("Invite is not active");

            if (await _context.Users.IgnoreQueryFilters().AnyAsync(x => x.CompanyId == invite.CompanyId && x.Email == invite.Email && x.DeletedAt == null))
                throw new ConflictException("User is already a member of this company");

            await using var transaction = await _context.Database.BeginTransactionAsync();

            var user = new AppUser
            {
                CompanyId = invite.CompanyId,
                DepartmentId = invite.DepartmentId,
                UserName = await GenerateUniqueUserNameAsync(invite.Email),
                Email = invite.Email,
                FullName = (request.FullName ?? invite.FullName ?? string.Empty).Trim(),
                AvatarUrl = request.AvatarUrl,
                JobTitle = invite.Position,
                EmailConfirmed = true,
                IsActive = true
            };

            var createResult = await _userManager.CreateAsync(user, request.Password);
            if (!createResult.Succeeded)
            {
                _logger.LogWarning("User creation failed for {Email}: {Errors}", invite.Email, string.Join(", ", createResult.Errors.Select(e => e.Description)));
                throw IdentityErrorMapper.ToValidationException(createResult);
            }

            await AddRolesAsync(user, invite.Roles);
            
            invite.Status = InviteStatus.Accepted;
            invite.AcceptedAt = DateTime.UtcNow;

            if (invite.Roles.Any(x => string.Equals(x, AuthRoles.HR, StringComparison.OrdinalIgnoreCase)) && !invite.Company.IsActive)
            {
                invite.Company.IsActive = true;
                invite.Company.UpdatedAt = DateTime.UtcNow;
            }

            await _context.SaveChangesAsync();
            await transaction.CommitAsync();

            _logger.LogInformation("Invite transaction committed for {Email}. Creating session...", invite.Email);
            return await CreateSessionAsync(user);
        }

        public async Task<AuthResponse> LoginAsync(LoginRequest request)
        {
            var candidates = await FindLoginCandidatesAsync(request.EmailOrUsername, request.CompanyId);
            if (!candidates.Any())
                throw new UnauthorizedException("Invalid credentials");

            var validUsers = new List<AppUser>();
            foreach (var candidate in candidates)
            {
                var result = await _signInManager.CheckPasswordSignInAsync(candidate, request.Password, lockoutOnFailure: true);
                if (result.IsLockedOut)
                    throw new UnauthorizedException("User account is locked");
                if (result.Succeeded)
                    validUsers.Add(candidate);
            }

            if (!validUsers.Any())
                throw new UnauthorizedException("Invalid credentials");

            if (validUsers.Any(x => x.TwoFactorEnabled) && string.IsNullOrWhiteSpace(request.TwoFactorCode))
            {
                foreach (var user in validUsers.Where(x => x.TwoFactorEnabled))
                    await SendTwoFactorLoginCodeAsync(user);

                return new AuthResponse
                {
                    UserId = validUsers[0].Id.ToString(),
                    UserName = validUsers[0].UserName ?? string.Empty,
                    FullName = validUsers[0].FullName,
                    Email = validUsers[0].Email ?? string.Empty,
                    RequiresTwoFactor = true,
                    RequiresWorkspaceSelection = !request.CompanyId.HasValue && validUsers.Count > 1,
                    Workspaces = await ToWorkspaceOptionsAsync(validUsers)
                };
            }

            if (!string.IsNullOrWhiteSpace(request.TwoFactorCode))
            {
                validUsers = (await Task.WhenAll(validUsers.Select(async user =>
                    !user.TwoFactorEnabled || await _userManager.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultEmailProvider, request.TwoFactorCode)
                        ? user
                        : null))).Where(x => x != null).Cast<AppUser>().ToList();

                if (!validUsers.Any())
                    throw new UnauthorizedException("Invalid two-factor code");
            }

            if (request.CompanyId.HasValue || validUsers.Count == 1)
                return await CreateSessionAsync(validUsers[0]);

            return new AuthResponse
            {
                UserId = validUsers[0].Id.ToString(),
                UserName = validUsers[0].UserName ?? string.Empty,
                FullName = validUsers[0].FullName,
                Email = validUsers[0].Email ?? string.Empty,
                RequiresWorkspaceSelection = true,
                Workspaces = await ToWorkspaceOptionsAsync(validUsers)
            };
        }

        public async Task<AuthResponse> LoginWithGoogleAsync(string idToken, Guid? companyId)
        {
            var payload = await VerifyGoogleTokenAsync(idToken);
            if (payload.EmailVerified != true)
                throw new UnauthorizedException("Google email is not verified");

            var email = NormalizeEmail(payload.Email);
            var candidates = await FindLoginCandidatesAsync(email, companyId);
            if (!candidates.Any())
                throw new UnauthorizedException("Account has not accepted an invite");

            foreach (var user in candidates)
            {
                if (string.IsNullOrWhiteSpace(user.SsoProvider))
                {
                    user.SsoProvider = GoogleProvider;
                    user.SsoUid = payload.Id;
                }
            }

            if (companyId.HasValue || candidates.Count == 1)
                return await CreateSessionAsync(candidates[0]);

            await _context.SaveChangesAsync();
            return new AuthResponse
            {
                UserId = candidates[0].Id.ToString(),
                UserName = candidates[0].UserName ?? string.Empty,
                FullName = candidates[0].FullName,
                Email = candidates[0].Email ?? string.Empty,
                RequiresWorkspaceSelection = true,
                Workspaces = await ToWorkspaceOptionsAsync(candidates)
            };
        }

        public async Task<GoogleUserInfo> VerifyGoogleTokenAsync(string idToken)
        {
            try
            {
                var settings = new GoogleJsonWebSignature.ValidationSettings
                {
                    Audience =
                    [
                        _configuration["GOOGLE_CLIENT_ID"] ?? throw new ConfigurationException("GOOGLE_CLIENT_ID")
                    ]
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

        public async Task LogoutAsync(string refreshToken)
        {
            var tokenHash = HashToken(refreshToken);
            var session = await _context.UserSessions.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.TokenHash == tokenHash);
            if (session == null)
                return;

            session.IsActive = false;
            session.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task LogoutAllAsync(string userId)
        {
            if (!Guid.TryParse(userId, out var id))
                return;

            await RevokeOldSessionsAsync(id);
            await _context.SaveChangesAsync();
        }

        public async Task<AuthResponse> RefreshTokenAsync(string refreshToken)
        {
            var tokenHash = HashToken(refreshToken);
            var session = await _context.UserSessions
                .IgnoreQueryFilters()
                .Include(x => x.User)
                .ThenInclude(x => x.Company)
                .FirstOrDefaultAsync(x => x.TokenHash == tokenHash);

            if (session == null || !session.IsActive || session.RevokedAt != null)
                throw new UnauthorizedException("Invalid refresh token");
            if (session.ExpiresAt <= DateTime.UtcNow)
                throw new UnauthorizedException("Refresh token expired");

            var user = session.User ?? throw new UnauthorizedException("User not found");
            if (!user.IsActive || user.DeletedAt != null || await _userManager.IsLockedOutAsync(user))
            {
                _logger.LogWarning("User {Email} is inactive or locked out", user.Email);
                throw new UnauthorizedException("User account is locked");
            }

            session.IsActive = false;
            session.RevokedAt = DateTime.UtcNow;

            return await CreateSessionAsync(user, revokeExisting: false);
        }

        public async Task ForgotPasswordAsync(ForgotPasswordRequest request)
        {
            var users = await FindLoginCandidatesAsync(request.Email, request.CompanyId);
            if (!users.Any())
                return;

            foreach (var user in users)
            {
                var token = await _userManager.GeneratePasswordResetTokenAsync(user);
                var resetLink = BuildResetPasswordLink(user.Id, token);
                var workspaceLabel = user.Company?.Name ?? "InnerG Platform Admin";
                await _emailService.SendPasswordResetAsync(
                    user.Email ?? request.Email,
                    "Reset your InnerG password",
                    $"""<h3>Reset your password</h3><p>Workspace: {workspaceLabel}</p><a href="{resetLink}">Reset password</a>""");
            }
        }

        public async Task ResetPasswordAsync(ResetPasswordRequest request)
        {
            if (!Guid.TryParse(request.UserId, out var userId))
                throw new BadRequestException("Invalid user id");

            var user = await _userManager.Users.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == userId)
                ?? throw new BadRequestException("Invalid reset token");

            var result = await _userManager.ResetPasswordAsync(user, request.Token, request.Password);
            if (!result.Succeeded)
                throw IdentityErrorMapper.ToValidationException(result);

            await RevokeOldSessionsAsync(user.Id);
            await _context.SaveChangesAsync();
        }

        public async Task SendTwoFactorEnableCodeAsync(string userId)
        {
            var user = await FindActiveUserByIdAsync(userId);
            await SendTwoFactorLoginCodeAsync(user);
        }

        public async Task EnableTwoFactorAsync(string userId, TwoFactorVerifyRequest request)
        {
            var user = await FindActiveUserByIdAsync(userId);
            var isValid = await _userManager.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultEmailProvider, request.Code);
            if (!isValid)
                throw new UnauthorizedException("Invalid two-factor code");
            await _userManager.SetTwoFactorEnabledAsync(user, true);
        }

        public async Task DisableTwoFactorAsync(string userId, TwoFactorVerifyRequest request)
        {
            var user = await FindActiveUserByIdAsync(userId);
            var isValid = await _userManager.VerifyTwoFactorTokenAsync(user, TokenOptions.DefaultEmailProvider, request.Code);
            if (!isValid)
                throw new UnauthorizedException("Invalid two-factor code");
            await _userManager.SetTwoFactorEnabledAsync(user, false);
        }

        public async Task<IList<UserSessionResponse>> GetSessionsAsync(string userId)
        {
            var user = await FindActiveUserByIdAsync(userId);
            return await _context.UserSessions
                .IgnoreQueryFilters()
                .Where(x => x.UserId == user.Id && x.DeletedAt == null)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new UserSessionResponse
                {
                    Id = x.Id,
                    DeviceInfo = x.DeviceInfo,
                    IpAddress = x.IpAddress,
                    IsActive = x.IsActive,
                    ExpiresAt = x.ExpiresAt,
                    CreatedAt = x.CreatedAt,
                    RevokedAt = x.RevokedAt
                })
                .ToListAsync();
        }

        public async Task RevokeSessionAsync(string userId, Guid sessionId)
        {
            var user = await FindActiveUserByIdAsync(userId);
            var session = await _context.UserSessions
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == sessionId && x.UserId == user.Id)
                ?? throw new NotFoundException("Session not found");

            session.IsActive = false;
            session.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task<UserInfoResponse> GetCurrentUserInfoAsync(string userId, Guid? companyId)
        {
            if (!Guid.TryParse(userId, out var id))
                throw new NotFoundException("User not found");

            var user = await _context.Users
                .IgnoreQueryFilters()
                .Include(x => x.Company)
                .Include(x => x.Department)
                .Include(x => x.UserSkills)
                    .ThenInclude(x => x.Skill)
                .Include(x => x.Badges)
                    .ThenInclude(x => x.Badge)
                .FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new NotFoundException("User not found");

            var roles = await _userManager.GetRolesAsync(user);

            return new UserInfoResponse
            {
                UserName = user.UserName ?? string.Empty,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                CompanyId = user.CompanyId,
                CompanyName = user.Company?.Name,
                Roles = roles,
                AvatarUrl = user.AvatarUrl,
                JobTitle = user.JobTitle,
                PhoneInternal = user.PhoneInternal,
                TotalInnerGPoints = user.TotalInnerGPoints,
                DepartmentName = user.Department?.Name,
                Skills = user.UserSkills.Select(us => new UserSkillDto
                {
                    SkillName = us.Skill.Name,
                    Proficiency = us.Proficiency.ToString(),
                    Source = us.Source.ToString()
                }).ToList(),
                Badges = user.Badges.Select(ub => new UserBadgeDto
                {
                    BadgeName = ub.Badge.Name,
                    Description = ub.Badge.Description,
                    IconUrl = ub.Badge.IconUrl,
                    AwardedAt = ub.AwardedAt
                }).ToList()
            };
        }

        public async Task UpdateProfileAsync(string userId, UpdateProfileRequest request)
        {
            if (!Guid.TryParse(userId, out var id))
                throw new NotFoundException("User not found");

            var user = await _context.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new NotFoundException("User not found");

            user.FullName = request.FullName.Trim();
            user.AvatarUrl = request.AvatarUrl;
            user.PhoneInternal = request.PhoneInternal?.Trim();
            user.UpdatedAt = DateTime.UtcNow;

            var result = await _userManager.UpdateAsync(user);
            if (!result.Succeeded)
                throw IdentityErrorMapper.ToValidationException(result);
        }

        public async Task ChangePasswordAsync(string userId, ChangePasswordRequest request)
        {
            if (!Guid.TryParse(userId, out var id))
                throw new NotFoundException("User not found");

            var user = await _userManager.Users.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == id)
                ?? throw new NotFoundException("User not found");

            var result = await _userManager.ChangePasswordAsync(user, request.OldPassword, request.NewPassword);
            if (!result.Succeeded)
                throw IdentityErrorMapper.ToValidationException(result);
        }

        public Task ConfirmEmailAsync(string userId, string token)
        {
            throw new BadRequestException("Email confirmation is not used with invite-based registration");
        }

        public Task ResendConfirmEmailAsync(string email)
        {
            throw new BadRequestException("Email confirmation is not used with invite-based registration");
        }

        private async Task<List<AppUser>> FindLoginCandidatesAsync(string account, Guid? companyId)
        {
            var normalizedAccount = NormalizeEmail(account);
            var query = _context.Users
                .IgnoreQueryFilters()
                .Include(x => x.Company)
                .Where(x =>
                    x.IsActive &&
                    x.DeletedAt == null &&
                    (x.CompanyId == null || (x.Company != null && x.Company.IsActive && x.Company.DeletedAt == null)));

            if (companyId.HasValue)
                query = query.Where(x => x.CompanyId == companyId.Value);

            return await query
                .Where(x => (x.Email != null && x.Email.ToLower() == normalizedAccount) || x.NormalizedUserName == account.ToUpperInvariant())
                .ToListAsync();
        }

        private async Task<AuthResponse> CreateSessionAsync(AppUser user, bool revokeExisting = true)
        {
            if (revokeExisting)
                await RevokeOldSessionsAsync(user.Id);

            var roles = await _userManager.GetRolesAsync(user);
            Company? company = null;
            if (user.CompanyId.HasValue)
            {
                company = user.Company ?? await _context.Companies.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == user.CompanyId.Value)
                    ?? throw new NotFoundException("Company not found");
            }

            var accessToken = _tokenService.GenerateAccessToken(user, roles, user.CompanyId, company?.Name);
            var rawRefreshToken = _tokenService.GenerateRefreshToken();

            _context.UserSessions.Add(new UserSession
            {
                UserId = user.Id,
                TokenHash = HashToken(rawRefreshToken),
                ExpiresAt = DateTime.UtcNow.AddDays(GetRefreshTokenDays())
            });

            user.LastLoginAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();

            return new AuthResponse
            {
                Token = accessToken,
                RefreshToken = rawRefreshToken,
                UserId = user.Id.ToString(),
                UserName = user.UserName ?? string.Empty,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                CompanyId = user.CompanyId,
                CompanyName = company?.Name,
                Roles = roles
            };
        }

        private async Task RevokeOldSessionsAsync(Guid userId)
        {
            var sessions = await _context.UserSessions
                .IgnoreQueryFilters()
                .Where(x => x.UserId == userId && x.IsActive)
                .ToListAsync();

            foreach (var session in sessions)
            {
                session.IsActive = false;
                session.RevokedAt = DateTime.UtcNow;
            }
        }

        private async Task AddRolesAsync(AppUser user, IEnumerable<string> roles)
        {
            var result = await _userManager.AddToRolesAsync(user, roles.Distinct(StringComparer.OrdinalIgnoreCase));
            if (!result.Succeeded)
                throw IdentityErrorMapper.ToValidationException(result);
        }

        private async Task<AppUser> FindActiveUserByIdAsync(string userId)
        {
            if (!Guid.TryParse(userId, out var id))
                throw new UnauthorizedException();

            return await _context.Users
                .IgnoreQueryFilters()
                .Include(x => x.Company)
                .FirstOrDefaultAsync(x =>
                    x.Id == id &&
                    x.IsActive &&
                    x.DeletedAt == null &&
                    (x.CompanyId == null || (x.Company != null && x.Company.IsActive && x.Company.DeletedAt == null)))
                ?? throw new UnauthorizedException("User not found");
        }

        private async Task<Invite> GetInviteForMutationAsync(Guid inviteId, Guid? currentCompanyId, bool isSystemAdmin)
        {
            var query = _context.Invites
                .IgnoreQueryFilters()
                .Include(x => x.Company)
                .Where(x => x.Id == inviteId);

            if (!isSystemAdmin && currentCompanyId.HasValue)
                query = query.Where(x => x.CompanyId == currentCompanyId.Value);

            return await query.FirstOrDefaultAsync()
                ?? throw new NotFoundException("Invite not found");
        }

        private async Task<Invite> FindInviteByTokenAsync(string token)
        {
            if (string.IsNullOrWhiteSpace(token))
                throw new BadRequestException("Invite token is required");

            var tokenHash = HashToken(token);
            return await _context.Invites
                .IgnoreQueryFilters()
                .Include(x => x.Company)
                .FirstOrDefaultAsync(x => x.TokenHash == tokenHash)
                ?? throw new NotFoundException("Invite not found");
        }


        private async Task ExpireInviteIfNeededAsync(Invite invite)
        {
            if (invite.Status == InviteStatus.Pending && invite.ExpiresAt <= DateTime.UtcNow)
            {
                invite.Status = InviteStatus.Expired;
                await _context.SaveChangesAsync();
            }
        }

        private async Task<IList<WorkspaceOption>> ToWorkspaceOptionsAsync(IEnumerable<AppUser> users)
        {
            var options = new List<WorkspaceOption>();
            foreach (var user in users)
            {
                if (user.CompanyId == null || user.Company == null)
                    continue;

                var roles = await _userManager.GetRolesAsync(user);
                options.Add(new WorkspaceOption
                {
                    CompanyId = user.CompanyId,
                    CompanyName = user.Company.Name,
                    EmailDomain = user.Company.Domain,
                    Roles = roles
                });
            }

            return options;
        }

        private static IList<string> NormalizeCompanyRoles(IList<string> roles)
        {
            var requestedRoles = roles.Count == 0 ? [AuthRoles.Mentee] : roles;
            return requestedRoles.Select(NormalizeCompanyRole).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        }

        private static string NormalizeCompanyRole(string role)
        {
            var normalized = AuthRoles.CompanyRoles.FirstOrDefault(x => string.Equals(x, role, StringComparison.OrdinalIgnoreCase));
            return normalized ?? throw new BadRequestException($"Invalid company role: {role}");
        }

        private InviteResponse ToInviteResponse(Invite invite, Company company, string rawToken, bool emailSent = false, string? emailDeliveryMessage = null)
        {
            return new InviteResponse
            {
                Id = invite.Id,
                Email = invite.Email,
                CompanyId = company.Id,
                CompanyName = company.Name,
                Status = invite.Status,
                ExpiresAt = invite.ExpiresAt,
                Roles = invite.Roles.ToList(),
                InviteLink = BuildInviteLink(rawToken),
                EmailSent = emailSent,
                EmailDeliveryMessage = emailDeliveryMessage ?? (emailSent ? "Invite email sent" : "Invite email was not sent")
            };
        }

        private static CompanyResponse ToCompanyResponse(Company company)
        {
            return new CompanyResponse
            {
                Id = company.Id,
                Name = company.Name,
                EmailDomain = company.Domain,
                Timezone = company.Timezone,
                Language = company.Language
            };
        }

        private string BuildInviteLink(string rawToken)
        {
            var configuredUrl = _configuration["Frontend:AcceptInviteUrl"];
            if (!string.IsNullOrWhiteSpace(configuredUrl))
                return $"{configuredUrl}?token={Uri.EscapeDataString(rawToken)}";

            var frontendUrl = _configuration.GetSection("Frontend:Urls").Get<string[]>()?.FirstOrDefault()
                ?? "http://localhost:5173";

            return $"{frontendUrl.TrimEnd('/')}/accept-invite?token={Uri.EscapeDataString(rawToken)}";
        }

        private string BuildResetPasswordLink(Guid userId, string token)
        {
            var configuredUrl = _configuration["Frontend:ResetPasswordUrl"];
            if (!string.IsNullOrWhiteSpace(configuredUrl))
                return $"{configuredUrl}?userId={userId}&token={Uri.EscapeDataString(token)}";

            var frontendUrl = _configuration.GetSection("Frontend:Urls").Get<string[]>()?.FirstOrDefault()
                ?? "http://localhost:5173";

            return $"{frontendUrl.TrimEnd('/')}/reset-password?userId={userId}&token={Uri.EscapeDataString(token)}";
        }

        private async Task SendTwoFactorLoginCodeAsync(AppUser user)
        {
            var code = await _userManager.GenerateTwoFactorTokenAsync(user, TokenOptions.DefaultEmailProvider);
            await _emailService.SendTwoFactorCodeAsync(
                user.Email ?? string.Empty,
                "Your InnerG verification code",
                $"""<h3>InnerG verification code</h3><p>Your verification code is <strong>{code}</strong>.</p>""");
        }

        private int GetInviteExpiryDays()
        {
            var configured = _configuration["Invites:ExpireDays"];
            return int.TryParse(configured, out var days) && days > 0 ? days : 7;
        }

        private int GetRefreshTokenDays()
        {
            var configured = _configuration["Jwt:RefreshTokenDays"];
            return int.TryParse(configured, out var days) && days > 0 ? days : 7;
        }

        private static string HashToken(string token)
        {
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private static string NormalizeEmail(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                return string.Empty;

            return email.Trim().ToLowerInvariant();
        }

        private async Task<(bool Sent, string Message)> TrySendInviteEmailAsync(string toEmail, string subject, string html)
        {
            try
            {
                await _emailService.SendInviteAsync(toEmail, subject, html);
                return (true, "Invite email sent");
            }
            catch (ConfigurationException ex)
            {
                _logger.LogWarning(ex, "Invite email skipped because SMTP is not configured for {Email}", toEmail);
                return (false, "SMTP is not configured. Use the invite link manually or configure SMTP to send email.");
            }
            catch (ExternalServiceException ex)
            {
                _logger.LogWarning(ex, "Invite email could not be sent to {Email}", toEmail);
                return (false, "Invite email could not be sent. Use the invite link manually or retry after checking SMTP.");
            }
        }

        private static string NormalizeDomain(string domain)
        {
            if (string.IsNullOrWhiteSpace(domain))
                return string.Empty;

            var normalized = domain.Trim().ToLowerInvariant();

            if (normalized.Contains("://", StringComparison.Ordinal))
            {
                if (Uri.TryCreate(normalized, UriKind.Absolute, out var uri) && !string.IsNullOrWhiteSpace(uri.Host))
                    normalized = uri.Host;
            }

            normalized = normalized.TrimStart('@');

            if (normalized.StartsWith("www.", StringComparison.Ordinal))
                normalized = normalized[4..];

            if (normalized.Contains('@', StringComparison.Ordinal))
                normalized = normalized[(normalized.LastIndexOf('@') + 1)..];

            return normalized.Trim().TrimEnd('/');
        }

        private static bool EmailMatchesDomain(string email, string domain)
        {
            var normalizedDomain = NormalizeDomain(domain);
            return email.EndsWith($"@{normalizedDomain}", StringComparison.OrdinalIgnoreCase);
        }

        private async Task<string> GenerateUniqueUserNameAsync(string email)
        {
            var baseUserName = NormalizeEmail(email);
            if (string.IsNullOrWhiteSpace(baseUserName))
                baseUserName = $"user-{Guid.NewGuid():N}";

            var candidate = baseUserName;
            var suffix = 2;

            while (await _context.Users.IgnoreQueryFilters().AnyAsync(x => x.NormalizedUserName == candidate.ToUpperInvariant()))
            {
                candidate = $"{baseUserName}-{suffix}";
                suffix++;
            }

            return candidate;
        }
    }
}
