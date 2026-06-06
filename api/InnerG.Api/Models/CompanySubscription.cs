using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum SubscriptionStatus
    {
        Trial,
        Active,
        PastDue,
        Cancelled,
        Expired
    }

    public class CompanySubscription : BaseEntity
    {
        public Guid CompanyId { get; set; }
        public Guid SubscriptionPlanId { get; set; }
        
        public SubscriptionStatus Status { get; set; }
        public DateTime StartedAt { get; set; }
        public DateTime? TrialEndsAt { get; set; }
        public DateTime CurrentPeriodStart { get; set; }
        public DateTime CurrentPeriodEnd { get; set; }
        public DateTime? CancelledAt { get; set; }

        public virtual Company Company { get; set; } = null!;
        public virtual SubscriptionPlan SubscriptionPlan { get; set; } = null!;
    }
}
