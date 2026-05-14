using System;
using System.Collections.Generic;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public class MeetingRoom : TenantEntity
    {
        public string Name { get; set; } = string.Empty;
        public string Location { get; set; } = string.Empty; // Building, Floor, etc.
        public int Capacity { get; set; }
        public string? Facilities { get; set; } // Projector, Whiteboard, etc.
        public string? Notes { get; set; }
        public bool IsActive { get; set; } = true;

        // Navigation properties
        public virtual ICollection<TrainingSession> Sessions { get; set; } = new List<TrainingSession>();
    }
}
