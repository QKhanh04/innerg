using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum BillingRecordStatus
    {
        Pending,
        Paid,
        Failed,
        Refunded,
        Voided
    }

    public class BillingRecord : BaseEntity
    {
        public Guid CompanyId { get; set; }
        public Guid CompanySubscriptionId { get; set; }
        public Guid SubscriptionPlanId { get; set; }
        public string InvoiceNumber { get; set; } = string.Empty;
        public BillingCycle BillingCycle { get; set; }
        public BillingRecordStatus Status { get; set; } = BillingRecordStatus.Pending;
        public decimal Amount { get; set; }
        public string Currency { get; set; } = "USD";
        public int UserCountSnapshot { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public DateTime IssuedAt { get; set; }
        public DateTime DueAt { get; set; }
        public DateTime? PaidAt { get; set; }
        public string? Notes { get; set; }

        public virtual Company Company { get; set; } = null!;
        public virtual CompanySubscription CompanySubscription { get; set; } = null!;
        public virtual SubscriptionPlan SubscriptionPlan { get; set; } = null!;
    }
}
