using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
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
        private readonly IWebHostEnvironment _environment;

        public AdminController(AppDbContext context, IConfiguration configuration, IWebHostEnvironment environment)
        {
            _context = context;
            _configuration = configuration;
            _environment = environment;
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
                TotalUsers = await _context.Users.IgnoreQueryFilters().CountAsync(x => x.DeletedAt == null),
                EventsThisMonth = await CountEventsThisMonthAsync(),
                TotalStorageBytes = companies.Sum(x => x.StorageUsedBytes),
                TotalStorageQuotaGb = companies.Sum(x => x.StorageQuotaGb ?? 0),
                PlatformStorageUsedPercent = CalculatePlatformStorageUsedPercent(companies),
                AverageRetentionRate = companies.Count == 0 ? 0 : companies.Average(x => x.RetentionRate),
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

            var currentPeriodStart = EnsureUtc(request.CurrentPeriodStart);
            var currentPeriodEnd = EnsureUtc(request.CurrentPeriodEnd);
            var trialEndsAt = EnsureUtc(request.TrialEndsAt);

            if (currentPeriodEnd <= currentPeriodStart)
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
                    TrialEndsAt = trialEndsAt,
                    CurrentPeriodStart = currentPeriodStart,
                    CurrentPeriodEnd = currentPeriodEnd
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
                subscription.CurrentPeriodStart = currentPeriodStart;
                subscription.CurrentPeriodEnd = currentPeriodEnd;
                subscription.TrialEndsAt = trialEndsAt;
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
        public async Task<IActionResult> GetAuditLogsAsync([FromQuery] AdminAuditLogQuery query)
        {
            query.Take = Math.Clamp(query.Take, 1, 200);
            return Ok(await GetRecentActivityInternalAsync(query));
        }

        [HttpGet("audit-logs/export")]
        public async Task<IActionResult> ExportAuditLogsAsync([FromQuery] AdminAuditLogQuery query)
        {
            query.Take = Math.Clamp(query.Take <= 0 ? 1000 : query.Take, 1, 5000);
            var logs = await GetRecentActivityInternalAsync(query);

            var csv = new StringBuilder();
            csv.AppendLine("Id,Company,ActorEmail,Action,EntityType,EntityId,IpAddress,CreatedAt,Summary");
            foreach (var log in logs)
            {
                csv.AppendLine(string.Join(",",
                    EscapeCsv(log.Id.ToString()),
                    EscapeCsv(log.CompanyName),
                    EscapeCsv(log.UserEmail),
                    EscapeCsv(log.Action),
                    EscapeCsv(log.EntityType),
                    EscapeCsv(log.EntityId?.ToString()),
                    EscapeCsv(log.IpAddress),
                    EscapeCsv(log.CreatedAt.ToString("O")),
                    EscapeCsv(log.Summary)));
            }

            return File(Encoding.UTF8.GetBytes(csv.ToString()), "text/csv", "admin-audit-logs.csv");
        }

        [HttpGet("moderation")]
        public async Task<IActionResult> GetModerationQueueAsync()
        {
            var logs = await _context.AuditLogs.IgnoreQueryFilters()
                .Include(x => x.User)
                .Where(x =>
                    x.Action.ToLower().Contains("report") ||
                    x.Action.ToLower().Contains("reject") ||
                    x.Action.ToLower().Contains("violation") ||
                    x.Action.ToLower().Contains("flag"))
                .OrderByDescending(x => x.CreatedAt)
                .Take(50)
                .Select(x => new AdminModerationItemResponse
                {
                    Id = x.Id,
                    CompanyId = x.CompanyId,
                    Source = "Audit",
                    TargetType = x.EntityType,
                    TargetId = x.EntityId,
                    Title = x.Action,
                    ReporterName = x.User.FullName,
                    Status = "Needs Review",
                    CreatedAt = x.CreatedAt,
                    Summary = x.NewValueJson
                })
                .ToListAsync();

            var pendingEvents = await _context.TrainingEvents.IgnoreQueryFilters()
                .Where(x => x.DeletedAt == null && x.Status == TrainingEventStatus.PendingApproval)
                .OrderByDescending(x => x.CreatedAt)
                .Take(20)
                .Select(x => new AdminModerationItemResponse
                {
                    Id = x.Id,
                    CompanyId = x.CompanyId,
                    Source = "TrainingEvent",
                    TargetType = "TrainingEvent",
                    TargetId = x.Id,
                    Title = x.Title,
                    ReporterName = "System",
                    Status = "Pending Approval",
                    CreatedAt = x.CreatedAt,
                    Summary = x.Description
                })
                .ToListAsync();

            var queue = logs.Concat(pendingEvents)
                .OrderByDescending(x => x.CreatedAt)
                .Take(80)
                .ToList();

            var companyNames = await _context.Companies.IgnoreQueryFilters()
                .Where(x => queue.Select(q => q.CompanyId).Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => x.Name);

            foreach (var item in queue)
            {
                if (companyNames.TryGetValue(item.CompanyId, out var companyName))
                    item.CompanyName = companyName;
            }

            return Ok(queue);
        }

        [HttpPost("moderation/users/{userId:guid}/lock")]
        public async Task<IActionResult> LockUserAsync(Guid userId, [FromBody] AdminModerationActionRequest request)
        {
            var user = await _context.Users.IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == userId && x.DeletedAt == null)
                ?? throw new NotFoundException("User not found");

            if (await _context.UserRoles
                    .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
                    .AnyAsync(x => x.UserId == userId && x.Name == AuthRoles.SystemAdmin))
                throw new BadRequestException("System admin accounts cannot be locked through moderation");

            var oldValue = new { user.IsActive };
            user.IsActive = false;
            user.UpdatedAt = DateTime.UtcNow;

            var sessions = await _context.UserSessions.IgnoreQueryFilters()
                .Where(x => x.UserId == userId && x.IsActive)
                .ToListAsync();
            foreach (var session in sessions)
            {
                session.IsActive = false;
                session.RevokedAt = DateTime.UtcNow;
            }

            await AddAuditLogAsync(
                user.CompanyId,
                "AppUser",
                user.Id,
                "ModerationLockUser",
                oldValue,
                new { user.IsActive, request.Reason });

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("moderation/resources/{resourceId:guid}")]
        public async Task<IActionResult> DeleteResourceForModerationAsync(Guid resourceId, [FromBody] AdminModerationActionRequest? request = null)
        {
            var resource = await _context.Resources.IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == resourceId)
                ?? throw new NotFoundException("Resource not found");

            if (resource.DeletedAt != null)
                return NoContent();

            resource.DeletedAt = DateTime.UtcNow;
            resource.UpdatedAt = DateTime.UtcNow;

            await AddAuditLogAsync(
                resource.CompanyId,
                "Resource",
                resource.Id,
                "ModerationDeleteResource",
                new { resource.Title, resource.DeletedAt },
                new { resource.Title, resource.DeletedAt, request?.Reason });

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpDelete("moderation/events/{eventId:guid}")]
        public async Task<IActionResult> DeleteEventForModerationAsync(Guid eventId, [FromBody] AdminModerationActionRequest? request = null)
        {
            var trainingEvent = await _context.TrainingEvents.IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == eventId)
                ?? throw new NotFoundException("Training event not found");

            if (trainingEvent.DeletedAt != null)
                return NoContent();

            var oldValue = new { trainingEvent.Status, trainingEvent.DeletedAt };
            trainingEvent.Status = TrainingEventStatus.Cancelled;
            trainingEvent.DeletedAt = DateTime.UtcNow;
            trainingEvent.UpdatedAt = DateTime.UtcNow;

            await AddAuditLogAsync(
                trainingEvent.CompanyId,
                "TrainingEvent",
                trainingEvent.Id,
                "ModerationDeleteEvent",
                oldValue,
                new { trainingEvent.Status, trainingEvent.DeletedAt, request?.Reason });

            await _context.SaveChangesAsync();
            return NoContent();
        }

        [HttpPatch("platform-settings")]
        public async Task<IActionResult> UpdatePlatformSettingsAsync([FromBody] UpdatePlatformSettingsRequest request)
        {
            if (request.InviteExpiryDays < 1)
                throw new BadRequestException("Invite expiry days must be at least 1");
            if (request.RefreshTokenDays < 1)
                throw new BadRequestException("Refresh token days must be at least 1");

            await UpdateAppSettingsJsonAsync(request);

            await AddAuditLogAsync(
                Guid.Empty,
                "PlatformSettings",
                null,
                "Update",
                BuildPlatformSettings(),
                request);

            await _context.SaveChangesAsync();
            return Ok(new PlatformSettingsResponse
            {
                EnvironmentName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                GoogleOAuthConfigured =
                    !string.IsNullOrWhiteSpace(_configuration["GOOGLE_CLIENT_ID"]) &&
                    !string.IsNullOrWhiteSpace(_configuration["GOOGLE_CLIENT_SECRET"]),
                SmtpConfigured =
                    !string.IsNullOrWhiteSpace(_configuration["SMTP_HOST"]) &&
                    !string.IsNullOrWhiteSpace(_configuration["SMTP_USERNAME"]) &&
                    !string.IsNullOrWhiteSpace(_configuration["SMTP_PASSWORD"]),
                InviteExpiryDays = request.InviteExpiryDays,
                RefreshTokenDays = request.RefreshTokenDays,
                FrontendUrls = request.FrontendUrls,
                MaintenanceMode = request.MaintenanceMode,
                SystemBanner = request.SystemBanner
            });
        }

        private async Task<List<AdminCompanyResponse>> GetCompaniesInternalAsync()
        {
            var mentorUserIds = await GetUserIdsForRoleAsync(AuthRoles.Mentor);
            var hrUserIds = await GetUserIdsForRoleAsync(AuthRoles.HR);
            var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            var retentionCutoff = DateTime.UtcNow.AddDays(-30);

            var companies = await _context.Companies.IgnoreQueryFilters()
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new
                {
                    Company = x,
                    MemberCount = _context.Users.IgnoreQueryFilters().Count(u => u.CompanyId == x.Id && u.DeletedAt == null),
                    ActiveMemberCount = _context.Users.IgnoreQueryFilters().Count(u => u.CompanyId == x.Id && u.DeletedAt == null && u.IsActive),
                    RetainedMemberCount = _context.Users.IgnoreQueryFilters().Count(u => u.CompanyId == x.Id && u.DeletedAt == null && u.IsActive && u.LastLoginAt != null && u.LastLoginAt >= retentionCutoff),
                    EventsThisMonth = _context.TrainingEvents.IgnoreQueryFilters().Count(e => e.CompanyId == x.Id && e.DeletedAt == null && e.StartDate >= monthStart),
                    StorageUsedBytes = _context.Resources.IgnoreQueryFilters().Where(r => r.CompanyId == x.Id && r.DeletedAt == null).Sum(r => r.FileSizeBytes ?? 0),
                    PendingInviteCount = _context.Invites.IgnoreQueryFilters().Count(i => i.CompanyId == x.Id && i.Status == InviteStatus.Pending),
                    Subscription = _context.CompanySubscriptions.IgnoreQueryFilters()
                        .Include(s => s.SubscriptionPlan)
                        .Where(s => s.CompanyId == x.Id && s.CancelledAt == null)
                        .OrderByDescending(s => s.CurrentPeriodEnd)
                        .Select(s => new
                        {
                            s.SubscriptionPlan.Name,
                            s.SubscriptionPlan.MaxUsers,
                            s.SubscriptionPlan.StorageQuotaGb,
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
                EventsThisMonth = x.EventsThisMonth,
                StorageUsedBytes = x.StorageUsedBytes,
                StorageQuotaGb = x.Subscription?.StorageQuotaGb,
                StorageUsedPercent = CalculateStorageUsedPercent(x.StorageUsedBytes, x.Subscription?.StorageQuotaGb),
                RetentionRate = x.ActiveMemberCount > 0 ? (double)x.RetainedMemberCount / x.ActiveMemberCount : 0,
                IsNearPlanLimit =
                    (x.Subscription != null && x.Subscription.MaxUsers > 0 && x.MemberCount >= x.Subscription.MaxUsers * 0.8) ||
                    CalculateStorageUsedPercent(x.StorageUsedBytes, x.Subscription?.StorageQuotaGb) >= 80,
                IsOverPlanLimit =
                    (x.Subscription != null && x.Subscription.MaxUsers > 0 && x.MemberCount > x.Subscription.MaxUsers) ||
                    CalculateStorageUsedPercent(x.StorageUsedBytes, x.Subscription?.StorageQuotaGb) >= 100,
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
            return await GetRecentActivityInternalAsync(new AdminAuditLogQuery { Take = take, CompanyId = companyId });
        }

        private async Task<List<AdminAuditLogResponse>> GetRecentActivityInternalAsync(AdminAuditLogQuery query)
        {
            var take = Math.Clamp(query.Take, 1, 5000);
            var auditQuery = _context.AuditLogs.IgnoreQueryFilters().AsQueryable();
            if (query.CompanyId.HasValue)
                auditQuery = auditQuery.Where(x => x.CompanyId == query.CompanyId.Value);
            if (query.ActorId.HasValue)
                auditQuery = auditQuery.Where(x => x.UserId == query.ActorId.Value);
            if (!string.IsNullOrWhiteSpace(query.Action))
            {
                var action = query.Action.Trim().ToLower();
                auditQuery = auditQuery.Where(x => x.Action.ToLower().Contains(action));
            }
            if (!string.IsNullOrWhiteSpace(query.EntityType))
            {
                var entityType = query.EntityType.Trim().ToLower();
                auditQuery = auditQuery.Where(x => x.EntityType.ToLower().Contains(entityType));
            }
            if (query.From.HasValue)
                auditQuery = auditQuery.Where(x => x.CreatedAt >= EnsureUtc(query.From.Value));
            if (query.To.HasValue)
                auditQuery = auditQuery.Where(x => x.CreatedAt <= EnsureUtc(query.To.Value));

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
                if (query.CompanyId.HasValue)
                    companyQuery = companyQuery.Where(x => x.Id == query.CompanyId.Value);
                if (query.ActorId.HasValue || !string.IsNullOrWhiteSpace(query.Action) ||
                    !string.IsNullOrWhiteSpace(query.EntityType) || query.From.HasValue || query.To.HasValue)
                    return new List<AdminAuditLogResponse>();

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
                MaintenanceMode = bool.TryParse(_configuration["Platform:MaintenanceMode"], out var maintenanceMode) && maintenanceMode,
                SystemBanner = _configuration["Platform:SystemBanner"],
                FrontendUrls = frontendUrls
            };
        }

        private async Task<int> CountEventsThisMonthAsync()
        {
            var monthStart = new DateTime(DateTime.UtcNow.Year, DateTime.UtcNow.Month, 1, 0, 0, 0, DateTimeKind.Utc);
            return await _context.TrainingEvents.IgnoreQueryFilters()
                .CountAsync(x => x.DeletedAt == null && x.StartDate >= monthStart);
        }

        private static DateTime EnsureUtc(DateTime value)
        {
            return value.Kind switch
            {
                DateTimeKind.Utc => value,
                DateTimeKind.Local => value.ToUniversalTime(),
                _ => DateTime.SpecifyKind(value, DateTimeKind.Utc)
            };
        }

        private static DateTime? EnsureUtc(DateTime? value)
        {
            return value.HasValue ? EnsureUtc(value.Value) : null;
        }

        private static double CalculateStorageUsedPercent(long usedBytes, int? quotaGb)
        {
            if (!quotaGb.HasValue || quotaGb.Value <= 0)
                return 0;

            var quotaBytes = quotaGb.Value * 1024d * 1024d * 1024d;
            return Math.Round((usedBytes / quotaBytes) * 100, 2);
        }

        private static double CalculatePlatformStorageUsedPercent(IList<AdminCompanyResponse> companies)
        {
            var quotaGb = companies.Sum(x => x.StorageQuotaGb ?? 0);
            if (quotaGb <= 0)
                return 0;

            return CalculateStorageUsedPercent(companies.Sum(x => x.StorageUsedBytes), quotaGb);
        }

        private async Task UpdateAppSettingsJsonAsync(UpdatePlatformSettingsRequest request)
        {
            var settingsPath = Path.Combine(_environment.ContentRootPath, "appsettings.json");
            if (!System.IO.File.Exists(settingsPath))
                throw new NotFoundException("appsettings.json not found");

            var json = await System.IO.File.ReadAllTextAsync(settingsPath);
            var root = JsonNode.Parse(json)?.AsObject()
                ?? throw new BadRequestException("appsettings.json is invalid");

            var jwt = GetOrCreateObject(root, "Jwt");
            jwt["RefreshTokenDays"] = request.RefreshTokenDays;

            var invites = GetOrCreateObject(root, "Invites");
            invites["ExpireDays"] = request.InviteExpiryDays;

            var frontend = GetOrCreateObject(root, "Frontend");
            frontend["Urls"] = new JsonArray(request.FrontendUrls
                .Where(x => !string.IsNullOrWhiteSpace(x))
                .Select(x => JsonValue.Create(x.Trim())!)
                .ToArray());

            var platform = GetOrCreateObject(root, "Platform");
            platform["MaintenanceMode"] = request.MaintenanceMode;
            platform["SystemBanner"] = string.IsNullOrWhiteSpace(request.SystemBanner) ? null : request.SystemBanner.Trim();

            await System.IO.File.WriteAllTextAsync(
                settingsPath,
                root.ToJsonString(new JsonSerializerOptions { WriteIndented = true }));
        }

        private static JsonObject GetOrCreateObject(JsonObject root, string key)
        {
            if (root[key] is JsonObject existing)
                return existing;

            var created = new JsonObject();
            root[key] = created;
            return created;
        }

        private static string EscapeCsv(string? value) =>
            $"\"{(value ?? string.Empty).Replace("\"", "\"\"")}\"";

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
