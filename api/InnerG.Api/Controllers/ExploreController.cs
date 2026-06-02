using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InnerG.Api.Models;
using InnerG.Api.Data;
using InnerG.Api.DTOs;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/explore")]
    [Authorize]
    public class ExploreController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ExploreController(AppDbContext context)
        {
            _context = context;
        }

        private Guid GetCurrentUserId()
        {
            var id = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return string.IsNullOrEmpty(id) ? Guid.Empty : Guid.Parse(id);
        }

        private Guid GetCurrentCompanyId()
        {
            var companyIdValue = User.FindFirstValue("company_id") ?? User.FindFirstValue("CompanyId") ?? User.FindFirst("company_id")?.Value;
            return string.IsNullOrEmpty(companyIdValue) ? Guid.Empty : Guid.Parse(companyIdValue);
        }

        [HttpGet]
        public async Task<IActionResult> GetExploreClasses()
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing from token." });
                }

                // Load all published or completed training events in the user's company
                var trainingEvents = await _context.TrainingEvents
                    .IgnoreQueryFilters()
                    .Where(te => te.CompanyId == companyId && 
                                 (te.Status == TrainingEventStatus.Published || te.Status == TrainingEventStatus.Completed))
                    .Include(te => te.Skill)
                    .Include(te => te.Trainer)
                        .ThenInclude(tr => tr.User)
                    .Include(te => te.Enrollments)
                    .Include(te => te.Sessions)
                        .ThenInclude(s => s.MeetingRoom)
                    .OrderBy(te => te.StartDate)
                    .ToListAsync();

                var dtoList = new List<ExploreClassDto>();

                foreach (var te in trainingEvents)
                {
                    // Check enrollment status of the current user
                    var userEnrollment = te.Enrollments.FirstOrDefault(e => e.UserId == userId);
                    string regStatus = "NotRegistered";
                    if (userEnrollment != null)
                    {
                        regStatus = userEnrollment.Status == EnrollmentStatus.Confirmed ? "Registered" :
                                    userEnrollment.Status == EnrollmentStatus.Pending ? "Pending" : "NotRegistered";
                    }

                    // Format and FormatDetail resolution
                    var firstSession = te.Sessions.OrderBy(s => s.StartTime).FirstOrDefault();
                    string format = "Online";
                    string formatDetail = "Online Session";

                    if (firstSession != null)
                    {
                        if (firstSession.MeetingRoom != null)
                        {
                            format = "Offline";
                            formatDetail = firstSession.MeetingRoom.Name;
                        }
                        else if (!string.IsNullOrEmpty(firstSession.Notes) && firstSession.Notes.StartsWith("Physical Room: "))
                        {
                            format = "Offline";
                            formatDetail = firstSession.Notes.Replace("Physical Room: ", "");
                        }
                        else if (!string.IsNullOrEmpty(firstSession.MeetingLink))
                        {
                            format = "Online";
                            formatDetail = "Online Meeting";
                        }
                        else if (te.Sessions.Any(s => s.MeetingRoomId.HasValue))
                        {
                            format = "Offline";
                            formatDetail = "Physical Room";
                        }
                    }

                    // Skills associated
                    var skillsList = new List<string> { te.Skill?.Name ?? "General" };

                    // Date & Time
                    string dateStr = te.StartDate.ToString("MMM dd, yyyy", System.Globalization.CultureInfo.InvariantCulture);
                    string timeStr = te.StartDate.ToString("hh:mm tt", System.Globalization.CultureInfo.InvariantCulture);
                    double totalMins = (te.EndDate - te.StartDate).TotalMinutes;
                    string durationStr = totalMins > 1440 ? $"{(te.EndDate - te.StartDate).TotalDays:0} days" : $"{totalMins:0} mins";

                    // Trainer Position
                    string trainerPos = te.IsExternal ? "External Expert" : "Lead Mentor";

                    // Category normalization to prevent "Soft Skill" vs "Soft Skills" duplicates
                    string rawCategory = te.Skill?.Category ?? "General";
                    string normalizedCategory = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(rawCategory.Trim().ToLower());
                    if (normalizedCategory == "Soft Skill" || normalizedCategory == "Soft Skills")
                    {
                        normalizedCategory = "Soft Skills";
                    }

                    dtoList.Add(new ExploreClassDto
                    {
                        Id = te.Id,
                        Title = te.Title,
                        Description = te.Description ?? string.Empty,
                        Category = normalizedCategory,
                        Level = "Intermediate", // Default level, or parsed from title/skill
                        Format = format,
                        FormatDetail = formatDetail,
                        Mentor = new ExploreMentorDto
                        {
                            UserId = te.Trainer?.UserId ?? Guid.Empty,
                            Name = te.Trainer?.FullName ?? "Unknown Mentor",
                            Avatar = te.Trainer?.User?.AvatarUrl ?? $"https://api.dicebear.com/7.x/adventurer/svg?seed={te.Trainer?.FullName ?? "Mentor"}",
                            Rating = "4.9",
                            Position = trainerPos
                        },
                        Skills = skillsList,
                        Date = dateStr,
                        Time = timeStr,
                        Duration = durationStr,
                        TotalSlots = te.MaxParticipants ?? 20,
                        TakenSlots = te.Enrollments.Count(e => e.Status == EnrollmentStatus.Confirmed),
                        Points = te.RewardPoints,
                        Image = te.CoverImageUrl ?? "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400&auto=format&fit=crop",
                        RegistrationStatus = regStatus
                    });
                }

                return Ok(dtoList);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{eventId}/register")]
        public async Task<IActionResult> RegisterClass(Guid eventId)
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing from token." });
                }

                // Check if class exists
                var te = await _context.TrainingEvents
                    .IgnoreQueryFilters()
                    .Include(t => t.Enrollments)
                    .Include(t => t.Trainer)
                    .FirstOrDefaultAsync(t => t.Id == eventId && t.CompanyId == companyId);

                if (te == null)
                {
                    return NotFound(new { message = "Class not found." });
                }

                // Prevent instructor registering for their own class
                if (te.Trainer != null && te.Trainer.UserId == userId)
                {
                    return BadRequest(new { message = "You cannot register for a class that you are teaching." });
                }

                // Check existing enrollment
                var existing = te.Enrollments.FirstOrDefault(e => e.UserId == userId);
                if (existing != null)
                {
                    if (existing.Status == EnrollmentStatus.Confirmed || existing.Status == EnrollmentStatus.Pending)
                    {
                        return BadRequest(new { message = "You are already registered or pending registration for this class." });
                    }
                    
                    // Reactivate cancelled/rejected enrollment
                    existing.Status = EnrollmentStatus.Pending;
                    existing.EnrollmentDate = DateTime.UtcNow;
                    _context.Enrollments.Update(existing);
                }
                else
                {
                    // Create new pending enrollment
                    var enrollment = new Enrollment
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = companyId,
                        UserId = userId,
                        TrainingEventId = eventId,
                        Status = EnrollmentStatus.Pending,
                        EnrollmentDate = DateTime.UtcNow
                    };
                    await _context.Enrollments.AddAsync(enrollment);
                }

                await _context.SaveChangesAsync();
                return Ok(new { message = "Registration request sent successfully. Pending approval by Mentor! ⌛" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("{eventId}/unregister")]
        public async Task<IActionResult> UnregisterClass(Guid eventId)
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing from token." });
                }

                var enrollment = await _context.Enrollments
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(e => e.TrainingEventId == eventId && e.UserId == userId && e.CompanyId == companyId);

                if (enrollment == null)
                {
                    return NotFound(new { message = "Enrollment not found." });
                }

                _context.Enrollments.Remove(enrollment);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Successfully cancelled registration." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("{eventId}")]
        public async Task<IActionResult> GetExploreClassDetail(Guid eventId)
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing from token." });
                }

                var te = await _context.TrainingEvents
                    .IgnoreQueryFilters()
                    .Where(t => t.Id == eventId && t.CompanyId == companyId)
                    .Include(t => t.Skill)
                    .Include(t => t.Trainer)
                        .ThenInclude(tr => tr.User)
                    .Include(t => t.Enrollments)
                    .Include(t => t.Sessions)
                        .ThenInclude(s => s.MeetingRoom)
                    .Include(t => t.Resources)
                    .FirstOrDefaultAsync();

                if (te == null)
                {
                    return NotFound(new { message = "Class not found." });
                }

                // Check enrollment status of the current user
                var userEnrollment = te.Enrollments.FirstOrDefault(e => e.UserId == userId);
                string regStatus = "NotRegistered";
                if (userEnrollment != null)
                {
                    regStatus = userEnrollment.Status == EnrollmentStatus.Confirmed ? "Registered" :
                                userEnrollment.Status == EnrollmentStatus.Pending ? "Pending" : "NotRegistered";
                }

                // Format and FormatDetail resolution based on the first session
                var firstSession = te.Sessions.OrderBy(s => s.StartTime).FirstOrDefault();
                string format = "Online";
                string formatDetail = "Online Session";

                if (firstSession != null)
                {
                    if (firstSession.MeetingRoom != null)
                    {
                        format = "Offline";
                        formatDetail = firstSession.MeetingRoom.Name;
                    }
                    else if (!string.IsNullOrEmpty(firstSession.Notes) && firstSession.Notes.StartsWith("Physical Room: "))
                    {
                        format = "Offline";
                        formatDetail = firstSession.Notes.Replace("Physical Room: ", "");
                    }
                    else if (!string.IsNullOrEmpty(firstSession.MeetingLink))
                    {
                        format = "Online";
                        formatDetail = "Online Meeting";
                    }
                    else if (te.Sessions.Any(s => s.MeetingRoomId.HasValue))
                    {
                        format = "Offline";
                        formatDetail = "Physical Room";
                    }
                }

                // Skills associated
                var skillsList = new List<string> { te.Skill?.Name ?? "General" };

                // Category normalization
                string rawCategory = te.Skill?.Category ?? "General";
                string normalizedCategory = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(rawCategory.Trim().ToLower());
                if (normalizedCategory == "Soft Skill" || normalizedCategory == "Soft Skills")
                {
                    normalizedCategory = "Soft Skills";
                }

                // Process Sessions
                var sessionDtos = te.Sessions.OrderBy(s => s.StartTime).Select(s => {
                    string sFormat = "Online";
                    string sLoc = s.MeetingLink ?? "TBA";
                    if (s.MeetingRoom != null) {
                        sFormat = "Offline";
                        sLoc = s.MeetingRoom.Name;
                    } else if (!string.IsNullOrEmpty(s.Notes) && s.Notes.StartsWith("Physical Room: ")) {
                        sFormat = "Offline";
                        sLoc = s.Notes.Replace("Physical Room: ", "");
                    }
                    
                    return new TrainingSessionDto {
                        Id = s.Id,
                        Title = s.Title,
                        StartTime = s.StartTime.ToString("hh:mm tt, MMM dd", System.Globalization.CultureInfo.InvariantCulture),
                        EndTime = s.EndTime.ToString("hh:mm tt", System.Globalization.CultureInfo.InvariantCulture),
                        Duration = (s.EndTime - s.StartTime).TotalMinutes > 1440 ? $"{(s.EndTime - s.StartTime).TotalDays:0} days" : $"{(s.EndTime - s.StartTime).TotalMinutes:0} mins",
                        Format = sFormat,
                        LocationOrLink = sLoc
                    };
                }).ToList();

                var detailDto = new ExploreClassDetailDto
                {
                    Id = te.Id,
                    Title = te.Title,
                    Description = te.Description ?? string.Empty,
                    Category = normalizedCategory,
                    Level = "Intermediate",
                    Format = format,
                    FormatDetail = formatDetail,
                    Mentor = new ExploreMentorDto
                    {
                        UserId = te.Trainer?.UserId ?? Guid.Empty,
                        Name = te.Trainer?.FullName ?? "Unknown Mentor",
                        Avatar = te.Trainer?.User?.AvatarUrl ?? $"https://api.dicebear.com/7.x/adventurer/svg?seed={te.Trainer?.FullName ?? "Mentor"}",
                        Rating = "4.9",
                        Position = te.IsExternal ? "External Expert" : "Lead Mentor"
                    },
                    Skills = skillsList,
                    Date = te.StartDate.ToString("MMM dd, yyyy", System.Globalization.CultureInfo.InvariantCulture),
                    Time = te.StartDate.ToString("hh:mm tt", System.Globalization.CultureInfo.InvariantCulture),
                    Duration = (te.EndDate - te.StartDate).TotalMinutes > 1440 ? $"{(te.EndDate - te.StartDate).TotalDays:0} days" : $"{(te.EndDate - te.StartDate).TotalMinutes:0} mins",
                    TotalSlots = te.MaxParticipants ?? 20,
                    TakenSlots = te.Enrollments.Count(e => e.Status == EnrollmentStatus.Confirmed),
                    Points = te.RewardPoints,
                    Image = te.CoverImageUrl ?? "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400&auto=format&fit=crop",
                    RegistrationStatus = regStatus,
                    EventStatus = te.Status.ToString(),
                    Sessions = sessionDtos,
                    Resources = te.Resources.Select(r => new ExploreResourceDto
                    {
                        Id = r.Id,
                        Title = r.Title,
                        Description = r.Description ?? string.Empty,
                        Type = r.Type.ToString(),
                        Url = r.Url ?? string.Empty,
                        FileType = r.FileType ?? string.Empty,
                        FileSizeBytes = r.FileSizeBytes
                    }).ToList()
                };

                return Ok(detailDto);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("mentee-dashboard")]
        public async Task<IActionResult> GetMenteeDashboard()
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing from token." });
                }

                // 1. Fetch current user points & details
                var user = await _context.Users
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(u => u.Id == userId && u.CompanyId == companyId);

                if (user == null)
                {
                    return NotFound(new { message = "User not found." });
                }

                // RPG points progression algorithm
                int points = user.TotalInnerGPoints;
                int level = 1;
                int pointsNeededForNext = 200;
                int currentLevelBase = 0;
                while (points >= currentLevelBase + pointsNeededForNext)
                {
                    currentLevelBase += pointsNeededForNext;
                    level++;
                    pointsNeededForNext += 100; // each level needs 100 more points
                }
                int progress = points - currentLevelBase;

                var pointsDto = new MenteePointsDto
                {
                    TotalPoints = points,
                    Level = level,
                    CurrentLevelProgress = progress,
                    NextLevelRequirement = pointsNeededForNext,
                    PointsNeededForNextLevel = pointsNeededForNext - progress
                };

                // 2. Fetch Hero/Next Up Workshop
                // First: Look for the soonest upcoming training session where the user is confirmed
                var now = DateTime.UtcNow;
                var nextSession = await _context.TrainingSessions
                    .IgnoreQueryFilters()
                    .Include(s => s.MeetingRoom)
                    .Include(s => s.TrainingEvent)
                        .ThenInclude(te => te.Trainer)
                            .ThenInclude(tr => tr.User)
                    .Include(s => s.TrainingEvent)
                        .ThenInclude(te => te.Skill)
                    .Where(s => s.CompanyId == companyId && s.StartTime >= now && 
                                s.TrainingEvent.Status == TrainingEventStatus.Published &&
                                s.TrainingEvent.Enrollments.Any(e => e.UserId == userId && e.Status == EnrollmentStatus.Confirmed))
                    .OrderBy(s => s.StartTime)
                    .FirstOrDefaultAsync();

                TrainingEvent? heroEvent = null;
                TrainingSession? heroSession = null;
                bool isEnrolled = false;
                string regStatus = "NotRegistered";

                if (nextSession != null)
                {
                    heroSession = nextSession;
                    heroEvent = nextSession.TrainingEvent;
                    isEnrolled = true;
                    regStatus = "Registered";
                }
                else
                {
                    // Fallback: Show the soonest upcoming published class in the company (can be enrolled or not)
                    var fallbackEvent = await _context.TrainingEvents
                        .IgnoreQueryFilters()
                        .Include(te => te.Trainer)
                            .ThenInclude(tr => tr.User)
                        .Include(te => te.Skill)
                        .Include(te => te.Sessions)
                            .ThenInclude(s => s.MeetingRoom)
                        .Include(te => te.Enrollments)
                        .Where(te => te.CompanyId == companyId && te.Status == TrainingEventStatus.Published && te.StartDate >= now)
                        .OrderBy(te => te.StartDate)
                        .FirstOrDefaultAsync();

                    if (fallbackEvent != null)
                    {
                        heroEvent = fallbackEvent;
                        heroSession = fallbackEvent.Sessions.OrderBy(s => s.StartTime).FirstOrDefault();
                        var userEnrollment = fallbackEvent.Enrollments.FirstOrDefault(e => e.UserId == userId);
                        if (userEnrollment != null)
                        {
                            regStatus = userEnrollment.Status == EnrollmentStatus.Confirmed ? "Registered" :
                                        userEnrollment.Status == EnrollmentStatus.Pending ? "Pending" : "NotRegistered";
                            isEnrolled = userEnrollment.Status == EnrollmentStatus.Confirmed;
                        }
                    }
                }

                MenteeDashboardHeroDto? heroDto = null;
                if (heroEvent != null)
                {
                    string countdownText = "Upcoming";
                    if (heroSession != null)
                    {
                        var timeDiff = heroSession.StartTime - now;
                        if (timeDiff.TotalHours > 0 && timeDiff.TotalHours <= 24)
                        {
                            countdownText = $"Live in {(int)timeDiff.TotalHours}h {timeDiff.Minutes}m";
                        }
                        else if (timeDiff.TotalDays >= 1)
                        {
                            countdownText = $"Starts in {(int)timeDiff.TotalDays} days";
                        }
                        else
                        {
                            countdownText = $"Starts on {heroSession.StartTime.ToString("MMM dd", System.Globalization.CultureInfo.InvariantCulture)}";
                        }
                    }

                    double totalMins = (heroEvent.EndDate - heroEvent.StartDate).TotalMinutes;
                    string durationStr = totalMins > 1440 ? $"{(heroEvent.EndDate - heroEvent.StartDate).TotalDays:0} days" : $"{totalMins:0} mins";

                    string formatLoc = "Online Session";
                    if (heroSession != null)
                    {
                        if (heroSession.MeetingRoom != null)
                        {
                            formatLoc = heroSession.MeetingRoom.Name;
                        }
                        else if (!string.IsNullOrEmpty(heroSession.Notes) && heroSession.Notes.StartsWith("Physical Room: "))
                        {
                            formatLoc = heroSession.Notes.Replace("Physical Room: ", "");
                        }
                        else if (!string.IsNullOrEmpty(heroSession.MeetingLink))
                        {
                            formatLoc = "Online Meeting";
                        }
                    }

                    var skillName = heroEvent.Skill?.Name ?? "General";
                    var category = heroEvent.Skill?.Category ?? "General";
                    
                    heroDto = new MenteeDashboardHeroDto
                    {
                        Id = heroEvent.Id,
                        Title = heroEvent.Title,
                        Instructor = heroEvent.Trainer?.FullName ?? "Unknown Mentor",
                        InstructorAvatar = heroEvent.Trainer?.User?.AvatarUrl ?? $"https://api.dicebear.com/7.x/adventurer/svg?seed={heroEvent.Trainer?.FullName ?? "Mentor"}",
                        InstructorRole = heroEvent.IsExternal ? "External Expert" : "Lead Mentor",
                        Rating = "4.9",
                        Location = formatLoc,
                        Joined = $"{heroEvent.Enrollments.Count(e => e.Status == EnrollmentStatus.Confirmed)}/{heroEvent.MaxParticipants ?? 20}",
                        Duration = durationStr,
                        Tags = new List<string> { category, skillName },
                        Description = heroEvent.Description ?? string.Empty,
                        Outcomes = new List<string>
                        {
                            "Develop foundational and advanced practical knowledge",
                            "Peer-to-peer networking with industry experts",
                            "Access to exclusive downloadable resources"
                        },
                        CountdownText = countdownText,
                        IsRegistered = isEnrolled,
                        RegistrationStatus = regStatus
                    };
                }

                // 3. Fetch recent Activities (last 5 recently uploaded resources in the company)
                var recentResources = await _context.Resources
                    .IgnoreQueryFilters()
                    .Include(r => r.TrainingEvent)
                    .Where(r => r.CompanyId == companyId && 
                                (r.TrainingEvent.Status == TrainingEventStatus.Published || r.TrainingEvent.Status == TrainingEventStatus.Completed))
                    .OrderByDescending(r => r.CreatedAt)
                    .Take(5)
                    .ToListAsync();

                var activities = new List<MenteeActivityDto>();
                foreach (var r in recentResources)
                {
                    string iconType = "book";
                    string rTypeLower = r.Type.ToString().ToLower();
                    if (rTypeLower.Contains("video")) iconType = "video";
                    else if (rTypeLower.Contains("link") || rTypeLower.Contains("repo") || rTypeLower.Contains("podcast")) iconType = "mic";

                    // Simple time ago calculation
                    var timeDiff = DateTime.UtcNow - r.CreatedAt;
                    string timeAgo = "Just now";
                    if (timeDiff.TotalDays >= 1)
                    {
                        timeAgo = $"{(int)timeDiff.TotalDays}d ago";
                    }
                    else if (timeDiff.TotalHours >= 1)
                    {
                        timeAgo = $"{(int)timeDiff.TotalHours}h ago";
                    }
                    else if (timeDiff.TotalMinutes >= 1)
                    {
                        timeAgo = $"{(int)timeDiff.TotalMinutes}m ago";
                    }

                    activities.Add(new MenteeActivityDto
                    {
                        Title = r.Title,
                        Type = $"Resource • {r.TrainingEvent.Title}",
                        TimeAgo = timeAgo,
                        IconType = iconType
                    });
                }

                // 4. Fetch Trending Skills
                // Group published/completed events in company by skill and take the top ones
                var topSkills = await _context.TrainingEvents
                    .IgnoreQueryFilters()
                    .Where(te => te.CompanyId == companyId && 
                                 (te.Status == TrainingEventStatus.Published || te.Status == TrainingEventStatus.Completed) &&
                                 te.Skill != null)
                    .GroupBy(te => te.Skill.Name)
                    .Select(g => new { SkillName = g.Key, Count = g.Count() })
                    .OrderByDescending(g => g.Count)
                    .Take(5)
                    .ToListAsync();

                var trendingSkills = new List<MenteeTrendingSkillDto>();
                foreach (var ts in topSkills)
                {
                    string heat = "normal";
                    if (ts.Count >= 5) heat = "hot";
                    else if (ts.Count >= 2) heat = "rising";

                    trendingSkills.Add(new MenteeTrendingSkillDto
                    {
                        Label = ts.SkillName,
                        Count = ts.Count * 7 + 11, // scale it slightly for cosmetic UI impact
                        Heat = heat
                    });
                }

                // Fallback trending tags if none in DB
                if (trendingSkills.Count == 0)
                {
                    trendingSkills.Add(new MenteeTrendingSkillDto { Label = "Gen AI", Count = 28, Heat = "hot" });
                    trendingSkills.Add(new MenteeTrendingSkillDto { Label = "React", Count = 21, Heat = "hot" });
                    trendingSkills.Add(new MenteeTrendingSkillDto { Label = "Zustand", Count = 14, Heat = "rising" });
                    trendingSkills.Add(new MenteeTrendingSkillDto { Label = "Motion", Count = 11, Heat = "normal" });
                }

                // 5. Fetch Recommendations
                // Up to 4 active classes in the company that the user is not registered in yet
                var enrolledEventIds = await _context.Enrollments
                    .IgnoreQueryFilters()
                    .Where(e => e.UserId == userId && (e.Status == EnrollmentStatus.Confirmed || e.Status == EnrollmentStatus.Pending))
                    .Select(e => e.TrainingEventId)
                    .ToListAsync();

                var recEvents = await _context.TrainingEvents
                    .IgnoreQueryFilters()
                    .Include(te => te.Skill)
                    .Include(te => te.Trainer)
                        .ThenInclude(tr => tr.User)
                    .Include(te => te.Enrollments)
                    .Include(te => te.Sessions)
                        .ThenInclude(s => s.MeetingRoom)
                    .Where(te => te.CompanyId == companyId && 
                                 te.Status == TrainingEventStatus.Published &&
                                 !enrolledEventIds.Contains(te.Id))
                    .OrderBy(te => te.StartDate)
                    .Take(4)
                    .ToListAsync();

                // If less than 4, include even completed ones or already enrolled ones to fill the 4 cards beautifully
                if (recEvents.Count < 4)
                {
                    var extraEvents = await _context.TrainingEvents
                        .IgnoreQueryFilters()
                        .Include(te => te.Skill)
                        .Include(te => te.Trainer)
                            .ThenInclude(tr => tr.User)
                        .Include(te => te.Enrollments)
                        .Include(te => te.Sessions)
                            .ThenInclude(s => s.MeetingRoom)
                        .Where(te => te.CompanyId == companyId && 
                                     (te.Status == TrainingEventStatus.Published || te.Status == TrainingEventStatus.Completed) &&
                                     !recEvents.Select(r => r.Id).Contains(te.Id))
                        .Take(4 - recEvents.Count)
                        .ToListAsync();
                    recEvents.AddRange(extraEvents);
                }

                var recommendations = new List<ExploreClassDto>();
                foreach (var te in recEvents)
                {
                    var userEnrollment = te.Enrollments.FirstOrDefault(e => e.UserId == userId);
                    string recRegStatus = "NotRegistered";
                    if (userEnrollment != null)
                    {
                        recRegStatus = userEnrollment.Status == EnrollmentStatus.Confirmed ? "Registered" :
                                       userEnrollment.Status == EnrollmentStatus.Pending ? "Pending" : "NotRegistered";
                    }

                    var firstSession = te.Sessions.OrderBy(s => s.StartTime).FirstOrDefault();
                    string format = "Online";
                    string formatDetail = "Online Session";

                    if (firstSession != null)
                    {
                        if (firstSession.MeetingRoom != null)
                        {
                            format = "Offline";
                            formatDetail = firstSession.MeetingRoom.Name;
                        }
                        else if (!string.IsNullOrEmpty(firstSession.Notes) && firstSession.Notes.StartsWith("Physical Room: "))
                        {
                            format = "Offline";
                            formatDetail = firstSession.Notes.Replace("Physical Room: ", "");
                        }
                    }

                    double totalMins = (te.EndDate - te.StartDate).TotalMinutes;
                    string durationStr = totalMins > 1440 ? $"{(te.EndDate - te.StartDate).TotalDays:0} days" : $"{totalMins:0} mins";

                    string rawCategory = te.Skill?.Category ?? "General";
                    string normalizedCategory = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(rawCategory.Trim().ToLower());
                    if (normalizedCategory == "Soft Skill" || normalizedCategory == "Soft Skills")
                    {
                        normalizedCategory = "Soft Skills";
                    }

                    recommendations.Add(new ExploreClassDto
                    {
                        Id = te.Id,
                        Title = te.Title,
                        Description = te.Description ?? string.Empty,
                        Category = normalizedCategory,
                        Level = "Intermediate",
                        Format = format,
                        FormatDetail = formatDetail,
                        Mentor = new ExploreMentorDto
                        {
                            UserId = te.Trainer?.UserId ?? Guid.Empty,
                            Name = te.Trainer?.FullName ?? "Unknown Mentor",
                            Avatar = te.Trainer?.User?.AvatarUrl ?? $"https://api.dicebear.com/7.x/adventurer/svg?seed={te.Trainer?.FullName ?? "Mentor"}",
                            Rating = "4.9",
                            Position = te.IsExternal ? "External Expert" : "Lead Mentor"
                        },
                        Skills = new List<string> { te.Skill?.Name ?? "General" },
                        Date = te.StartDate.ToString("MMM dd, yyyy", System.Globalization.CultureInfo.InvariantCulture),
                        Time = te.StartDate.ToString("hh:mm tt", System.Globalization.CultureInfo.InvariantCulture),
                        Duration = durationStr,
                        TotalSlots = te.MaxParticipants ?? 20,
                        TakenSlots = te.Enrollments.Count(e => e.Status == EnrollmentStatus.Confirmed),
                        Points = te.RewardPoints,
                        Image = te.CoverImageUrl ?? "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400&auto=format&fit=crop",
                        RegistrationStatus = recRegStatus
                    });
                }

                var dashboardDto = new MenteeDashboardDto
                {
                    HeroWorkshop = heroDto,
                    Points = pointsDto,
                    Activities = activities,
                    TrendingSkills = trendingSkills,
                    Recommendations = recommendations
                };

                return Ok(dashboardDto);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
// trigger restart
