using System;
using System.Collections.Generic;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public class Skill : BaseEntity
    {
        // NULL = system skill, has value = company specific
        public Guid? CompanyId { get; set; }
        
        public string Name { get; set; } = string.Empty;
        public string? Category { get; set; } // Technical, Soft Skill, etc.
        public string? Description { get; set; }
        
        public bool IsSystem { get; set; } = false;
        public Guid? CreatedByUserId { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual Company? Company { get; set; }
        public virtual AppUser? CreatedByUser { get; set; }
        public virtual ICollection<UserSkill> UserSkills { get; set; } = new List<UserSkill>();
        public virtual ICollection<TrainerSkill> TrainerSkills { get; set; } = new List<TrainerSkill>();
    }
}
