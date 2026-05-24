using System;
using System.Collections.Generic;
using Microsoft.AspNetCore.Identity;
using InnerG.Api.Common.Interfaces;

namespace InnerG.Api.Models
{
    public class AppUser : IdentityUser<Guid>, IMultiTenant, IAuditable, ISoftDelete
    {
        public Guid CompanyId { get; set; }
        public Guid? DepartmentId { get; set; }
        
        public string FullName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string? JobTitle { get; set; }
        public string? PhoneInternal { get; set; }
        
        // SSO fields
        public string? SsoProvider { get; set; } // Google, Microsoft
        public string? SsoUid { get; set; }
        
        // Gamification cache
        public int TotalInnerGPoints { get; set; }
        
        public string? TwoFactorSecret { get; set; } // Encrypted TOTP secret

        public bool IsActive { get; set; } = true;
        public DateTime? LastLoginAt { get; set; }

        // Audit & Soft Delete
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }

        // Navigation properties
        public virtual Company Company { get; set; } = null!;
        public virtual Department? Department { get; set; }
        public virtual ICollection<UserSession> Sessions { get; set; } = new List<UserSession>();
        public virtual ICollection<UserSkill> UserSkills { get; set; } = new List<UserSkill>();
        public virtual ICollection<SkillAssessment> AssessmentsReceived { get; set; } = new List<SkillAssessment>();
        public virtual ICollection<SkillAssessment> AssessmentsGiven { get; set; } = new List<SkillAssessment>();
        public virtual ICollection<Trainer> TrainerProfiles { get; set; } = new List<Trainer>();
        public virtual ICollection<Enrollment> Enrollments { get; set; } = new List<Enrollment>();
        public virtual ICollection<SessionAttendance> Attendances { get; set; } = new List<SessionAttendance>();
        public virtual ICollection<UserReward> Redemptions { get; set; } = new List<UserReward>();
        public virtual ICollection<LearningWishlist> Wishlists { get; set; } = new List<LearningWishlist>();
        public virtual ICollection<Feedback> Feedbacks { get; set; } = new List<Feedback>();
        public virtual ICollection<AuditLog> AuditLogs { get; set; } = new List<AuditLog>();
        public virtual ICollection<UserIntegration> Integrations { get; set; } = new List<UserIntegration>();
        public virtual ICollection<InnerGPointsLedger> PointsLedger { get; set; } = new List<InnerGPointsLedger>();
        public virtual ICollection<UserBadge> Badges { get; set; } = new List<UserBadge>();
        public virtual ICollection<Notification> Notifications { get; set; } = new List<Notification>();
        public virtual ICollection<NotificationPreference> NotificationPreferences { get; set; } = new List<NotificationPreference>();
        public virtual ICollection<Invite> SentInvites { get; set; } = new List<Invite>();
    }
}
