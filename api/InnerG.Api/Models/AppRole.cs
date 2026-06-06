using System;
using Microsoft.AspNetCore.Identity;

namespace InnerG.Api.Models
{
    public class AppRole : IdentityRole<Guid>
    {
        public string? Description { get; set; }

        public AppRole() : base() { }
        public AppRole(string roleName) : base(roleName) { }
    }
}
