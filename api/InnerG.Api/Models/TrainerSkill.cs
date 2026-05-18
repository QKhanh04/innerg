using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public class TrainerSkill : BaseEntity
    {
        public Guid TrainerId { get; set; }
        public Guid SkillId { get; set; }
        
        public ProficiencyLevel Proficiency { get; set; }

        // Navigation properties
        public virtual Trainer Trainer { get; set; } = null!;
        public virtual Skill Skill { get; set; } = null!;
    }
}
