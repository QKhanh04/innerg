using System;
using System.Collections.Generic;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum TrainerType
    {
        Internal,
        External
    }

    public class Trainer : TenantEntity
    {
        public Guid? UserId { get; set; } // NULL for External
        public TrainerType TrainerType { get; set; }
        
        public string FullName { get; set; } = string.Empty;
        public string? Email { get; set; }
        public string? Phone { get; set; }
        public string? OrganizationName { get; set; } // For External Experts
        
        public string? Bio { get; set; }
        public string? ExpertiseDescription { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual AppUser? User { get; set; }
        public virtual ICollection<TrainerSkill> TrainerSkills { get; set; } = new List<TrainerSkill>();
    }
}
