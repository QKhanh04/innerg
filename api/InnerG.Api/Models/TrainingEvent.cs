using System;
using System.Collections.Generic;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum TrainingEventType
    {
        Course,
        Workshop,
        Seminar,
        SharingSession
    }

    public enum TrainingEventStatus
    {
        Draft,
        PendingApproval,
        Published,
        Cancelled,
        Completed
    }

    public class TrainingEvent : TenantEntity
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public TrainingEventType Type { get; set; }
        public TrainingEventStatus Status { get; set; } = TrainingEventStatus.Draft;
        
        public Guid SkillId { get; set; }
        public Guid TrainerId { get; set; }
        
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        
        public int? MaxParticipants { get; set; }
        public bool IsExternal { get; set; } = false; // Internal mentor vs External trainer
        public string? CoverImageUrl { get; set; }
        
        public int RewardPoints { get; set; } = 0;
        public string? RecurrenceRule { get; set; } // RRULE string

        // Navigation properties
        public virtual Skill Skill { get; set; } = null!;
        public virtual Trainer Trainer { get; set; } = null!;
        public virtual ICollection<TrainingSession> Sessions { get; set; } = new List<TrainingSession>();
        public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
        public virtual ICollection<TrainingEventTargetDepartment> TargetDepartments { get; set; } = new List<TrainingEventTargetDepartment>();
    }
}
