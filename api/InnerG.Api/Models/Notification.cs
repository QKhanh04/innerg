using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum NotificationChannel { Push, Email, Both }

    public class Notification : BaseEntity
    {
        public Guid UserId { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        
        public string? ReferenceType { get; set; }
        public Guid? ReferenceId { get; set; }
        
        public NotificationChannel Channel { get; set; }
        public bool IsRead { get; set; } = false;
        public DateTime? SentAt { get; set; }

        public virtual AppUser User { get; set; } = null!;
    }

    public class NotificationPreference : BaseEntity
    {
        public Guid UserId { get; set; }
        public string NotificationType { get; set; } = string.Empty;
        
        public bool ChannelPush { get; set; } = true;
        public bool ChannelEmail { get; set; } = true;
        public bool IsEnabled { get; set; } = true;

        public virtual AppUser User { get; set; } = null!;
    }
}
