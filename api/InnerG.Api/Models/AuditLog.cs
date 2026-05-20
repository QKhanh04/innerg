using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public class AuditLog : TenantEntity
    {
        public Guid UserId { get; set; }
        public string EntityType { get; set; } = string.Empty;
        public Guid? EntityId { get; set; }
        public string Action { get; set; } = string.Empty; // Create, Update, Delete
        
        [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
        public string? OldValueJson { get; set; } // JSON
        [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
        public string? NewValueJson { get; set; } // JSON
        
        public string? IpAddress { get; set; }
        public string? UserAgent { get; set; }

        // Navigation properties
        public virtual AppUser User { get; set; } = null!;
    }
}
