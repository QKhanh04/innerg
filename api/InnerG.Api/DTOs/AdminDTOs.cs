using System;
using System.Collections.Generic;
using InnerG.Api.Models;

namespace InnerG.Api.DTOs
{
    public class AdminOverviewResponse
    {
        public int TotalCompanies { get; set; }
        public int ActiveCompanies { get; set; }
        public int TotalUsers { get; set; }
        public int EventsThisMonth { get; set; }
        public long TotalStorageBytes { get; set; }
        public int TotalStorageQuotaGb { get; set; }
        public double PlatformStorageUsedPercent { get; set; }
        public double AverageRetentionRate { get; set; }
        public int PendingInvites { get; set; }
        public int ActiveSubscriptions { get; set; }
        public int ActiveSessions { get; set; }
        public int PrivilegedAccounts { get; set; }
        public int AuditEventsLast7Days { get; set; }
        public PlatformSettingsResponse PlatformSettings { get; set; } = new();
        public IList<AdminCompanyResponse> Companies { get; set; } = new List<AdminCompanyResponse>();
        public IList<RoleCountResponse> RoleDistribution { get; set; } = new List<RoleCountResponse>();
        public IList<AdminAuditLogResponse> RecentActivity { get; set; } = new List<AdminAuditLogResponse>();
        public IList<AdminRetentionCohortResponse> RetentionCohorts { get; set; } = new List<AdminRetentionCohortResponse>();
    }

    public class AdminCompanyResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Domain { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public bool IsActive { get; set; }
        public DateTime? DeletedAt { get; set; }
        public string Timezone { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public int MemberCount { get; set; }
        public int MentorCount { get; set; }
        public int HrCount { get; set; }
        public int PendingInviteCount { get; set; }
        public int EventsThisMonth { get; set; }
        public long StorageUsedBytes { get; set; }
        public int? StorageQuotaGb { get; set; }
        public double StorageUsedPercent { get; set; }
        public double RetentionRate { get; set; }
        public bool IsNearPlanLimit { get; set; }
        public bool IsOverPlanLimit { get; set; }
        public string? SubscriptionPlanName { get; set; }
        public SubscriptionStatus? SubscriptionStatus { get; set; }
        public DateTime? SubscriptionEndsAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class AdminCompanyDetailResponse
    {
        public AdminCompanyResponse Company { get; set; } = new();
        public IList<AdminAuditLogResponse> RecentActivity { get; set; } = new List<AdminAuditLogResponse>();
        public IList<AdminInviteResponse> PendingInvites { get; set; } = new List<AdminInviteResponse>();
        public IList<AdminMemberSummaryResponse> KeyMembers { get; set; } = new List<AdminMemberSummaryResponse>();
    }

    public class AdminInviteResponse
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string RolesCsv { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class AdminMemberSummaryResponse
    {
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public bool IsActive { get; set; }
        public DateTime? LastLoginAt { get; set; }
    }

    public class RoleCountResponse
    {
        public string Role { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class AdminRetentionCohortResponse
    {
        public string CohortLabel { get; set; } = string.Empty;
        public DateTime CohortStart { get; set; }
        public int NewUsers { get; set; }
        public int Retained30Days { get; set; }
        public int Retained60Days { get; set; }
        public int Retained90Days { get; set; }
        public double Retained30DaysRate { get; set; }
        public double Retained60DaysRate { get; set; }
        public double Retained90DaysRate { get; set; }
    }

    public class AdminAuditLogResponse
    {
        public Guid Id { get; set; }
        public string Action { get; set; } = string.Empty;
        public string Result { get; set; } = "SUCCESS";
        public string EntityType { get; set; } = string.Empty;
        public Guid? EntityId { get; set; }
        public Guid CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string UserEmail { get; set; } = string.Empty;
        public string? IpAddress { get; set; }
        public DateTime CreatedAt { get; set; }
        public string? Summary { get; set; }
    }

    public class AdminAuditLogQuery
    {
        public int Take { get; set; } = 50;
        public Guid? CompanyId { get; set; }
        public Guid? ActorId { get; set; }
        public string? Action { get; set; }
        public string? EntityType { get; set; }
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
    }

    public class SubscriptionPlanResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public int MaxUsers { get; set; }
        public int StorageQuotaGb { get; set; }
        public decimal PricePerUser { get; set; }
        public BillingCycle BillingCycle { get; set; }
        public bool IsActive { get; set; }
    }

    public class UpsertSubscriptionPlanRequest
    {
        public string Name { get; set; } = string.Empty;
        public int MaxUsers { get; set; }
        public int StorageQuotaGb { get; set; }
        public decimal PricePerUser { get; set; }
        public BillingCycle BillingCycle { get; set; } = BillingCycle.Monthly;
        public bool IsActive { get; set; } = true;
    }

    public class UpdateCompanyStatusRequest
    {
        public bool IsActive { get; set; }
    }

    public class BulkUpdateCompanyStatusRequest
    {
        public IList<Guid> CompanyIds { get; set; } = new List<Guid>();
        public bool IsActive { get; set; }
    }

    public class UpdateCompanyRequest
    {
        public string Name { get; set; } = string.Empty;
        public string Domain { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string Timezone { get; set; } = "Asia/Ho_Chi_Minh";
        public string Language { get; set; } = "vi";
    }

    public class AssignSubscriptionRequest
    {
        public Guid SubscriptionPlanId { get; set; }
        public SubscriptionStatus Status { get; set; } = SubscriptionStatus.Active;
        public DateTime CurrentPeriodStart { get; set; } = DateTime.UtcNow;
        public DateTime CurrentPeriodEnd { get; set; } = DateTime.UtcNow.AddMonths(1);
        public DateTime? TrialEndsAt { get; set; }
    }

    public class AdminBillingRecordResponse
    {
        public Guid Id { get; set; }
        public Guid CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public Guid CompanySubscriptionId { get; set; }
        public Guid SubscriptionPlanId { get; set; }
        public string SubscriptionPlanName { get; set; } = string.Empty;
        public string InvoiceNumber { get; set; } = string.Empty;
        public BillingCycle BillingCycle { get; set; }
        public BillingRecordStatus Status { get; set; }
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public int UserCountSnapshot { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public DateTime IssuedAt { get; set; }
        public DateTime DueAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public string? Notes { get; set; }
    }

    public class CreateBillingRecordRequest
    {
        public DateTime? DueAt { get; set; }
        public string Currency { get; set; } = "USD";
        public string? Notes { get; set; }
    }

    public class UpdateBillingRecordStatusRequest
    {
        public BillingRecordStatus Status { get; set; }
        public string? Notes { get; set; }
    }

    public class PlatformSettingsResponse
    {
        public string EnvironmentName { get; set; } = string.Empty;
        public bool GoogleOAuthConfigured { get; set; }
        public string? GoogleClientId { get; set; }
        public bool SmtpConfigured { get; set; }
        public string? SmtpHost { get; set; }
        public int SmtpPort { get; set; }
        public string? SmtpUsername { get; set; }
        public string? SmtpFromName { get; set; }
        public bool SmtpEnableSsl { get; set; }
        public bool ZoomConfigured { get; set; }
        public string? ZoomClientId { get; set; }
        public bool MicrosoftOAuthConfigured { get; set; }
        public string? MicrosoftClientId { get; set; }
        public string? MicrosoftTenantId { get; set; }
        public int InviteExpiryDays { get; set; }
        public int RefreshTokenDays { get; set; }
        public bool MaintenanceMode { get; set; }
        public string? SystemBanner { get; set; }
        public IList<string> FrontendUrls { get; set; } = new List<string>();
    }

    public class UpdatePlatformSettingsRequest
    {
        public int InviteExpiryDays { get; set; } = 7;
        public int RefreshTokenDays { get; set; } = 7;
        public bool MaintenanceMode { get; set; }
        public string? SystemBanner { get; set; }
        public IList<string> FrontendUrls { get; set; } = new List<string>();
        public string? GoogleClientId { get; set; }
        public string? GoogleClientSecret { get; set; }
        public string? SmtpHost { get; set; }
        public int? SmtpPort { get; set; }
        public string? SmtpUsername { get; set; }
        public string? SmtpPassword { get; set; }
        public string? SmtpFromName { get; set; }
        public bool? SmtpEnableSsl { get; set; }
        public string? ZoomClientId { get; set; }
        public string? ZoomClientSecret { get; set; }
        public string? MicrosoftClientId { get; set; }
        public string? MicrosoftClientSecret { get; set; }
        public string? MicrosoftTenantId { get; set; }
    }

    public class AdminModerationItemResponse
    {
        public Guid Id { get; set; }
        public Guid CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public string Source { get; set; } = string.Empty;
        public string TargetType { get; set; } = string.Empty;
        public Guid? TargetId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string ReporterName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public string? Summary { get; set; }
    }

    public class AdminModerationActionRequest
    {
        public string? Reason { get; set; }
    }
}
