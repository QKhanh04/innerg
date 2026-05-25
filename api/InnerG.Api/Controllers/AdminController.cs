using System.Security.Claims;
using System.Text.Json;
using InnerG.Api.Data;
using InnerG.Api.DTOs;
using InnerG.Api.Exceptions;
using InnerG.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/admin")]
    [Authorize(Roles = AuthRoles.SystemAdmin)]
    public class AdminController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AdminController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverviewAsync()
        {
            var companies = await GetCompaniesInternalAsync();
            var recentActivity = await GetRecentActivityInternalAsync(8);
            var roleDistribution = await GetRoleDistributionInternalAsync();

            var response = new AdminOverviewResponse
            {
                TotalCompanies = companies.Count,
                ActiveCompanies = companies.Count(x => x.IsActive),
                PendingInvites = await _context.Invites.IgnoreQueryFilters().CountAsync(x => x.Status == InviteStatus.Pending),
                ActiveSubscriptions = await _context.CompanySubscriptions.IgnoreQueryFilters().CountAsync(x => x.Status == SubscriptionStatus.Active),
                ActiveSessions = await _context.UserSessions.IgnoreQueryFilters().CountAsync(x => x.IsActive && x.RevokedAt == null && x.ExpiresAt > DateTime.UtcNow),
                PrivilegedAccounts = await CountPrivilegedAccountsAsync(),
                AuditEventsLast7Days = await _context.AuditLogs.IgnoreQueryFilters().CountAsync(x => x.CreatedAt >= DateTime.UtcNow.AddDays(-7)),
                PlatformSettings = BuildPlatformSettings(),
                Companies = companies.Take(6).ToList(),
                RoleDistribution = roleDistribution,
                RecentActivity = recentActivity
            };

            return Ok(response);
        }

        [HttpGet("companies")]
        public async Task<IActionResult> GetCompaniesAsync()
        {
            return Ok(await GetCompaniesInternalAsync());
        }

        [HttpGet("companies/{companyId:guid}")]
        public async Task<IActionResult> GetCompanyDetailAsync(Guid companyId)
        {
            var company = (await GetCompaniesInternalAsync())
                .FirstOrDefault(x => x.Id == companyId)
                ?? throw new NotFoundException("Company not found");

            var pendingInvites = await _context.Invites.IgnoreQueryFilters()
                .Where(x => x.CompanyId == companyId && x.Status == InviteStatus.Pending)
                .OrderBy(x => x.ExpiresAt)
                .Take(8)
                .Select(x => new AdminInviteResponse
                {
                    Id = x.Id,
                    Email = x.Email,
                    FullName = x.FullName,
                    RolesCsv = x.RolesCsv,
                    ExpiresAt = x.ExpiresAt,
                    Status = x.Status
                })
                .ToListAsync();

            var keyMembers = await GetCompanyMemberSummariesAsync(companyId);
            var recentActivity = await GetRecentActivityInternalAsync(12, companyId);

            return Ok(new AdminCompanyDetailResponse
            {
                Company = company,
                PendingInvites = pendingInvites,
                KeyMembers = keyMembers,
                RecentActivity = recentActivity
            });
        }

        [HttpPatch("companies/{companyId:guid}/status")]
        public async Task<IActionResult> UpdateCompanyStatusAsync(Guid companyId, [FromBody] UpdateCompanyStatusRequest request)
        {
            var company = await _context.Companies.IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == companyId)
                ?? throw new NotFoundException("Company not found");

            if (company.DeletedAt != null)
                throw new BadRequestException("Deleted company cannot be activated or deactivated");

            if (company.IsActive == request.IsActive)
                return NoContent();

            var oldValue = company.IsActive;
            company.IsActive = request.IsActive;
            company.UpdatedAt = DateTime.UtcNow;

            await AddAuditLogAsync(
                companyId,
                "Company",
                company.Id,
                request.IsActive ? "Activate" : "Deactivate",
                new { isActive = oldValue },
                new { isActive = request.IsActive });

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("companies/{companyId:guid}")]
        public async Task<IActionResult> UpdateCompanyAsync(Guid companyId, [FromBody] UpdateCompanyRequest request)
        {
            var company = await _context.Companies.IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == companyId)
                ?? throw new NotFoundException("Company not found");

            if (company.DeletedAt != null)
                throw new BadRequestException("Deleted company cannot be edited");

            var normalizedDomain = request.Domain.Trim().TrimStart('@').ToLowerInvariant();
            if (string.IsNullOrWhiteSpace(request.Name))
                throw new BadRequestException("Company name is required");

            if (string.IsNullOrWhiteSpace(normalizedDomain))
                throw new BadRequestException("Company domain is required");

            var domainExists = await _context.Companies.IgnoreQueryFilters()
                .AnyAsync(x => x.Id != companyId && x.DeletedAt == null && x.Domain == normalizedDomain);

            if (domainExists)
                throw new ConflictException("Company domain already exists");

            var oldValue = new
            {
                company.Name,
                company.Domain,
                company.LogoUrl,
                company.Timezone,
                company.Language
            };

            company.Name = request.Name.Trim();
            company.Domain = normalizedDomain;
            company.LogoUrl = string.IsNullOrWhiteSpace(request.LogoUrl) ? null : request.LogoUrl.Trim();
            company.Timezone = string.IsNullOrWhiteSpace(request.Timezone) ? "Asia/Ho_Chi_Minh" : request.Timezone.Trim();
            company.Language = string.IsNullOrWhiteSpace(request.Language) ? "vi" : request.Language.Trim();
            company.UpdatedAt = DateTime.UtcNow;

            await AddAuditLogAsync(
                companyId,
                "Company",
                company.Id,
                "Update",
                oldValue,
                new
                {
                    company.Name,
                    company.Domain,
                    company.LogoUrl,
                    company.Timezone,
                    company.Language
                });

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("companies/{companyId:guid}")]
        public async Task<IActionResult> DeleteCompanyAsync(Guid companyId)
        {
            var company = await _context.Companies.IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == companyId)
                ?? throw new NotFoundException("Company not found");

            if (company.DeletedAt != null)
                return NoContent();

            company.IsActive = false;
            company.DeletedAt = DateTime.UtcNow;
            company.UpdatedAt = DateTime.UtcNow;

            await AddAuditLogAsync(
                companyId,
                "Company",
                company.Id,
                "Delete",
                new { company.Name, company.Domain, company.IsActive, company.DeletedAt },
                new { company.Name, company.Domain, company.IsActive, company.DeletedAt });

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("subscription-plans")]
        public async Task<IActionResult> GetSubscriptionPlansAsync()
        {
            var plans = await _context.SubscriptionPlans.IgnoreQueryFilters()
                .OrderBy(x => x.PricePerUser)
                .Select(x => new SubscriptionPlanResponse
                {
                    Id = x.Id,
                    Name = x.Name,
                    MaxUsers = x.MaxUsers,
                    StorageQuotaGb = x.StorageQuotaGb,
                    PricePerUser = x.PricePerUser,
                    BillingCycle = x.BillingCycle,
                    IsActive = x.IsActive
                })
                .ToListAsync();

            return Ok(plans);
        }

        [HttpPost("companies/{companyId:guid}/subscription")]
        public async Task<IActionResult> AssignSubscriptionAsync(Guid companyId, [FromBody] AssignSubscriptionRequest request)
        {
            var company = await _context.Companies.IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == companyId)
                ?? throw new NotFoundException("Company not found");

            var plan = await _context.SubscriptionPlans.IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == request.SubscriptionPlanId && x.IsActive)
                ?? throw new NotFoundException("Subscription plan not found");

            if (request.CurrentPeriodEnd <= request.CurrentPeriodStart)
                throw new BadRequestException("Subscription period end must be after period start");

            var subscription = await _context.CompanySubscriptions.IgnoreQueryFilters()
                .Include(x => x.SubscriptionPlan)
                .FirstOrDefaultAsync(x => x.CompanyId == companyId && x.CancelledAt == null);

            object? oldValue = null;
            if (subscription == null)
            {
                subscription = new CompanySubscription
                {
                    CompanyId = companyId,
                    SubscriptionPlanId = plan.Id,
                    Status = request.Status,
                    StartedAt = DateTime.UtcNow,
                    TrialEndsAt = request.TrialEndsAt,
                    CurrentPeriodStart = request.CurrentPeriodStart,
                    CurrentPeriodEnd = request.CurrentPeriodEnd
                };
                _context.CompanySubscriptions.Add(subscription);
            }
            else
            {
                oldValue = new
                {
                    subscription.SubscriptionPlanId,
                    planName = subscription.SubscriptionPlan?.Name,
                    subscription.Status,
                    subscription.CurrentPeriodStart,
                    subscription.CurrentPeriodEnd,
                    subscription.TrialEndsAt
                };

                subscription.SubscriptionPlanId = plan.Id;
                subscription.Status = request.Status;
                subscription.CurrentPeriodStart = request.CurrentPeriodStart;
                subscription.CurrentPeriodEnd = request.CurrentPeriodEnd;
                subscription.TrialEndsAt = request.TrialEndsAt;
                subscription.CancelledAt = request.Status == SubscriptionStatus.Cancelled ? DateTime.UtcNow : null;
            }

            await AddAuditLogAsync(
                companyId,
                "CompanySubscription",
                subscription.Id,
                "Upsert",
                oldValue,
                new
                {
                    subscription.SubscriptionPlanId,
                    planName = plan.Name,
                    subscription.Status,
                    subscription.CurrentPeriodStart,
                    subscription.CurrentPeriodEnd,
                    subscription.TrialEndsAt
                });

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpGet("audit-logs")]
        public async Task<IActionResult> GetAuditLogsAsync([FromQuery] int take = 50, [FromQuery] Guid? companyId = null)
        {
            take = Math.Clamp(take, 1, 100);
            return Ok(await GetRecentActivityInternalAsync(take, companyId));
        }

        private async Task<List<AdminCompanyResponse>> GetCompaniesInternalAsync()
        {
            var mentorUserIds = await GetUserIdsForRoleAsync(AuthRoles.Mentor);
            var hrUserIds = await GetUserIdsForRoleAsync(AuthRoles.HR);

            var companies = await _context.Companies.IgnoreQueryFilters()
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new
                {
                    Company = x,
                    MemberCount = _context.Users.IgnoreQueryFilters().Count(u => u.CompanyId == x.Id && u.DeletedAt == null),
                    PendingInviteCount = _context.Invites.IgnoreQueryFilters().Count(i => i.CompanyId == x.Id && i.Status == InviteStatus.Pending),
                    Subscription = _context.CompanySubscriptions.IgnoreQueryFilters()
                        .Include(s => s.SubscriptionPlan)
                        .Where(s => s.CompanyId == x.Id && s.CancelledAt == null)
                        .OrderByDescending(s => s.CurrentPeriodEnd)
                        .Select(s => new
                        {
                            s.SubscriptionPlan.Name,
                            s.Status,
                            s.CurrentPeriodEnd
                        })
                        .FirstOrDefault()
                })
                .ToListAsync();

            return companies.Select(x => new AdminCompanyResponse
            {
                Id = x.Company.Id,
                Name = x.Company.Name,
                Domain = x.Company.Domain,
                LogoUrl = x.Company.LogoUrl,
                IsActive = x.Company.IsActive,
                DeletedAt = x.Company.DeletedAt,
                Timezone = x.Company.Timezone,
                Language = x.Company.Language,
                MemberCount = x.MemberCount,
                MentorCount = _context.Users.IgnoreQueryFilters().Count(u => u.CompanyId == x.Company.Id && u.DeletedAt == null && mentorUserIds.Contains(u.Id)),
                HrCount = _context.Users.IgnoreQueryFilters().Count(u => u.CompanyId == x.Company.Id && u.DeletedAt == null && hrUserIds.Contains(u.Id)),
                PendingInviteCount = x.PendingInviteCount,
                SubscriptionPlanName = x.Subscription?.Name,
                SubscriptionStatus = x.Subscription?.Status,
                SubscriptionEndsAt = x.Subscription?.CurrentPeriodEnd,
                CreatedAt = x.Company.CreatedAt
            }).ToList();
        }

        private async Task<List<RoleCountResponse>> GetRoleDistributionInternalAsync()
        {
            var roleCounts = await _context.Set<IdentityUserRole<Guid>>()
                .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, RoleName = r.Name! })
                .Join(_context.Users.IgnoreQueryFilters().Where(u => u.DeletedAt == null), x => x.UserId, u => u.Id, (x, u) => new { x.RoleName, u.Id })
                .GroupBy(x => x.RoleName)
                .Select(g => new RoleCountResponse
                {
                    Role = g.Key,
                    Count = g.Select(x => x.Id).Distinct().Count()
                })
                .OrderByDescending(x => x.Count)
                .ToListAsync();

            return roleCounts;
        }

        private async Task<List<AdminAuditLogResponse>> GetRecentActivityInternalAsync(int take, Guid? companyId = null)
        {
            var auditQuery = _context.AuditLogs.IgnoreQueryFilters().AsQueryable();
            if (companyId.HasValue)
                auditQuery = auditQuery.Where(x => x.CompanyId == companyId.Value);

            var logs = await auditQuery
                .Include(x => x.User)
                .OrderByDescending(x => x.CreatedAt)
                .Take(take)
                .Select(x => new AdminAuditLogResponse
                {
                    Id = x.Id,
                    Action = x.Action,
                    EntityType = x.EntityType,
                    EntityId = x.EntityId,
                    CompanyId = x.CompanyId,
                    UserId = x.UserId,
                    UserName = x.User.FullName,
                    UserEmail = x.User.Email ?? string.Empty,
                    IpAddress = x.IpAddress,
                    CreatedAt = x.CreatedAt,
                    Summary = x.NewValueJson
                })
                .ToListAsync();

            if (logs.Count == 0)
            {
                var companyQuery = _context.Companies.IgnoreQueryFilters().AsQueryable();
                if (companyId.HasValue)
                    companyQuery = companyQuery.Where(x => x.Id == companyId.Value);

                return await companyQuery
                    .OrderByDescending(x => x.CreatedAt)
                    .Take(take)
                    .Select(x => new AdminAuditLogResponse
                    {
                        Id = x.Id,
                        Action = "Created",
                        EntityType = "Company",
                        EntityId = x.Id,
                        CompanyId = x.Id,
                        CompanyName = x.Name,
                        UserId = Guid.Empty,
                        UserName = "System",
                        UserEmail = string.Empty,
                        CreatedAt = x.CreatedAt,
                        Summary = $"Workspace '{x.Name}' provisioned"
                    })
                    .ToListAsync();
            }

            var companyNames = await _context.Companies.IgnoreQueryFilters()
                .Where(x => logs.Select(l => l.CompanyId).Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => x.Name);

            foreach (var log in logs)
            {
                if (companyNames.TryGetValue(log.CompanyId, out var companyName))
                    log.CompanyName = companyName;
            }

            return logs;
        }

        private async Task<List<AdminMemberSummaryResponse>> GetCompanyMemberSummariesAsync(Guid companyId)
        {
            var roleMap = await _context.Set<IdentityUserRole<Guid>>()
                .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, RoleName = r.Name! })
                .ToListAsync();

            var users = await _context.Users.IgnoreQueryFilters()
                .Where(x => x.CompanyId == companyId && x.DeletedAt == null)
                .OrderByDescending(x => x.LastLoginAt)
                .ThenBy(x => x.FullName)
                .Take(12)
                .ToListAsync();

            return users.Select(user => new AdminMemberSummaryResponse
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email ?? string.Empty,
                Role = roleMap.FirstOrDefault(x => x.UserId == user.Id)?.RoleName ?? "Member",
                IsActive = user.IsActive,
                LastLoginAt = user.LastLoginAt
            }).ToList();
        }

        private async Task<int> CountPrivilegedAccountsAsync()
        {
            var roleIds = await _context.Roles
                .Where(x => x.Name == AuthRoles.HR || x.Name == AuthRoles.SystemAdmin)
                .Select(x => x.Id)
                .ToListAsync();

            return await _context.Set<IdentityUserRole<Guid>>()
                .Where(x => roleIds.Contains(x.RoleId))
                .Select(x => x.UserId)
                .Distinct()
                .CountAsync();
        }

        private async Task<List<Guid>> GetUserIdsForRoleAsync(string roleName)
        {
            var roleId = await _context.Roles
                .Where(x => x.Name == roleName)
                .Select(x => x.Id)
                .FirstOrDefaultAsync();

            if (roleId == Guid.Empty)
                return new List<Guid>();

            return await _context.Set<IdentityUserRole<Guid>>()
                .Where(x => x.RoleId == roleId)
                .Select(x => x.UserId)
                .ToListAsync();
        }

        private PlatformSettingsResponse BuildPlatformSettings()
        {
            var frontendUrls = _configuration.GetSection("Frontend:Urls").Get<string[]>() ?? [];
            return new PlatformSettingsResponse
            {
                EnvironmentName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                GoogleOAuthConfigured =
                    !string.IsNullOrWhiteSpace(_configuration["GOOGLE_CLIENT_ID"]) &&
                    !string.IsNullOrWhiteSpace(_configuration["GOOGLE_CLIENT_SECRET"]),
                SmtpConfigured =
                    !string.IsNullOrWhiteSpace(_configuration["SMTP_HOST"]) &&
                    !string.IsNullOrWhiteSpace(_configuration["SMTP_USERNAME"]) &&
                    !string.IsNullOrWhiteSpace(_configuration["SMTP_PASSWORD"]),
                InviteExpiryDays = int.TryParse(_configuration["Invites:ExpireDays"], out var inviteDays) && inviteDays > 0 ? inviteDays : 7,
                RefreshTokenDays = int.TryParse(_configuration["Jwt:RefreshTokenDays"], out var refreshDays) && refreshDays > 0 ? refreshDays : 7,
                FrontendUrls = frontendUrls
            };
        }

        private async Task AddAuditLogAsync(Guid companyId, string entityType, Guid? entityId, string action, object? oldValue, object? newValue)
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var userId = Guid.TryParse(userIdValue, out var parsedUserId) ? parsedUserId : Guid.Empty;

            _context.AuditLogs.Add(new AuditLog
            {
                CompanyId = companyId,
                UserId = userId,
                EntityType = entityType,
                EntityId = entityId,
                Action = action,
                OldValueJson = oldValue == null ? null : JsonSerializer.Serialize(oldValue),
                NewValueJson = newValue == null ? null : JsonSerializer.Serialize(newValue),
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers.UserAgent.ToString()
            });

            await Task.CompletedTask;
        }
    }
}
