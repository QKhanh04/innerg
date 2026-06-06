using System;
using System.Collections.Generic;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum ReviewerRole { Learner, Trainer }

    public class Feedback : BaseEntity
    {
        public Guid TrainingEventId { get; set; }
        public Guid TrainingSessionId { get; set; }
        public Guid ReviewerUserId { get; set; }
        
        public Guid? RevieweeUserId { get; set; } // If Learner or Internal Trainer
        public Guid? RevieweeTrainerId { get; set; } // If External Trainer
        
        public ReviewerRole ReviewerRole { get; set; }
        public int OverallRating { get; set; }
        public string? Comment { get; set; }
        public bool IsAnonymous { get; set; } = false;

        public virtual TrainingEvent TrainingEvent { get; set; } = null!;
        public virtual TrainingSession TrainingSession { get; set; } = null!;
        public virtual AppUser Reviewer { get; set; } = null!;
        public virtual AppUser? RevieweeUser { get; set; }
        public virtual Trainer? RevieweeTrainer { get; set; }
        public virtual ICollection<FeedbackResponse> Responses { get; set; } = new List<FeedbackResponse>();
    }
}
