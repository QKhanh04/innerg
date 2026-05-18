using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum WishlistStatus
    {
        Open,
        Scheduled, // Converted to TrainingEvent
        Rejected
    }

    public class LearningWishlist : TenantEntity
    {
        public Guid UserId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        
        public Guid? SkillId { get; set; } // Optional: link to existing skill
        public WishlistStatus Status { get; set; } = WishlistStatus.Open;
        
        public int VoteCount { get; set; } = 0;

        // Navigation properties
        public virtual AppUser User { get; set; } = null!;
        public virtual Skill? Skill { get; set; }
    }
}
