using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum InvitationStatus { Pending, Accepted, Declined, Cancelled }

    public class TrainerInvitation : TenantEntity
    {
        public Guid TrainingEventId { get; set; }
        
        public Guid? InvitedUserId { get; set; } // Internal
        public Guid? InvitedTrainerId { get; set; } // External
        
        public Guid InvitedByUserId { get; set; }
        public InvitationStatus Status { get; set; } = InvitationStatus.Pending;
        public string? Message { get; set; }
        public string? DeclineReason { get; set; }
        public DateTime? RespondedAt { get; set; }

        public virtual TrainingEvent TrainingEvent { get; set; } = null!;
        public virtual AppUser? InvitedUser { get; set; }
        public virtual Trainer? InvitedTrainer { get; set; }
        public virtual AppUser Inviter { get; set; } = null!;
    }
}
