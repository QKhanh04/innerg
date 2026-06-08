using System.Security.Claims;
using System.Text;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Collections.Generic;
using InnerG.Api.Data;
using InnerG.Api.DTOs;
using InnerG.Api.Exceptions;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
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
        private readonly INotificationService _notificationService;
        private readonly string _apiEnvPath;
        private readonly string _webEnvPath;

        public AdminController(AppDbContext context, IConfiguration configuration, IWebHostEnvironment environment, INotificationService notificationService)
        {
            _context = context;
            _configuration = configuration;
            _environment = environment;
            _notificationService = notificationService;
            _apiEnvPath = Path.Combine(_environment.ContentRootPath, ".env");
            _webEnvPath = Path.GetFullPath(Path.Combine(_environment.ContentRootPath, "..", "..", "web", ".env"));
        }

        [HttpGet("overview")]
        public async Task<IActionResult> GetOverviewAsync()
        {
            var companies = await GetCompaniesInternalAsync();
            var recentActivity = await GetRecentActivityInternalAsync(8);
            var roleDistribution = await GetRoleDistributionInternalAsync();
            var retentionCohorts = await GetRetentionCohortsInternalAsync();

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
                RecentActivity = recentActivity,
                RetentionCohorts = retentionCohorts
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
            var auditAction = request.IsActive ? "Activate" : "Deactivate";

            return await ExecuteAdminMutationAsync(
                companyId,
                "Company",
                companyId,
                auditAction,
                () => new { request.IsActive },
                async () =>
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
                        auditAction,
                        new { isActive = oldValue },
                        new { isActive = request.IsActive });

                    await _context.SaveChangesAsync();
                    return NoContent();
                });
        }

        [HttpPatch("companies/bulk-status")]
        public async Task<IActionResult> BulkUpdateCompanyStatusAsync([FromBody] BulkUpdateCompanyStatusRequest request)
        {
            var companyIds = request.CompanyIds
                .Where(x => x != Guid.Empty)
                .Distinct()
                .ToList();

            if (companyIds.Count == 0)
                throw new BadRequestException("At least one company is required");

            var auditAction = request.IsActive ? "BulkActivate" : "BulkDeactivate";

            return await ExecuteAdminMutationAsync(
                Guid.Empty,
                "Company",
                null,
                auditAction,
                () => new { request.IsActive, CompanyIds = companyIds },
                async () =>
                {
                    var companies = await _context.Companies.IgnoreQueryFilters()
                        .Where(x => companyIds.Contains(x.Id))
                        .ToListAsync();

                    if (companies.Count == 0)
                        throw new NotFoundException("No companies found for bulk update");

                    var updatedCompanies = new List<object>();
                    foreach (var company in companies)
                    {
                        if (company.DeletedAt != null || company.IsActive == request.IsActive)
                            continue;

                        var oldValue = company.IsActive;
                        company.IsActive = request.IsActive;
                        company.UpdatedAt = DateTime.UtcNow;

                        await AddAuditLogAsync(
                            company.Id,
                            "Company",
                            company.Id,
                            request.IsActive ? "Activate" : "Deactivate",
                            new { isActive = oldValue },
                            new { isActive = request.IsActive, bulkAction = true });

                        updatedCompanies.Add(new
                        {
                            company.Id,
                            company.Name,
                            PreviousIsActive = oldValue,
                            company.IsActive
                        });
                    }

                    await AddAuditLogAsync(
                        Guid.Empty,
                        "Company",
                        null,
                        auditAction,
                        null,
                        new
                        {
                            request.IsActive,
                            RequestedCount = companyIds.Count,
                            UpdatedCount = updatedCompanies.Count,
                            Companies = updatedCompanies
                        });

                    await _context.SaveChangesAsync();
                    return NoContent();
                });
        }

        [HttpPatch("companies/{companyId:guid}")]
        public async Task<IActionResult> UpdateCompanyAsync(Guid companyId, [FromBody] UpdateCompanyRequest request)
        {
            return await ExecuteAdminMutationAsync(
                companyId,
                "Company",
                companyId,
                "Update",
                () => request,
                async () =>
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
                });
        }

        [HttpDelete("companies/{companyId:guid}")]
        public async Task<IActionResult> DeleteCompanyAsync(Guid companyId)
        {
            return await ExecuteAdminMutationAsync(
                companyId,
                "Company",
                companyId,
                "Delete",
                null,
                async () =>
                {
                    var company = await _context.Companies.IgnoreQueryFilters()
                        .FirstOrDefaultAsync(x => x.Id == companyId)
                        ?? throw new NotFoundException("Company not found");

                    if (company.DeletedAt != null)
                        return NoContent();

                    var revokedSessionCount = await RevokeCompanySessionsAsync(companyId);

                    company.IsActive = false;
                    company.DeletedAt = DateTime.UtcNow;
                    company.UpdatedAt = DateTime.UtcNow;

                    await AddAuditLogAsync(
                        companyId,
                        "Company",
                        company.Id,
                        "Delete",
                        new { company.Name, company.Domain, company.IsActive, company.DeletedAt },
                        new { company.Name, company.Domain, company.IsActive, company.DeletedAt, RevokedSessionCount = revokedSessionCount });

                    await _context.SaveChangesAsync();
                    return NoContent();
                });
        }

        [HttpGet("subscription-plans")]
        public async Task<IActionResult> GetSubscriptionPlansAsync()
        {
            var plans = await _context.SubscriptionPlans.IgnoreQueryFilters()
                .Where(x => x.DeletedAt == null)
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

        [HttpPost("subscription-plans")]
        public async Task<IActionResult> CreateSubscriptionPlanAsync([FromBody] UpsertSubscriptionPlanRequest request)
        {
            return await ExecuteAdminMutationAsync(
                Guid.Empty,
                "SubscriptionPlan",
                null,
                "Create",
                () => request,
                async () =>
                {
                    ValidateSubscriptionPlanRequest(request);

                    var normalizedName = request.Name.Trim();
                    var nameExists = await _context.SubscriptionPlans.IgnoreQueryFilters()
                        .AnyAsync(x => x.DeletedAt == null && x.Name.ToLower() == normalizedName.ToLower());

                    if (nameExists)
                        throw new ConflictException("Subscription plan name already exists");

                    var plan = new SubscriptionPlan
                    {
                        Name = normalizedName,
                        MaxUsers = request.MaxUsers,
                        StorageQuotaGb = request.StorageQuotaGb,
                        PricePerUser = request.PricePerUser,
                        BillingCycle = request.BillingCycle,
                        IsActive = request.IsActive
                    };

                    _context.SubscriptionPlans.Add(plan);

                    await AddAuditLogAsync(
                        Guid.Empty,
                        "SubscriptionPlan",
                        plan.Id,
                        "Create",
                        null,
                        new
                        {
                            plan.Name,
                            plan.MaxUsers,
                            plan.StorageQuotaGb,
                            plan.PricePerUser,
                            plan.BillingCycle,
                            plan.IsActive
                        });

                    await _context.SaveChangesAsync();
                    return StatusCode(StatusCodes.Status201Created, ToSubscriptionPlanResponse(plan));
                });
        }

        [HttpPatch("subscription-plans/{planId:guid}")]
        public async Task<IActionResult> UpdateSubscriptionPlanAsync(Guid planId, [FromBody] UpsertSubscriptionPlanRequest request)
        {
            return await ExecuteAdminMutationAsync(
                Guid.Empty,
                "SubscriptionPlan",
                planId,
                "Update",
                () => request,
                async () =>
                {
                    ValidateSubscriptionPlanRequest(request);

                    var plan = await _context.SubscriptionPlans.IgnoreQueryFilters()
                        .FirstOrDefaultAsync(x => x.Id == planId && x.DeletedAt == null)
                        ?? throw new NotFoundException("Subscription plan not found");

                    var normalizedName = request.Name.Trim();
                    var nameExists = await _context.SubscriptionPlans.IgnoreQueryFilters()
                        .AnyAsync(x => x.Id != planId && x.DeletedAt == null && x.Name.ToLower() == normalizedName.ToLower());

                    if (nameExists)
                        throw new ConflictException("Subscription plan name already exists");

                    var oldValue = new
                    {
                        plan.Name,
                        plan.MaxUsers,
                        plan.StorageQuotaGb,
                        plan.PricePerUser,
                        plan.BillingCycle,
                        plan.IsActive
                    };

                    plan.Name = normalizedName;
                    plan.MaxUsers = request.MaxUsers;
                    plan.StorageQuotaGb = request.StorageQuotaGb;
                    plan.PricePerUser = request.PricePerUser;
                    plan.BillingCycle = request.BillingCycle;
                    plan.IsActive = request.IsActive;
                    plan.UpdatedAt = DateTime.UtcNow;

                    await AddAuditLogAsync(
                        Guid.Empty,
                        "SubscriptionPlan",
                        plan.Id,
                        "Update",
                        oldValue,
                        new
                        {
                            plan.Name,
                            plan.MaxUsers,
                            plan.StorageQuotaGb,
                            plan.PricePerUser,
                            plan.BillingCycle,
                            plan.IsActive
                        });

                    await _context.SaveChangesAsync();
                    return Ok(ToSubscriptionPlanResponse(plan));
                });
        }

        [HttpDelete("subscription-plans/{planId:guid}")]
        public async Task<IActionResult> DeleteSubscriptionPlanAsync(Guid planId)
        {
            return await ExecuteAdminMutationAsync(
                Guid.Empty,
                "SubscriptionPlan",
                planId,
                "Delete",
                null,
                async () =>
                {
                    var plan = await _context.SubscriptionPlans.IgnoreQueryFilters()
                        .FirstOrDefaultAsync(x => x.Id == planId && x.DeletedAt == null)
                        ?? throw new NotFoundException("Subscription plan not found");

                    var inUse = await _context.CompanySubscriptions.IgnoreQueryFilters()
                        .AnyAsync(x => x.SubscriptionPlanId == planId && x.CancelledAt == null && x.DeletedAt == null);

                    if (inUse)
                    {
                        plan.IsActive = false;
                        plan.UpdatedAt = DateTime.UtcNow;

                        await AddAuditLogAsync(
                            Guid.Empty,
                            "SubscriptionPlan",
                            plan.Id,
                            "Deactivate",
                            new { plan.IsActive },
                            new { plan.IsActive, Reason = "Plan is still assigned to active subscriptions" });
                    }
                    else
                    {
                        plan.IsActive = false;
                        plan.DeletedAt = DateTime.UtcNow;
                        plan.UpdatedAt = DateTime.UtcNow;

                        await AddAuditLogAsync(
                            Guid.Empty,
                            "SubscriptionPlan",
                            plan.Id,
                            "Delete",
                            new { plan.Name, plan.IsActive, plan.DeletedAt },
                            new { plan.Name, plan.IsActive, plan.DeletedAt });
                    }

                    await _context.SaveChangesAsync();
                    return NoContent();
                });
        }

        [HttpPost("companies/{companyId:guid}/subscription")]
        public async Task<IActionResult> AssignSubscriptionAsync(Guid companyId, [FromBody] AssignSubscriptionRequest request)
        {
            return await ExecuteAdminMutationAsync(
                companyId,
                "CompanySubscription",
                null,
                "Upsert",
                () => request,
                async () =>
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
                            CompanyId = company.Id,
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
                });
        }

        [HttpGet("billing-records")]
        public async Task<IActionResult> GetBillingRecordsAsync([FromQuery] Guid? companyId = null)
        {
            var query = _context.BillingRecords.IgnoreQueryFilters()
                .Include(x => x.Company)
                .Include(x => x.SubscriptionPlan)
                .AsQueryable();

            if (companyId.HasValue)
                query = query.Where(x => x.CompanyId == companyId.Value);

            var records = await query
                .OrderByDescending(x => x.IssuedAt)
                .Take(120)
                .Select(x => new AdminBillingRecordResponse
                {
                    Id = x.Id,
                    CompanyId = x.CompanyId,
                    CompanyName = x.Company.Name,
                    CompanySubscriptionId = x.CompanySubscriptionId,
                    SubscriptionPlanId = x.SubscriptionPlanId,
                    SubscriptionPlanName = x.SubscriptionPlan.Name,
                    InvoiceNumber = x.InvoiceNumber,
                    BillingCycle = x.BillingCycle,
                    Status = x.Status,
                    Amount = x.Amount,
                    Currency = x.Currency,
                    UserCountSnapshot = x.UserCountSnapshot,
                    PeriodStart = x.PeriodStart,
                    PeriodEnd = x.PeriodEnd,
                    IssuedAt = x.IssuedAt,
                    DueAt = x.DueAt,
                    PaidAt = x.PaidAt,
                    Notes = x.Notes
                })
                .ToListAsync();

            return Ok(records);
        }

        [HttpPost("companies/{companyId:guid}/billing-records")]
        public async Task<IActionResult> CreateBillingRecordAsync(Guid companyId, [FromBody] CreateBillingRecordRequest request)
        {
            return await ExecuteAdminMutationAsync(
                companyId,
                "BillingRecord",
                null,
                "Create",
                () => request,
                async () =>
                {
                    var company = await _context.Companies.IgnoreQueryFilters()
                        .FirstOrDefaultAsync(x => x.Id == companyId && x.DeletedAt == null)
                        ?? throw new NotFoundException("Company not found");

                    var subscription = await _context.CompanySubscriptions.IgnoreQueryFilters()
                        .Include(x => x.SubscriptionPlan)
                        .FirstOrDefaultAsync(x => x.CompanyId == companyId && x.CancelledAt == null && x.DeletedAt == null)
                        ?? throw new NotFoundException("Active company subscription not found");

                    var userCount = await _context.Users.IgnoreQueryFilters()
                        .CountAsync(x => x.CompanyId == companyId && x.DeletedAt == null);

                    var cycleMultiplier = subscription.SubscriptionPlan.BillingCycle == BillingCycle.Yearly ? 12 : 1;
                    var amount = subscription.SubscriptionPlan.PricePerUser * userCount * cycleMultiplier;
                    var issuedAt = DateTime.UtcNow;
                    var dueAt = EnsureUtc(request.DueAt) ?? issuedAt.AddDays(7);

                    var invoiceNumber = $"INV-{DateTime.UtcNow:yyyyMMdd}-{company.Name[..Math.Min(company.Name.Length, 3)].ToUpperInvariant()}-{Guid.NewGuid().ToString("N")[..6].ToUpperInvariant()}";

                    var record = new BillingRecord
                    {
                        CompanyId = companyId,
                        CompanySubscriptionId = subscription.Id,
                        SubscriptionPlanId = subscription.SubscriptionPlanId,
                        InvoiceNumber = invoiceNumber,
                        BillingCycle = subscription.SubscriptionPlan.BillingCycle,
                        Status = BillingRecordStatus.Pending,
                        Amount = amount,
                        Currency = string.IsNullOrWhiteSpace(request.Currency) ? "USD" : request.Currency.Trim().ToUpperInvariant(),
                        UserCountSnapshot = userCount,
                        PeriodStart = subscription.CurrentPeriodStart,
                        PeriodEnd = subscription.CurrentPeriodEnd,
                        IssuedAt = issuedAt,
                        DueAt = dueAt,
                        Notes = string.IsNullOrWhiteSpace(request.Notes) ? null : request.Notes.Trim()
                    };

                    _context.BillingRecords.Add(record);

                    await AddAuditLogAsync(
                        companyId,
                        "BillingRecord",
                        record.Id,
                        "Create",
                        null,
                        new
                        {
                            record.InvoiceNumber,
                            record.Amount,
                            record.Currency,
                            record.Status,
                            record.UserCountSnapshot,
                            record.PeriodStart,
                            record.PeriodEnd,
                            record.DueAt
                        });

                    await _context.SaveChangesAsync();

                    return StatusCode(StatusCodes.Status201Created, new AdminBillingRecordResponse
                    {
                        Id = record.Id,
                        CompanyId = companyId,
                        CompanyName = company.Name,
                        CompanySubscriptionId = record.CompanySubscriptionId,
                        SubscriptionPlanId = record.SubscriptionPlanId,
                        SubscriptionPlanName = subscription.SubscriptionPlan.Name,
                        InvoiceNumber = record.InvoiceNumber,
                        BillingCycle = record.BillingCycle,
                        Status = record.Status,
                        Amount = record.Amount,
                        Currency = record.Currency,
                        UserCountSnapshot = record.UserCountSnapshot,
                        PeriodStart = record.PeriodStart,
                        PeriodEnd = record.PeriodEnd,
                        IssuedAt = record.IssuedAt,
                        DueAt = record.DueAt,
                        PaidAt = record.PaidAt,
                        Notes = record.Notes
                    });
                });
        }

        [HttpPatch("billing-records/{billingRecordId:guid}/status")]
        public async Task<IActionResult> UpdateBillingRecordStatusAsync(Guid billingRecordId, [FromBody] UpdateBillingRecordStatusRequest request)
        {
            return await ExecuteAdminMutationAsync(
                Guid.Empty,
                "BillingRecord",
                billingRecordId,
                "UpdateStatus",
                () => request,
                async () =>
                {
                    var record = await _context.BillingRecords.IgnoreQueryFilters()
                        .Include(x => x.Company)
                        .FirstOrDefaultAsync(x => x.Id == billingRecordId && x.DeletedAt == null)
                        ?? throw new NotFoundException("Billing record not found");

                    var oldValue = new { record.Status, record.PaidAt, record.Notes };
                    record.Status = request.Status;
                    record.PaidAt = request.Status == BillingRecordStatus.Paid ? DateTime.UtcNow : null;
                    record.Notes = string.IsNullOrWhiteSpace(request.Notes) ? record.Notes : request.Notes.Trim();

                    await AddAuditLogAsync(
                        record.CompanyId,
                        "BillingRecord",
                        record.Id,
                        "UpdateStatus",
                        oldValue,
                        new { record.Status, record.PaidAt, record.Notes });

                    await _context.SaveChangesAsync();
                    return NoContent();
                });
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
            csv.AppendLine("Id,Company,ActorEmail,Action,Result,EntityType,EntityId,IpAddress,CreatedAt,Summary");
            foreach (var log in logs)
            {
                csv.AppendLine(string.Join(",",
                    EscapeCsv(log.Id.ToString()),
                    EscapeCsv(log.CompanyName),
                    EscapeCsv(log.UserEmail),
                    EscapeCsv(log.Action),
                    EscapeCsv(log.Result),
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
            var reports = await _context.ModerationEscalationReports.IgnoreQueryFilters()
                .Include(x => x.ReportedByUser)
                .Where(x => x.Status == ModerationEscalationStatus.Pending)
                .OrderByDescending(x => x.CreatedAt)
                .Take(50)
                .Select(x => new AdminModerationItemResponse
                {
                    Id = x.Id,
                    CompanyId = x.CompanyId,
                    Source = "HrEscalation",
                    TargetType = x.TargetType,
                    TargetId = x.TargetId,
                    Title = x.TargetLabel,
                    ReporterName = x.ReportedByUser.FullName,
                    Status = $"{x.Status} · {x.Severity}",
                    CreatedAt = x.CreatedAt,
                    Summary = x.Reason
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

            var queue = reports.Concat(pendingEvents)
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
            return await ExecuteAdminMutationAsync(
                Guid.Empty,
                "AppUser",
                userId,
                "ModerationLockUser",
                () => request,
                async () =>
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
                        user.CompanyId ?? Guid.Empty,
                        "AppUser",
                        user.Id,
                        "ModerationLockUser",
                        oldValue,
                        new { user.IsActive, request.Reason });

                    await ResolveEscalationReportsAsync(user.CompanyId ?? Guid.Empty, "AppUser", user.Id, "LockUser", request.Reason);
                    await _context.SaveChangesAsync();
                    return NoContent();
                });
        }

        [HttpPost("moderation/users/{userId:guid}/warn")]
        public async Task<IActionResult> WarnUserAsync(Guid userId, [FromBody] AdminModerationActionRequest request)
        {
            return await ExecuteAdminMutationAsync(
                Guid.Empty,
                "AppUser",
                userId,
                "ModerationWarnUser",
                () => request,
                async () =>
                {
                    var user = await _context.Users.IgnoreQueryFilters()
                        .FirstOrDefaultAsync(x => x.Id == userId && x.DeletedAt == null)
                        ?? throw new NotFoundException("User not found");

                    if (await _context.UserRoles
                            .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
                            .AnyAsync(x => x.UserId == userId && x.Name == AuthRoles.SystemAdmin))
                        throw new BadRequestException("System admin accounts cannot be warned through moderation");

                    var reason = string.IsNullOrWhiteSpace(request.Reason)
                        ? "Your recent activity was flagged for policy review."
                        : request.Reason.Trim();

                    await _notificationService.SendAsync(
                        user.Id,
                        "SystemModerationWarning",
                        "Policy warning from platform admin",
                        $"Your account activity was reviewed by the platform team. Reason: {reason}",
                        NotificationChannel.Push,
                        "AppUser",
                        user.Id);

                    await AddAuditLogAsync(
                        user.CompanyId ?? Guid.Empty,
                        "AppUser",
                        user.Id,
                        "ModerationWarnUser",
                        null,
                        new { Reason = reason });

                    await ResolveEscalationReportsAsync(user.CompanyId ?? Guid.Empty, "AppUser", user.Id, "WarnUser", reason);
                    await _context.SaveChangesAsync();
                    return NoContent();
                });
        }

        [HttpDelete("moderation/resources/{resourceId:guid}")]
        public async Task<IActionResult> DeleteResourceForModerationAsync(Guid resourceId, [FromBody] AdminModerationActionRequest? request = null)
        {
            return await ExecuteAdminMutationAsync(
                Guid.Empty,
                "Resource",
                resourceId,
                "ModerationDeleteResource",
                () => request,
                async () =>
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

                    await ResolveEscalationReportsAsync(resource.CompanyId, "Resource", resource.Id, "DeleteResource", request?.Reason);
                    await _context.SaveChangesAsync();
                    return NoContent();
                });
        }

        [HttpDelete("moderation/events/{eventId:guid}")]
        public async Task<IActionResult> DeleteEventForModerationAsync(Guid eventId, [FromBody] AdminModerationActionRequest? request = null)
        {
            return await ExecuteAdminMutationAsync(
                Guid.Empty,
                "TrainingEvent",
                eventId,
                "ModerationDeleteEvent",
                () => request,
                async () =>
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

                    await ResolveEscalationReportsAsync(trainingEvent.CompanyId, "TrainingEvent", trainingEvent.Id, "DeleteEvent", request?.Reason);
                    await _context.SaveChangesAsync();
                    return NoContent();
                });
        }

        [HttpPost("moderation/reports/{reportId:guid}/dismiss")]
        public async Task<IActionResult> DismissModerationReportAsync(Guid reportId, [FromBody] AdminModerationActionRequest? request = null)
        {
            return await ExecuteAdminMutationAsync(
                Guid.Empty,
                "ModerationEscalationReport",
                reportId,
                "Dismiss",
                () => request,
                async () =>
                {
                    var report = await _context.ModerationEscalationReports.IgnoreQueryFilters()
                        .FirstOrDefaultAsync(x => x.Id == reportId && x.DeletedAt == null)
                        ?? throw new NotFoundException("Moderation escalation report not found");

                    if (report.Status != ModerationEscalationStatus.Pending)
                        return NoContent();

                    var reviewerIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
                    var reviewerId = Guid.TryParse(reviewerIdValue, out var parsedReviewerId) ? parsedReviewerId : (Guid?)null;

                    report.Status = ModerationEscalationStatus.Dismissed;
                    report.ResolutionAction = "Dismiss";
                    report.ResolutionNotes = string.IsNullOrWhiteSpace(request?.Reason) ? null : request.Reason.Trim();
                    report.ReviewedByUserId = reviewerId;
                    report.ReviewedAt = DateTime.UtcNow;

                    await AddAuditLogAsync(
                        report.CompanyId,
                        "ModerationEscalationReport",
                        report.Id,
                        "Dismiss",
                        new { PreviousStatus = ModerationEscalationStatus.Pending.ToString() },
                        new { report.Status, report.ResolutionAction, report.ResolutionNotes });

                    await _context.SaveChangesAsync();
                    return NoContent();
                });
        }

        [HttpPatch("platform-settings")]
        public async Task<IActionResult> UpdatePlatformSettingsAsync([FromBody] UpdatePlatformSettingsRequest request)
        {
            var sanitizedRequest = SanitizePlatformSettingsForAudit(request);

            return await ExecuteAdminMutationAsync(
                Guid.Empty,
                "PlatformSettings",
                null,
                "Update",
                () => sanitizedRequest,
                async () =>
                {
                    if (request.InviteExpiryDays < 1)
                        throw new BadRequestException("Invite expiry days must be at least 1");
                    if (request.RefreshTokenDays < 1)
                        throw new BadRequestException("Refresh token days must be at least 1");
                    if (request.SmtpPort.HasValue && request.SmtpPort.Value < 1)
                        throw new BadRequestException("SMTP port must be greater than 0");

                    await UpdateAppSettingsJsonAsync(request);

                    await AddAuditLogAsync(
                        Guid.Empty,
                        "PlatformSettings",
                        null,
                        "Update",
                        BuildPlatformSettings(),
                        sanitizedRequest);

                    await _context.SaveChangesAsync();
                    return Ok(BuildPlatformSettings());
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
                    Result = string.IsNullOrWhiteSpace(x.Result) ? "SUCCESS" : x.Result,
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
                        Result = "SUCCESS",
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

        private async Task<List<AdminRetentionCohortResponse>> GetRetentionCohortsInternalAsync()
        {
            var now = DateTime.UtcNow;
            var cohortStarts = Enumerable.Range(0, 6)
                .Select(offset =>
                {
                    var month = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc).AddMonths(-offset);
                    return month;
                })
                .OrderBy(x => x)
                .ToList();

            var earliest = cohortStarts.First();
            var latestExclusive = cohortStarts.Last().AddMonths(1);

            var users = await _context.Users.IgnoreQueryFilters()
                .Where(x => x.DeletedAt == null && x.CreatedAt >= earliest && x.CreatedAt < latestExclusive)
                .Select(x => new
                {
                    x.CreatedAt,
                    x.LastLoginAt
                })
                .ToListAsync();

            return cohortStarts.Select(cohortStart =>
            {
                var cohortEnd = cohortStart.AddMonths(1);
                var cohortUsers = users
                    .Where(user => user.CreatedAt >= cohortStart && user.CreatedAt < cohortEnd)
                    .ToList();

                var retained30 = cohortUsers.Count(user => user.LastLoginAt.HasValue && user.LastLoginAt.Value >= cohortStart.AddDays(30));
                var retained60 = cohortUsers.Count(user => user.LastLoginAt.HasValue && user.LastLoginAt.Value >= cohortStart.AddDays(60));
                var retained90 = cohortUsers.Count(user => user.LastLoginAt.HasValue && user.LastLoginAt.Value >= cohortStart.AddDays(90));
                var newUsers = cohortUsers.Count;

                return new AdminRetentionCohortResponse
                {
                    CohortLabel = cohortStart.ToString("MMM yyyy"),
                    CohortStart = cohortStart,
                    NewUsers = newUsers,
                    Retained30Days = retained30,
                    Retained60Days = retained60,
                    Retained90Days = retained90,
                    Retained30DaysRate = newUsers == 0 ? 0 : Math.Round((double)retained30 / newUsers * 100, 2),
                    Retained60DaysRate = newUsers == 0 ? 0 : Math.Round((double)retained60 / newUsers * 100, 2),
                    Retained90DaysRate = newUsers == 0 ? 0 : Math.Round((double)retained90 / newUsers * 100, 2)
                };
            }).ToList();
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
            var apiEnv = LoadEnvFileValues(_apiEnvPath);
            var frontendUrls = _configuration.GetSection("Frontend:Urls").Get<string[]>() ?? [];
            var googleClientId = GetPersistedValue(apiEnv, "GOOGLE_CLIENT_ID", _configuration["GOOGLE_CLIENT_ID"]);
            var googleClientSecret = GetPersistedValue(apiEnv, "GOOGLE_CLIENT_SECRET", _configuration["GOOGLE_CLIENT_SECRET"]);
            var smtpHost = GetPersistedValue(apiEnv, "SMTP_HOST", _configuration["SMTP_HOST"]);
            var smtpUsername = GetPersistedValue(apiEnv, "SMTP_USERNAME", _configuration["SMTP_USERNAME"]);
            var smtpPassword = GetPersistedValue(apiEnv, "SMTP_PASSWORD", _configuration["SMTP_PASSWORD"]);
            var smtpFromName = GetPersistedValue(apiEnv, "SMTP_FROM_NAME", _configuration["SMTP_FROM_NAME"]);
            var smtpPort = int.TryParse(GetPersistedValue(apiEnv, "SMTP_PORT", _configuration["SMTP_PORT"]), out var parsedSmtpPort) ? parsedSmtpPort : 587;
            var smtpEnableSsl = bool.TryParse(GetPersistedValue(apiEnv, "SMTP_ENABLE_SSL", _configuration["SMTP_ENABLE_SSL"]), out var parsedSmtpEnableSsl) ? parsedSmtpEnableSsl : true;
            var zoomClientId = GetPersistedValue(apiEnv, "ZOOM_CLIENT_ID", _configuration["ZOOM_CLIENT_ID"]);
            var zoomClientSecret = GetPersistedValue(apiEnv, "ZOOM_CLIENT_SECRET", _configuration["ZOOM_CLIENT_SECRET"]);
            var microsoftClientId = GetPersistedValue(apiEnv, "MICROSOFT_CLIENT_ID", _configuration["MICROSOFT_CLIENT_ID"]);
            var microsoftClientSecret = GetPersistedValue(apiEnv, "MICROSOFT_CLIENT_SECRET", _configuration["MICROSOFT_CLIENT_SECRET"]);
            var microsoftTenantId = GetPersistedValue(apiEnv, "MICROSOFT_TENANT_ID", _configuration["MICROSOFT_TENANT_ID"]);

            return new PlatformSettingsResponse
            {
                EnvironmentName = Environment.GetEnvironmentVariable("ASPNETCORE_ENVIRONMENT") ?? "Production",
                GoogleOAuthConfigured =
                    !string.IsNullOrWhiteSpace(googleClientId) &&
                    !string.IsNullOrWhiteSpace(googleClientSecret),
                GoogleClientId = googleClientId,
                SmtpConfigured =
                    !string.IsNullOrWhiteSpace(smtpHost) &&
                    !string.IsNullOrWhiteSpace(smtpUsername) &&
                    !string.IsNullOrWhiteSpace(smtpPassword),
                SmtpHost = smtpHost,
                SmtpPort = smtpPort,
                SmtpUsername = smtpUsername,
                SmtpFromName = smtpFromName,
                SmtpEnableSsl = smtpEnableSsl,
                ZoomConfigured =
                    !string.IsNullOrWhiteSpace(zoomClientId) &&
                    !string.IsNullOrWhiteSpace(zoomClientSecret),
                ZoomClientId = zoomClientId,
                MicrosoftOAuthConfigured =
                    !string.IsNullOrWhiteSpace(microsoftClientId) &&
                    !string.IsNullOrWhiteSpace(microsoftClientSecret) &&
                    !string.IsNullOrWhiteSpace(microsoftTenantId),
                MicrosoftClientId = microsoftClientId,
                MicrosoftTenantId = microsoftTenantId,
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

            await UpdateEnvFilesAsync(request);
        }

        private async Task UpdateEnvFilesAsync(UpdatePlatformSettingsRequest request)
        {
            var apiEnv = LoadEnvFileValues(_apiEnvPath);
            UpsertEnvValue(apiEnv, "GOOGLE_CLIENT_ID", NormalizeOptional(request.GoogleClientId), preserveExistingWhenBlank: false);
            UpsertEnvValue(apiEnv, "GOOGLE_CLIENT_SECRET", NormalizeOptional(request.GoogleClientSecret), preserveExistingWhenBlank: true);
            UpsertEnvValue(apiEnv, "SMTP_HOST", NormalizeOptional(request.SmtpHost), preserveExistingWhenBlank: false);
            UpsertEnvValue(apiEnv, "SMTP_PORT", request.SmtpPort?.ToString(), preserveExistingWhenBlank: false);
            UpsertEnvValue(apiEnv, "SMTP_USERNAME", NormalizeOptional(request.SmtpUsername), preserveExistingWhenBlank: false);
            UpsertEnvValue(apiEnv, "SMTP_PASSWORD", NormalizeOptional(request.SmtpPassword), preserveExistingWhenBlank: true);
            UpsertEnvValue(apiEnv, "SMTP_FROM_NAME", NormalizeOptional(request.SmtpFromName), preserveExistingWhenBlank: false);
            if (request.SmtpEnableSsl.HasValue)
                UpsertEnvValue(apiEnv, "SMTP_ENABLE_SSL", request.SmtpEnableSsl.Value ? "true" : "false", preserveExistingWhenBlank: false);
            UpsertEnvValue(apiEnv, "ZOOM_CLIENT_ID", NormalizeOptional(request.ZoomClientId), preserveExistingWhenBlank: false);
            UpsertEnvValue(apiEnv, "ZOOM_CLIENT_SECRET", NormalizeOptional(request.ZoomClientSecret), preserveExistingWhenBlank: true);
            UpsertEnvValue(apiEnv, "MICROSOFT_CLIENT_ID", NormalizeOptional(request.MicrosoftClientId), preserveExistingWhenBlank: false);
            UpsertEnvValue(apiEnv, "MICROSOFT_CLIENT_SECRET", NormalizeOptional(request.MicrosoftClientSecret), preserveExistingWhenBlank: true);
            UpsertEnvValue(apiEnv, "MICROSOFT_TENANT_ID", NormalizeOptional(request.MicrosoftTenantId), preserveExistingWhenBlank: false);
            await WriteEnvFileAsync(_apiEnvPath, apiEnv);

            var webEnv = LoadEnvFileValues(_webEnvPath);
            if (!string.IsNullOrWhiteSpace(request.GoogleClientId))
            {
                UpsertEnvValue(webEnv, "VITE_GOOGLE_CLIENT_ID", request.GoogleClientId.Trim(), preserveExistingWhenBlank: false);
                await WriteEnvFileAsync(_webEnvPath, webEnv);
            }
        }

        private static Dictionary<string, string> LoadEnvFileValues(string path)
        {
            var values = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
            if (!System.IO.File.Exists(path))
                return values;

            foreach (var rawLine in System.IO.File.ReadAllLines(path))
            {
                var line = rawLine.Trim();
                if (line.Length == 0 || line.StartsWith('#'))
                    continue;

                var separatorIndex = line.IndexOf('=');
                if (separatorIndex <= 0)
                    continue;

                var key = line[..separatorIndex].Trim();
                var value = line[(separatorIndex + 1)..];
                values[key] = value;
            }

            return values;
        }

        private static async Task WriteEnvFileAsync(string path, IDictionary<string, string> values)
        {
            var output = new List<string>();
            var handledKeys = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var originalLines = System.IO.File.Exists(path) ? await System.IO.File.ReadAllLinesAsync(path) : [];

            foreach (var line in originalLines)
            {
                var trimmed = line.Trim();
                if (trimmed.Length == 0 || trimmed.StartsWith('#'))
                {
                    output.Add(line);
                    continue;
                }

                var separatorIndex = line.IndexOf('=');
                if (separatorIndex <= 0)
                {
                    output.Add(line);
                    continue;
                }

                var key = line[..separatorIndex].Trim();
                if (!values.TryGetValue(key, out var value))
                    continue;

                output.Add($"{key}={value}");
                handledKeys.Add(key);
            }

            foreach (var entry in values.Where(x => !handledKeys.Contains(x.Key)).OrderBy(x => x.Key, StringComparer.OrdinalIgnoreCase))
            {
                output.Add($"{entry.Key}={entry.Value}");
            }

            await System.IO.File.WriteAllLinesAsync(path, output);
        }

        private static void UpsertEnvValue(IDictionary<string, string> values, string key, string? value, bool preserveExistingWhenBlank)
        {
            if (string.IsNullOrWhiteSpace(value))
            {
                if (!preserveExistingWhenBlank)
                    values.Remove(key);
                return;
            }

            values[key] = value.Trim();
        }

        private static string? NormalizeOptional(string? value) =>
            string.IsNullOrWhiteSpace(value) ? null : value.Trim();

        private static string? GetPersistedValue(IDictionary<string, string> envValues, string key, string? fallback)
        {
            return envValues.TryGetValue(key, out var value) && !string.IsNullOrWhiteSpace(value)
                ? value
                : fallback;
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

        private static object SanitizePlatformSettingsForAudit(UpdatePlatformSettingsRequest request)
        {
            return new
            {
                request.InviteExpiryDays,
                request.RefreshTokenDays,
                request.MaintenanceMode,
                SystemBanner = string.IsNullOrWhiteSpace(request.SystemBanner) ? null : request.SystemBanner.Trim(),
                FrontendUrls = request.FrontendUrls,
                GoogleClientId = NormalizeOptional(request.GoogleClientId),
                GoogleClientSecretUpdated = !string.IsNullOrWhiteSpace(request.GoogleClientSecret),
                SmtpHost = NormalizeOptional(request.SmtpHost),
                request.SmtpPort,
                SmtpUsername = NormalizeOptional(request.SmtpUsername),
                SmtpPasswordUpdated = !string.IsNullOrWhiteSpace(request.SmtpPassword),
                SmtpFromName = NormalizeOptional(request.SmtpFromName),
                request.SmtpEnableSsl,
                ZoomClientId = NormalizeOptional(request.ZoomClientId),
                ZoomClientSecretUpdated = !string.IsNullOrWhiteSpace(request.ZoomClientSecret),
                MicrosoftClientId = NormalizeOptional(request.MicrosoftClientId),
                MicrosoftClientSecretUpdated = !string.IsNullOrWhiteSpace(request.MicrosoftClientSecret),
                MicrosoftTenantId = NormalizeOptional(request.MicrosoftTenantId)
            };
        }

        private async Task ResolveEscalationReportsAsync(Guid companyId, string targetType, Guid targetId, string resolutionAction, string? resolutionNotes)
        {
            var reviewerIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var reviewerId = Guid.TryParse(reviewerIdValue, out var parsedReviewerId) ? parsedReviewerId : (Guid?)null;

            var reports = await _context.ModerationEscalationReports.IgnoreQueryFilters()
                .Where(x =>
                    x.CompanyId == companyId &&
                    x.TargetType == targetType &&
                    x.TargetId == targetId &&
                    x.Status == ModerationEscalationStatus.Pending &&
                    x.DeletedAt == null)
                .ToListAsync();

            foreach (var report in reports)
            {
                report.Status = ModerationEscalationStatus.Resolved;
                report.ResolutionAction = resolutionAction;
                report.ResolutionNotes = string.IsNullOrWhiteSpace(resolutionNotes) ? null : resolutionNotes.Trim();
                report.ReviewedByUserId = reviewerId;
                report.ReviewedAt = DateTime.UtcNow;
            }
        }

        private async Task<int> RevokeCompanySessionsAsync(Guid companyId)
        {
            var userIds = await _context.Users.IgnoreQueryFilters()
                .Where(x => x.CompanyId == companyId && x.DeletedAt == null)
                .Select(x => x.Id)
                .ToListAsync();

            if (userIds.Count == 0)
                return 0;

            var sessions = await _context.UserSessions.IgnoreQueryFilters()
                .Where(x => userIds.Contains(x.UserId) && x.IsActive)
                .ToListAsync();

            foreach (var session in sessions)
            {
                session.IsActive = false;
                session.RevokedAt = DateTime.UtcNow;
            }

            return sessions.Count;
        }

        private async Task<IActionResult> ExecuteAdminMutationAsync(
            Guid companyId,
            string entityType,
            Guid? entityId,
            string action,
            Func<object?>? failurePayloadFactory,
            Func<Task<IActionResult>> operation)
        {
            try
            {
                return await operation();
            }
            catch (AppException ex)
            {
                await TryAddFailedAuditLogAsync(companyId, entityType, entityId, action, failurePayloadFactory, ex.Message);
                throw;
            }
        }

        private async Task TryAddFailedAuditLogAsync(
            Guid companyId,
            string entityType,
            Guid? entityId,
            string action,
            Func<object?>? failurePayloadFactory,
            string errorMessage)
        {
            try
            {
                await AddAuditLogAsync(
                    companyId,
                    entityType,
                    entityId,
                    action,
                    null,
                    new
                    {
                        Error = errorMessage,
                        Payload = failurePayloadFactory?.Invoke()
                    },
                    "FAILED");

                await _context.SaveChangesAsync();
            }
            catch
            {
                _context.ChangeTracker.Clear();
            }
        }

        private async Task AddAuditLogAsync(Guid companyId, string entityType, Guid? entityId, string action, object? oldValue, object? newValue, string result = "SUCCESS")
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
                Result = result,
                OldValueJson = oldValue == null ? null : JsonSerializer.Serialize(oldValue),
                NewValueJson = newValue == null ? null : JsonSerializer.Serialize(newValue),
                IpAddress = HttpContext.Connection.RemoteIpAddress?.ToString(),
                UserAgent = Request.Headers.UserAgent.ToString()
            });

            await Task.CompletedTask;
        }

        private static SubscriptionPlanResponse ToSubscriptionPlanResponse(SubscriptionPlan plan)
        {
            return new SubscriptionPlanResponse
            {
                Id = plan.Id,
                Name = plan.Name,
                MaxUsers = plan.MaxUsers,
                StorageQuotaGb = plan.StorageQuotaGb,
                PricePerUser = plan.PricePerUser,
                BillingCycle = plan.BillingCycle,
                IsActive = plan.IsActive
            };
        }

        private static void ValidateSubscriptionPlanRequest(UpsertSubscriptionPlanRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Name))
                throw new BadRequestException("Subscription plan name is required");
            if (request.MaxUsers < 1)
                throw new BadRequestException("Max users must be at least 1");
            if (request.StorageQuotaGb < 1)
                throw new BadRequestException("Storage quota must be at least 1 GB");
            if (request.PricePerUser < 0)
                throw new BadRequestException("Price per user cannot be negative");
        }
    }
}
