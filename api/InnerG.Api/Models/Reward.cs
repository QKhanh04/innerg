using System;
using System.Collections.Generic;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum RewardType
    {
        Voucher,
        PhysicalGift,
        Permission, // e.g. "Work from home pass"
        TrainingAccess
    }

    public class Reward : TenantEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public RewardType Type { get; set; }
        
        public int PointCost { get; set; }
        public int StockQuantity { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual ICollection<UserReward> Redemptions { get; set; } = new List<UserReward>();
    }
}
