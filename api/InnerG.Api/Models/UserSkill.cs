using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum ProficiencyLevel
    {
        Beginner,
        Intermediate,
        Expert
    }

    public enum SkillSource
    {
        SelfDeclared,
        HRVerified,
        CourseCompleted
    }

    public class UserSkill : BaseEntity
    {
        public Guid UserId { get; set; }
        public Guid SkillId { get; set; }
        
        public ProficiencyLevel Proficiency { get; set; }
        public bool IsMentorSkill { get; set; } = false;
        public SkillSource Source { get; set; } = SkillSource.SelfDeclared;
        
        public Guid? VerifiedByUserId { get; set; }
        public DateTime? VerifiedAt { get; set; }

        // Navigation properties
        public virtual AppUser User { get; set; } = null!;
        public virtual Skill Skill { get; set; } = null!;
        public virtual AppUser? VerifiedByUser { get; set; }
    }
}
