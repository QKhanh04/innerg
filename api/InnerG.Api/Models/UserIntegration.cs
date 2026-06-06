using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum IntegrationProvider
    {
        GoogleCalendar,
        OutlookCalendar
    }

    public class UserIntegration : BaseEntity
    {
        public Guid UserId { get; set; }
        public IntegrationProvider Provider { get; set; }
        
        public string AccessTokenEncrypted { get; set; } = string.Empty;
        public string RefreshTokenEncrypted { get; set; } = string.Empty;
        public DateTime TokenExpiresAt { get; set; }
        
        public string? CalendarId { get; set; }
        public string? Scope { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime? LastSyncedAt { get; set; }

        public virtual AppUser User { get; set; } = null!;
    }
}
