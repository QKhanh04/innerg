using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public class AuditLog : TenantEntity
    {
        public Guid UserId { get; set; }
        public string EntityName { get; set; } = string.Empty;
        public string EntityId { get; set; } = string.Empty;
        public string Action { get; set; } = string.Empty; // Create, Update, Delete
        
        public string? OldValues { get; set; } // JSON
        public string? NewValues { get; set; } // JSON
        
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }

        // Navigation properties
        public virtual AppUser User { get; set; } = null!;
    }
}
