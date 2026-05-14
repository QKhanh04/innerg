using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum RedemptionStatus
    {
        Requested,
        Approved,
        Fulfilled,
        Rejected,
        Cancelled
    }

    public class UserReward : TenantEntity
    {
        public Guid UserId { get; set; }
        public Guid RewardId { get; set; }
        
        public RedemptionStatus Status { get; set; } = RedemptionStatus.Requested;
        public int PointsSpent { get; set; }
        public DateTime RedeemedAt { get; set; }
        
        public string? ShippingAddress { get; set; }
        public string? AdminNotes { get; set; }

        // Navigation properties
        public virtual AppUser User { get; set; } = null!;
        public virtual Reward Reward { get; set; } = null!;
    }
}
