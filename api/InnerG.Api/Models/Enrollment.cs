using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum EnrollmentStatus
    {
        Pending,
        Confirmed,
        Rejected,
        Cancelled,
        Waitlisted,
        Completed
    }

    public class Enrollment : TenantEntity
    {
        public Guid TrainingEventId { get; set; }
        public Guid UserId { get; set; }
        
        public EnrollmentStatus Status { get; set; } = EnrollmentStatus.Pending;
        public DateTime EnrollmentDate { get; set; }
        public string? CancellationReason { get; set; }
        
        public int EarnedPoints { get; set; } = 0;
        public bool FeedbackSubmitted { get; set; } = false;

        // Navigation properties
        public virtual TrainingEvent TrainingEvent { get; set; } = null!;
        public virtual AppUser User { get; set; } = null!;
    }
}
