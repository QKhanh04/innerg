using System;
using System.Collections.Generic;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public class Company : BaseEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Domain { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string Timezone { get; set; } = "Asia/Ho_Chi_Minh";
        public string Language { get; set; } = "vi";
        public bool IsActive { get; set; } = true;

        [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
        public string? BusinessSettingsJson { get; set; }

        // Navigation properties
        public virtual ICollection<AppUser> Users { get; set; } = new List<AppUser>();
        public virtual ICollection<Invite> Invites { get; set; } = new List<Invite>();
    }
}
