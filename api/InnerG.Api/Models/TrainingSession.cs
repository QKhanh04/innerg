using System;
using System.Collections.Generic;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public class TrainingSession : TenantEntity
    {
        public Guid TrainingEventId { get; set; }
        public Guid? MeetingRoomId { get; set; }
        
        public string Title { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        
        public string? MeetingLink { get; set; } // For online/hybrid
        public string? Notes { get; set; }

        // Navigation properties
        public virtual TrainingEvent TrainingEvent { get; set; } = null!;
        public virtual MeetingRoom? MeetingRoom { get; set; }
        public virtual ICollection<SessionAttendance> Attendances { get; set; } = new List<SessionAttendance>();
    }
}
