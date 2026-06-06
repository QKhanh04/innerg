using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum WishlistStatus
    {
        Pending,
        FindingTrainer,
        Scheduled,
        Completed,
        Rejected,
        NeedsExternalExpert,
        ExternalProcessing,
        Deferred
    }

    public enum WishlistUrgency
    {
        Low,
        Medium,
        High
    }

    public class LearningWishlist : TenantEntity
    {
        public Guid UserId { get; set; }
        
        public Guid? SkillId { get; set; } // Optional: link to existing skill
        public string? SkillNameCustom { get; set; }
        public string? Category { get; set; }
        public string? Description { get; set; }
        public string? Reason { get; set; }
        
        public WishlistUrgency Urgency { get; set; } = WishlistUrgency.Medium;
        public int VoteCount { get; set; } = 1;
        
        public WishlistStatus Status { get; set; } = WishlistStatus.Pending;
        
        public Guid? AssignedTrainerId { get; set; }
        public Guid? ResultingTrainingEventId { get; set; }
        
        public string? RejectionReason { get; set; }
        public Guid? ReviewedByUserId { get; set; }
        public DateTime? ReviewedAt { get; set; }

        // Navigation properties
        public virtual AppUser User { get; set; } = null!;
        public virtual Skill? Skill { get; set; }
    }
}
