using System;
using System.Collections.Generic;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum CriteriaAppliesTo { Trainer, Learner, Both }

    public class FeedbackCriteria : BaseEntity
    {
        public Guid? CompanyId { get; set; } // NULL = system
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        
        public CriteriaAppliesTo AppliesTo { get; set; }
        public bool IsSystem { get; set; } = false;
        public int DisplayOrder { get; set; }
        public Guid? CreatedByUserId { get; set; }
        public bool IsActive { get; set; } = true;

        public virtual Company? Company { get; set; }
        public virtual AppUser? CreatedByUser { get; set; }
    }

    public class FeedbackResponse : BaseEntity
    {
        public Guid FeedbackId { get; set; }
        public Guid CriteriaId { get; set; }
        public int Score { get; set; }

        public virtual Feedback Feedback { get; set; } = null!;
        public virtual FeedbackCriteria Criteria { get; set; } = null!;
    }
}
