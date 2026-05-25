using System;
using System.Collections.Generic;
using InnerG.Api.Models;

namespace InnerG.Api.DTOs
{
    public class AdminOverviewResponse
    {
        public int TotalCompanies { get; set; }
        public int ActiveCompanies { get; set; }
        public int PendingInvites { get; set; }
        public int ActiveSubscriptions { get; set; }
        public int ActiveSessions { get; set; }
        public int PrivilegedAccounts { get; set; }
        public int AuditEventsLast7Days { get; set; }
        public PlatformSettingsResponse PlatformSettings { get; set; } = new();
        public IList<AdminCompanyResponse> Companies { get; set; } = new List<AdminCompanyResponse>();
        public IList<RoleCountResponse> RoleDistribution { get; set; } = new List<RoleCountResponse>();
        public IList<AdminAuditLogResponse> RecentActivity { get; set; } = new List<AdminAuditLogResponse>();
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

    public class AdminAuditLogResponse
    {
        public Guid Id { get; set; }
        public string Action { get; set; } = string.Empty;
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

    public class UpdateCompanyStatusRequest
    {
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

    public class PlatformSettingsResponse
    {
        public string EnvironmentName { get; set; } = string.Empty;
        public bool GoogleOAuthConfigured { get; set; }
        public bool SmtpConfigured { get; set; }
        public int InviteExpiryDays { get; set; }
        public int RefreshTokenDays { get; set; }
        public IList<string> FrontendUrls { get; set; } = new List<string>();
    }
}
