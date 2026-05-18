using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public class SkillAssessment : BaseEntity
    {
        public Guid UserId { get; set; }
        public Guid SkillId { get; set; }
        public Guid AssessorUserId { get; set; }
        
        public ProficiencyLevel Proficiency { get; set; }
        public decimal? Score { get; set; }
        public string? Notes { get; set; }
        public string Period { get; set; } = string.Empty; // e.g., "2026-H1"

        // Navigation properties
        public virtual AppUser User { get; set; } = null!;
        public virtual Skill Skill { get; set; } = null!;
        public virtual AppUser Assessor { get; set; } = null!;
    }
}
