using System;
using System.Collections.Generic;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum BillingCycle
    {
        Monthly,
        Yearly
    }

    public class SubscriptionPlan : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public int MaxUsers { get; set; }
        public int StorageQuotaGb { get; set; }
        public decimal PricePerUser { get; set; }
        public BillingCycle BillingCycle { get; set; }
        public bool IsActive { get; set; } = true;

        public virtual ICollection<CompanySubscription> Subscriptions { get; set; } = new List<CompanySubscription>();
    }
}
