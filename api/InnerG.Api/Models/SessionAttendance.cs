using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum AttendanceStatus
    {
        Present,
        Absent,
        Late,
        Excused
    }

    public class SessionAttendance : TenantEntity
    {
        public Guid TrainingSessionId { get; set; }
        public Guid UserId { get; set; }
        
        public AttendanceStatus Status { get; set; } = AttendanceStatus.Present;
        public DateTime? CheckInTime { get; set; }
        public string? Notes { get; set; }

        // Navigation properties
        public virtual TrainingSession TrainingSession { get; set; } = null!;
        public virtual AppUser User { get; set; } = null!;
    }
}
