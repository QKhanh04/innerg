using System;
using System.Collections.Generic;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public class MeetingRoom : TenantEntity
    {
        public string Name { get; set; } = string.Empty;
        public string? Location { get; set; } // Building, Floor, etc.
        public int Capacity { get; set; }
        
        [System.ComponentModel.DataAnnotations.Schema.Column(TypeName = "jsonb")]
        public string? FacilitiesJson { get; set; } // ["projector","whiteboard","ac"]
        
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual ICollection<TrainingSession> Sessions { get; set; } = new List<TrainingSession>();
    }
}
