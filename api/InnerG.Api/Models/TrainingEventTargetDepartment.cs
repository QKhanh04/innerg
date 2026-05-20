using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public class TrainingEventTargetDepartment : BaseEntity
    {
        public Guid TrainingEventId { get; set; }
        public Guid DepartmentId { get; set; }

        // Navigation properties
        public virtual TrainingEvent TrainingEvent { get; set; } = null!;
        public virtual Department Department { get; set; } = null!;
    }
}
