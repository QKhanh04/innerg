using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/schedule")]
    [Authorize]
    public class ScheduleController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ScheduleController(AppDbContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<IActionResult> GetPersonalScheduleAsync([FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            var userIdValue = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userIdValue) || !Guid.TryParse(userIdValue, out var userId))
                return Unauthorized();

            var companyIdValue = User.FindFirstValue("company_id") ?? User.FindFirstValue("CompanyId");
            if (string.IsNullOrEmpty(companyIdValue) || !Guid.TryParse(companyIdValue, out var companyId))
                return BadRequest("Company context is required.");

            // Default range: current week (Mon-Fri) if not provided
            var start = startDate ?? DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek + 1);
            var end = endDate ?? start.AddDays(7);

            // 1. Fetch Training Sessions where current user is the Trainer (Mentor role)
            var teachingSessions = await _context.TrainingSessions
                .IgnoreQueryFilters() // Respect multi-tenancy manually with companyId
                .Where(s => s.CompanyId == companyId)
                .Where(s => s.StartTime >= start && s.StartTime <= end)
                .Where(s => s.TrainingEvent.Trainer.UserId == userId)
                .Select(s => new CalendarEventDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    Type = "TEACHING",
                    TrainerName = s.TrainingEvent.Trainer.FullName,
                    MeetingLink = s.MeetingLink,
                    Notes = s.Notes,
                    Location = s.MeetingRoom != null ? s.MeetingRoom.Name : "Online",
                    IsOnline = string.IsNullOrEmpty(s.MeetingLink) ? false : true
                })
                .ToListAsync();

            // 2. Fetch Training Sessions where current user is enrolled (Mentee role)
            var enrolledSessions = await _context.TrainingSessions
                .IgnoreQueryFilters()
                .Where(s => s.CompanyId == companyId)
                .Where(s => s.StartTime >= start && s.StartTime <= end)
                .Where(s => s.TrainingEvent.Enrollments.Any(e => e.UserId == userId && e.Status == EnrollmentStatus.Confirmed))
                .Select(s => new CalendarEventDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    StartTime = s.StartTime,
                    EndTime = s.EndTime,
                    Type = s.StartTime < DateTime.UtcNow ? "COMPLETED" : "UPCOMING",
                    TrainerName = s.TrainingEvent.Trainer.FullName,
                    MeetingLink = s.MeetingLink,
                    Notes = s.Notes,
                    Location = s.MeetingRoom != null ? s.MeetingRoom.Name : "Online",
                    IsOnline = string.IsNullOrEmpty(s.MeetingLink) ? false : true
                })
                .ToListAsync();

            // Combine both lists
            var allEvents = new List<CalendarEventDto>();
            allEvents.AddRange(teachingSessions);
            
            // Add enrolled sessions, ensuring no duplicates (if user is both teaching and attending - rare, but safe)
            foreach (var s in enrolledSessions)
            {
                if (!allEvents.Any(e => e.Id == s.Id))
                {
                    allEvents.Add(s);
                }
            }

            // 3. Google Calendar Real Integration / Fetch
            var integration = await _context.UserIntegrations
                .FirstOrDefaultAsync(ui => ui.UserId == userId && ui.Provider == IntegrationProvider.GoogleCalendar && ui.IsActive);

            Console.WriteLine($"[Google Calendar] Fetch triggered for User: {userId}. Integration found: {integration != null}, Active: {integration?.IsActive}");

            if (integration != null && !string.IsNullOrEmpty(integration.AccessTokenEncrypted))
            {
                try
                {
                    using var httpClient = new System.Net.Http.HttpClient();
                    httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", integration.AccessTokenEncrypted);

                    var timeMin = Uri.EscapeDataString(start.ToString("o"));
                    var timeMax = Uri.EscapeDataString(end.ToString("o"));

                    // Fetch the list of all calendars (primary and secondary)
                    var listUrl = "https://www.googleapis.com/calendar/v3/users/me/calendarList";
                    Console.WriteLine($"[Google Calendar] Fetching calendar list from: {listUrl}");
                    
                    var listResponse = await httpClient.GetAsync(listUrl);
                    var calendarIds = new List<string> { "primary" }; // Default fallback to primary

                    if (listResponse.IsSuccessStatusCode)
                    {
                        var listContent = await listResponse.Content.ReadAsStringAsync();
                        var calendarList = System.Text.Json.JsonSerializer.Deserialize<GoogleCalendarListResponse>(listContent, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        
                        if (calendarList?.Items != null && calendarList.Items.Count > 0)
                        {
                            calendarIds.Clear();
                            foreach (var cal in calendarList.Items)
                            {
                                // We include selected calendars (those checked in the Google Calendar sidebar)
                                if (cal.Selected != false) 
                                {
                                    calendarIds.Add(cal.Id);
                                    Console.WriteLine($"[Google Calendar] Found active calendar: {cal.Summary} ({cal.Id})");
                                }
                            }
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[Google Calendar] Failed to fetch calendar list (Status: {listResponse.StatusCode}). Falling back to primary calendar.");
                    }

                    // Query events for each identified calendar
                    foreach (var calendarId in calendarIds)
                    {
                        var url = $"https://www.googleapis.com/calendar/v3/calendars/{Uri.EscapeDataString(calendarId)}/events?timeMin={timeMin}&timeMax={timeMax}&singleEvents=true";
                        Console.WriteLine($"[Google Calendar] Querying calendar: {calendarId} -> URL: {url}");

                        var response = await httpClient.GetAsync(url);
                        if (response.IsSuccessStatusCode)
                        {
                            var content = await response.Content.ReadAsStringAsync();
                            var googleData = System.Text.Json.JsonSerializer.Deserialize<GoogleCalendarResponse>(content, new System.Text.Json.JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                            if (googleData?.Items != null)
                            {
                                Console.WriteLine($"[Google Calendar] Successfully fetched {googleData.Items.Count} items from calendar: {calendarId}");
                                foreach (var item in googleData.Items)
                                {
                                    DateTime startEvent = item.Start.DateTime ?? item.Start.Date ?? DateTime.UtcNow;
                                    DateTime endEvent = item.End.DateTime ?? item.End.Date ?? startEvent.AddHours(1);

                                    Console.WriteLine($"[Google Calendar] Event: {item.Summary} at {startEvent:yyyy-MM-dd HH:mm:ss}");

                                    allEvents.Add(new CalendarEventDto
                                    {
                                        Id = Guid.NewGuid(),
                                        Title = item.Summary ?? "Google Event",
                                        StartTime = startEvent,
                                        EndTime = endEvent,
                                        Type = "EXTERNAL",
                                        TrainerName = "Google Calendar Sync",
                                        Notes = item.Description ?? "Synced from your Google Calendar.",
                                        Location = item.Location ?? "Google Meet",
                                        IsOnline = !string.IsNullOrEmpty(item.HangoutLink) || (item.Location != null && item.Location.Contains("meet.google.com"))
                                    });
                                }
                            }
                        }
                        else
                        {
                            var errContent = await response.Content.ReadAsStringAsync();
                            Console.WriteLine($"[Google Calendar] Error fetching events for {calendarId}: {errContent}");
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Google Calendar] Exception fetching events: {ex.Message}");
                }
            }

            // 4. DYNAMIC CONFLICT CALCULATIONS (Overlap Detection Algorithm)
            // Query lists and mark overlapping events as conflicted dynamically!
            var sortedEvents = allEvents.OrderBy(e => e.StartTime).ToList();
            for (int i = 0; i < sortedEvents.Count; i++)
            {
                for (int j = i + 1; j < sortedEvents.Count; j++)
                {
                    var eventA = sortedEvents[i];
                    var eventB = sortedEvents[j];

                    // Check if time slots overlap
                    if (eventA.StartTime < eventB.EndTime && eventB.StartTime < eventA.EndTime)
                    {
                        eventA.HasConflict = true;
                        eventA.ConflictMessage = $"Overlaps with '{eventB.Title}'";
                        eventB.HasConflict = true;
                        eventB.ConflictMessage = $"Overlaps with '{eventA.Title}'";
                    }
                }
            }

            return Ok(sortedEvents);
        }

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
}
