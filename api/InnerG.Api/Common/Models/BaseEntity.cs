using System;
using InnerG.Api.Common.Interfaces;

namespace InnerG.Api.Common.Models
{
    public abstract class BaseEntity : IBaseEntity, IAuditable, ISoftDelete
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DeletedAt { get; set; }
    }

    public abstract class TenantEntity : BaseEntity, IMultiTenant
    {
        public Guid CompanyId { get; set; }
    }
}
