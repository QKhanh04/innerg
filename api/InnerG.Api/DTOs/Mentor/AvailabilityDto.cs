using System.Collections.Generic;

namespace InnerG.Api.DTOs.Mentor
{
    public class TimeSlotDto
    {
        public string StartTime { get; set; } = string.Empty; // e.g. "09:00"
        public string EndTime { get; set; } = string.Empty;   // e.g. "11:00"
    }

    public class DayAvailabilityDto
    {
        public string DayOfWeek { get; set; } = string.Empty; // e.g. "Monday"
        public bool IsAvailable { get; set; }
        public List<TimeSlotDto> TimeSlots { get; set; } = new List<TimeSlotDto>();
    }

    public class AvailabilityUpdateRequest
    {
        public List<DayAvailabilityDto> WeeklySchedule { get; set; } = new List<DayAvailabilityDto>();
    }
}
