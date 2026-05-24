using System;
using System.Collections.Generic;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public class Department : TenantEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Code { get; set; }
        
        public Guid? ParentDepartmentId { get; set; }
        public Guid? ManagerUserId { get; set; }

        // Navigation properties
        public virtual Department? ParentDepartment { get; set; }
        public virtual ICollection<Department> SubDepartments { get; set; } = new List<Department>();
        public virtual AppUser? Manager { get; set; }
        public virtual ICollection<AppUser> Users { get; set; } = new List<AppUser>();
        public virtual ICollection<Invite> Invites { get; set; } = new List<Invite>();
    }
}
