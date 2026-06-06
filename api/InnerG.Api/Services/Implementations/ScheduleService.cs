using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using InnerG.Api.DTOs;
using InnerG.Api.Models;
using InnerG.Api.Repositories.Interfaces;
using InnerG.Api.Services.Interfaces;

namespace InnerG.Api.Services.Implementations
{
    public class ScheduleService : IScheduleService
    {
        private readonly IUnitOfWork _unitOfWork;

        public ScheduleService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<List<CalendarEventDto>> GetPersonalScheduleAsync(Guid companyId, Guid userId, DateTime? startDate, DateTime? endDate)
        {
            // Default range: current week (Mon-Fri) if not provided
            var start = startDate ?? DateTime.UtcNow.Date.AddDays(-(int)DateTime.UtcNow.DayOfWeek + 1);
            var end = endDate ?? start.AddDays(7);

            // 1. Fetch Training Sessions where current user is the Trainer (Mentor role)
            var teachingSessions = await _unitOfWork.Repository<TrainingSession>().GetQueryable()
                .IgnoreQueryFilters()
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
                    IsOnline = !string.IsNullOrEmpty(s.MeetingLink)
                })
                .ToListAsync();

            // 2. Fetch Training Sessions where current user is enrolled (Mentee role)
            var enrolledSessions = await _unitOfWork.Repository<TrainingSession>().GetQueryable()
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
                    IsOnline = !string.IsNullOrEmpty(s.MeetingLink)
                })
                .ToListAsync();

            // Combine both lists
            var allEvents = new List<CalendarEventDto>();
            allEvents.AddRange(teachingSessions);
            
            // Add enrolled sessions, ensuring no duplicates (if user is both teaching and attending)
            foreach (var s in enrolledSessions)
            {
                if (!allEvents.Any(e => e.Id == s.Id))
                {
                    allEvents.Add(s);
                }
            }

            // 3. Google Calendar Real Integration / Fetch
            var integration = await _unitOfWork.Repository<UserIntegration>().GetQueryable()
                .FirstOrDefaultAsync(ui => ui.UserId == userId && ui.Provider == IntegrationProvider.GoogleCalendar && ui.IsActive);

            Console.WriteLine($"[Google Calendar] Fetch triggered for User: {userId}. Integration found: {integration != null}, Active: {integration?.IsActive}");

            if (integration != null && !string.IsNullOrEmpty(integration.AccessTokenEncrypted))
            {
                try
                {
                    using var httpClient = new HttpClient();
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
                        var calendarList = JsonSerializer.Deserialize<GoogleCalendarListResponse>(listContent, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                        
                        if (calendarList?.Items != null && calendarList.Items.Count > 0)
                        {
                            calendarIds.Clear();
                            foreach (var cal in calendarList.Items)
                            {
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
                            var googleData = JsonSerializer.Deserialize<GoogleCalendarResponse>(content, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

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
            var sortedEvents = allEvents.OrderBy(e => e.StartTime).ToList();
            for (int i = 0; i < sortedEvents.Count; i++)
            {
                for (int j = i + 1; j < sortedEvents.Count; j++)
                {
                    var eventA = sortedEvents[i];
                    var eventB = sortedEvents[j];

                    if (eventA.StartTime < eventB.EndTime && eventB.StartTime < eventA.EndTime)
                    {
                        eventA.HasConflict = true;
                        eventA.ConflictMessage = $"Overlaps with '{eventB.Title}'";
                        eventB.HasConflict = true;
                        eventB.ConflictMessage = $"Overlaps with '{eventA.Title}'";
                    }
                }
            }

            return sortedEvents;
        }
    }
}
