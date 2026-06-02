using System;
using System.Collections.Generic;

namespace InnerG.Api.DTOs
{
    public class CalendarEventDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public DateTime EndTime { get; set; }
        public string Type { get; set; } = "UPCOMING"; // TEACHING, UPCOMING, COMPLETED, EXTERNAL
        public string TrainerName { get; set; } = string.Empty;
        public string? MeetingLink { get; set; }
        public string? Notes { get; set; }
        public string Location { get; set; } = "Online";
        public bool IsOnline { get; set; }
        public bool HasConflict { get; set; }
        public string? ConflictMessage { get; set; }
    }

    public class GoogleCalendarResponse
    {
        public List<GoogleCalendarItem>? Items { get; set; }
    }

    public class GoogleCalendarItem
    {
        public string? Summary { get; set; }
        public string? Description { get; set; }
        public string? Location { get; set; }
        public string? HangoutLink { get; set; }
        public GoogleCalendarTime Start { get; set; } = null!;
        public GoogleCalendarTime End { get; set; } = null!;
    }

    public class GoogleCalendarTime
    {
        public DateTime? DateTime { get; set; }
        public DateTime? Date { get; set; }
    }

    public class GoogleCalendarListResponse
    {
        public List<GoogleCalendarListItem>? Items { get; set; }
    }

    public class GoogleCalendarListItem
    {
        public string Id { get; set; } = string.Empty;
        public string? Summary { get; set; }
        public bool? Selected { get; set; }
        public bool? Primary { get; set; }
    }
}
