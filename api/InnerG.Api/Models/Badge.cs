using System;
using System.Collections.Generic;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum BadgeConditionType
    {
        FirstTeach,
        SessionsCount,
        AvgRatingGte,
        TopRankedMonthly,
        WishlistFulfilled
    }

    public class Badge : BaseEntity
    {
        public Guid? CompanyId { get; set; } // NULL = system badge
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? IconUrl { get; set; }
        
        public BadgeConditionType ConditionType { get; set; }
        public int? ConditionValue { get; set; }
        public bool IsSystem { get; set; } = false;

        public virtual Company? Company { get; set; }
        public virtual ICollection<UserBadge> UserBadges { get; set; } = new List<UserBadge>();
    }

    public class UserBadge : BaseEntity
    {
        public Guid UserId { get; set; }
        public Guid BadgeId { get; set; }
        public DateTime AwardedAt { get; set; }

        public virtual AppUser User { get; set; } = null!;
        public virtual Badge Badge { get; set; } = null!;
    }
}
