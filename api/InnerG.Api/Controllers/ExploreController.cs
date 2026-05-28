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
                    string dateStr = te.StartDate.ToString("MMM dd, yyyy");
                    string timeStr = te.StartDate.ToString("hh:mm tt");
                    string durationStr = $"{(te.EndDate - te.StartDate).TotalMinutes} mins";

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
                    .FirstOrDefaultAsync(t => t.Id == eventId && t.CompanyId == companyId);

                if (te == null)
                {
                    return NotFound(new { message = "Class not found." });
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
    }
}
