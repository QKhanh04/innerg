using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public class UserSession : BaseEntity
    {
        public Guid UserId { get; set; }
        public string TokenHash { get; set; } = string.Empty;
        public string? DeviceInfo { get; set; }
        public string? IpAddress { get; set; }
        public bool IsActive { get; set; } = true;
        public DateTime ExpiresAt { get; set; }
        public DateTime? RevokedAt { get; set; }

        // Navigation properties
        public virtual AppUser User { get; set; } = null!;
    }
}
