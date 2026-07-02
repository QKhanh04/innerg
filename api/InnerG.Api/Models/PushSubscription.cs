using System;
using InnerG.Api.Common.Interfaces;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public class PushSubscription : BaseEntity, IMultiTenant
    {
        public Guid UserId { get; set; }
        public string Endpoint { get; set; } = string.Empty;
        public string P256dh { get; set; } = string.Empty;
        public string Auth { get; set; } = string.Empty;
        public string UserAgent { get; set; } = string.Empty;
        public DateTime LastUsedAt { get; set; } = DateTime.UtcNow;
        public Guid CompanyId { get; set; }

        public virtual AppUser User { get; set; } = null!;
    }
}