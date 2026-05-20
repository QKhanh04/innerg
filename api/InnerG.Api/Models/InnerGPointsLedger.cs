using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum PointTransactionType
    {
        EarnedTeaching,
        RatingBonus,
        RuleBonus,
        Redeemed,
        AdjustedByHR,
        Expired
    }

    public class InnerGPointsLedger : BaseEntity
    {
        public Guid UserId { get; set; }
        public int Amount { get; set; }
        public int BalanceAfter { get; set; }
        
        public PointTransactionType Type { get; set; }
        public string? ReferenceType { get; set; }
        public Guid? ReferenceId { get; set; }
        public Guid? AppliedRuleId { get; set; }
        
        public string? Note { get; set; }
        public Guid? CreatedByUserId { get; set; }

        public virtual AppUser User { get; set; } = null!;
        public virtual PointRule? AppliedRule { get; set; }
        public virtual AppUser? CreatedByUser { get; set; }
    }
}
