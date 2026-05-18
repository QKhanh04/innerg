using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum PeriodType { Monthly, Quarterly, Yearly }

    public class LeaderboardSnapshot : TenantEntity
    {
        public Guid UserId { get; set; }
        public Guid? DepartmentId { get; set; }
        
        public PeriodType PeriodType { get; set; }
        public string PeriodValue { get; set; } = string.Empty; // 2026-05, etc.
        
        public int RankOverall { get; set; }
        public int? RankInDepartment { get; set; }
        public int TotalPointsEarned { get; set; }
        
        public int SessionsTaught { get; set; }
        public int TotalLearners { get; set; }
        public decimal? AvgRating { get; set; }
        
        public DateTime SnapshotAt { get; set; }

        public virtual AppUser User { get; set; } = null!;
        public virtual Department? Department { get; set; }
    }
}
