using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public class ResourceDepartmentAccess : BaseEntity
    {
        public Guid ResourceId { get; set; }
        public Guid DepartmentId { get; set; }

        public virtual Resource Resource { get; set; } = null!;
        public virtual Department Department { get; set; } = null!;
    }
}
