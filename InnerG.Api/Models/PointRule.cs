using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum RuleType { BasePoints, Multiplier, Bonus }
    public enum ConditionType { PerAttendee, Format, CrossDepartment, AvgRatingGte, DurationGte }
    public enum ConditionOperator { Equals, Gte, Lte, In }

    public class PointRule : TenantEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        
        public RuleType RuleType { get; set; }
        public ConditionType ConditionType { get; set; }
        public ConditionOperator? ConditionOperator { get; set; }
        public string? ConditionValue { get; set; }
        
        public decimal PointsValue { get; set; }
        public int Priority { get; set; } = 0;
        public bool IsActive { get; set; } = true;
        public Guid CreatedByUserId { get; set; }

        public virtual AppUser CreatedByUser { get; set; } = null!;
    }
}
