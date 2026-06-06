using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using InnerG.Api.Data;
using InnerG.Api.DTOs;
using InnerG.Api.Models;
using InnerG.Api.Repositories.Interfaces;
using InnerG.Api.Services.Interfaces;

namespace InnerG.Api.Services.Implementations
{
    public class ExploreService : IExploreService
    {
        private readonly IUnitOfWork _unitOfWork;

        public ExploreService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<List<ExploreClassDto>> GetExploreClassesAsync(Guid companyId, Guid userId)
        {
            var trainingEvents = await _unitOfWork.Repository<TrainingEvent>().GetQueryable()
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
                var userEnrollment = te.Enrollments.FirstOrDefault(e => e.UserId == userId && e.DeletedAt == null);
                string regStatus = "NotRegistered";
                if (userEnrollment != null)
                {
                    regStatus = userEnrollment.Status == EnrollmentStatus.Confirmed ? "Registered" :
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

                var skillsList = new List<string> { te.Skill?.Name ?? "General" };

                string dateStr = te.StartDate.ToString("MMM dd, yyyy", System.Globalization.CultureInfo.InvariantCulture);
                string timeStr = te.StartDate.ToString("hh:mm tt", System.Globalization.CultureInfo.InvariantCulture);
                double totalMins = (te.EndDate - te.StartDate).TotalMinutes;
                string durationStr = totalMins > 1440 ? $"{(te.EndDate - te.StartDate).TotalDays:0} days" : $"{totalMins:0} mins";

                string trainerPos = te.IsExternal ? "External Expert" : "Lead Mentor";

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
                    Level = "Intermediate",
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
                    TakenSlots = te.Enrollments.Count(e => e.Status == EnrollmentStatus.Confirmed && e.DeletedAt == null),
                    Points = te.RewardPoints,
                    Image = te.CoverImageUrl ?? "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400&auto=format&fit=crop",
                    RegistrationStatus = regStatus
                });
            }

            return dtoList;
        }

        public async Task<string> RegisterClassAsync(Guid companyId, Guid userId, Guid eventId)
        {
            var te = await _unitOfWork.Repository<TrainingEvent>().GetQueryable()
                .IgnoreQueryFilters()
                .Include(t => t.Enrollments)
                .Include(t => t.Trainer)
                .FirstOrDefaultAsync(t => t.Id == eventId && t.CompanyId == companyId);

            if (te == null)
            {
                throw new KeyNotFoundException("Class not found.");
            }

            if (te.Trainer != null && te.Trainer.UserId == userId)
            {
                throw new InvalidOperationException("You cannot register for a class that you are teaching.");
            }

            // Ngăn đăng ký lớp đã bắt đầu diễn ra
            if (te.StartDate <= DateTime.UtcNow)
            {
                throw new InvalidOperationException("Registration is closed. This class has already started or has already taken place.");
            }

            var existing = te.Enrollments.FirstOrDefault(e => e.UserId == userId);
            if (existing != null)
            {
                // Nếu đã xóa mềm trước đó (bấm Cancel) -> Khôi phục lại
                if (existing.DeletedAt != null)
                {
                    existing.DeletedAt = null;
                    existing.Status = EnrollmentStatus.Pending;
                    existing.EnrollmentDate = DateTime.UtcNow;
                    await _unitOfWork.Repository<Enrollment>().UpdateAsync(existing);
                }
                else if (existing.Status == EnrollmentStatus.Confirmed || existing.Status == EnrollmentStatus.Pending)
                {
                    throw new InvalidOperationException("You are already registered or pending registration for this class.");
                }
                else
                {
                    existing.Status = EnrollmentStatus.Pending;
                    existing.EnrollmentDate = DateTime.UtcNow;
                    await _unitOfWork.Repository<Enrollment>().UpdateAsync(existing);
                }
            }
            else
            {
                var enrollment = new Enrollment
                {
                    Id = Guid.NewGuid(),
                    CompanyId = companyId,
                    UserId = userId,
                    TrainingEventId = eventId,
                    Status = EnrollmentStatus.Pending,
                    EnrollmentDate = DateTime.UtcNow
                };
                await _unitOfWork.Repository<Enrollment>().AddAsync(enrollment);
            }

            await _unitOfWork.CommitAsync();
            return "Registration request sent successfully. Pending approval by Mentor! ⌛";
        }

        public async Task<bool> UnregisterClassAsync(Guid companyId, Guid userId, Guid eventId)
        {
            var enrollment = await _unitOfWork.Repository<Enrollment>().GetQueryable()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(e => e.TrainingEventId == eventId && e.UserId == userId && e.CompanyId == companyId);

            if (enrollment == null)
            {
                return false;
            }

            await _unitOfWork.Repository<Enrollment>().DeleteAsync(enrollment);
            await _unitOfWork.CommitAsync();
            return true;
        }

        public async Task<ExploreClassDetailDto?> GetExploreClassDetailAsync(Guid companyId, Guid userId, Guid eventId)
        {
            var te = await _unitOfWork.Repository<TrainingEvent>().GetQueryable()
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
                return null;
            }

            var userEnrollment = te.Enrollments.FirstOrDefault(e => e.UserId == userId && e.DeletedAt == null);
            string regStatus = "NotRegistered";
            if (userEnrollment != null)
            {
                regStatus = userEnrollment.Status == EnrollmentStatus.Confirmed ? "Registered" :
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

            var skillsList = new List<string> { te.Skill?.Name ?? "General" };

            string dateStr = te.StartDate.ToString("MMM dd, yyyy", System.Globalization.CultureInfo.InvariantCulture);
            string timeStr = te.StartDate.ToString("hh:mm tt", System.Globalization.CultureInfo.InvariantCulture);
            double totalMins = (te.EndDate - te.StartDate).TotalMinutes;
            string durationStr = totalMins > 1440 ? $"{(te.EndDate - te.StartDate).TotalDays:0} days" : $"{totalMins:0} mins";

            string trainerPos = te.IsExternal ? "External Expert" : "Lead Mentor";

            var resourcesDto = te.Resources.Select(r => new ExploreResourceDto
            {
                Id = r.Id,
                Title = r.Title,
                Type = r.Type.ToString(),
                Url = r.Url,
                FileSizeBytes = r.FileSizeBytes
            }).ToList();

            var sessionsDto = te.Sessions.OrderBy(s => s.StartTime).Select(s => {
                string format = s.MeetingRoomId.HasValue ? "Offline" : "Online";
                string loc = s.MeetingRoom?.Name ?? s.MeetingLink ?? s.Notes ?? string.Empty;
                double totalMins = (s.EndTime - s.StartTime).TotalMinutes;
                return new TrainingSessionDto
                {
                    Id = s.Id,
                    Title = s.Title,
                    StartTime = s.StartTime.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    EndTime = s.EndTime.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                    Duration = $"{totalMins:0} mins",
                    Format = format,
                    LocationOrLink = loc
                };
            }).ToList();

            string rawCategory = te.Skill?.Category ?? "General";
            string normalizedCategory = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(rawCategory.Trim().ToLower());
            if (normalizedCategory == "Soft Skill" || normalizedCategory == "Soft Skills")
            {
                normalizedCategory = "Soft Skills";
            }

            return new ExploreClassDetailDto
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
                    Position = trainerPos
                },
                Skills = skillsList,
                Date = dateStr,
                Time = timeStr,
                Duration = durationStr,
                TotalSlots = te.MaxParticipants ?? 20,
                TakenSlots = te.Enrollments.Count(e => e.Status == EnrollmentStatus.Confirmed && e.DeletedAt == null),
                Points = te.RewardPoints,
                Image = te.CoverImageUrl ?? "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400&auto=format&fit=crop",
                RegistrationStatus = regStatus,
                Resources = resourcesDto,
                Sessions = sessionsDto
            };
        }

        public async Task<MenteeDashboardDto> GetMenteeDashboardAsync(Guid companyId, Guid userId)
        {
            var user = await _unitOfWork.Repository<AppUser>().GetByIdAsync(userId);
            int totalPoints = user?.TotalInnerGPoints ?? 0;

            int level = 1;
            int totalPointsAccumulated = 0;
            int levelUpThreshold = 200;
            int step = 100;

            while (totalPoints >= totalPointsAccumulated + levelUpThreshold)
            {
                totalPointsAccumulated += levelUpThreshold;
                level++;
                levelUpThreshold += step;
            }

            int currentLevelProgress = totalPoints - totalPointsAccumulated;
            int pointsNeeded = levelUpThreshold - currentLevelProgress;

            var pointsDto = new MenteePointsDto
            {
                TotalPoints = totalPoints,
                Level = level,
                CurrentLevelProgress = currentLevelProgress,
                NextLevelRequirement = levelUpThreshold,
                PointsNeededForNextLevel = pointsNeeded
            };

            var upcomingEvents = await _unitOfWork.Repository<Enrollment>().GetQueryable()
                .IgnoreQueryFilters()
                .Include(e => e.TrainingEvent)
                    .ThenInclude(t => t.Trainer)
                        .ThenInclude(tr => tr.User)
                .Include(e => e.TrainingEvent.Sessions)
                    .ThenInclude(s => s.MeetingRoom)
                .Where(e => e.UserId == userId && 
                            e.CompanyId == companyId && 
                            (e.Status == EnrollmentStatus.Confirmed || e.Status == EnrollmentStatus.Pending) &&
                            e.TrainingEvent.Status == TrainingEventStatus.Published &&
                            e.TrainingEvent.StartDate > DateTime.UtcNow)
                .OrderBy(e => e.TrainingEvent.StartDate)
                .Select(e => e.TrainingEvent)
                .Take(3)
                .ToListAsync();

            TrainingEvent? heroEvent = upcomingEvents.FirstOrDefault();

            if (heroEvent == null)
            {
                heroEvent = await _unitOfWork.Repository<TrainingEvent>().GetQueryable()
                    .IgnoreQueryFilters()
                    .Include(t => t.Trainer)
                        .ThenInclude(tr => tr.User)
                    .Include(t => t.Enrollments)
                    .Include(t => t.Sessions)
                        .ThenInclude(s => s.MeetingRoom)
                    .Where(t => t.CompanyId == companyId && 
                                t.Status == TrainingEventStatus.Published && 
                                t.StartDate > DateTime.UtcNow)
                    .OrderBy(t => t.StartDate)
                    .FirstOrDefaultAsync();
            }

            MenteeDashboardHeroDto? heroDto = null;
            if (heroEvent != null)
            {
                var userEnrollment = heroEvent.Enrollments?.FirstOrDefault(e => e.UserId == userId);
                bool isEnrolled = userEnrollment != null && 
                                  (userEnrollment.Status == EnrollmentStatus.Confirmed || userEnrollment.Status == EnrollmentStatus.Pending);
                string regStatus = "NotRegistered";
                if (userEnrollment != null)
                {
                    regStatus = userEnrollment.Status == EnrollmentStatus.Confirmed ? "Registered" :
                                userEnrollment.Status == EnrollmentStatus.Pending ? "Pending" : "NotRegistered";
                }

                var countdownDiff = heroEvent.StartDate - DateTime.UtcNow;
                string countdownText = "Live in a few hours";
                if (countdownDiff.TotalDays >= 1)
                {
                    countdownText = $"Live in {(int)countdownDiff.TotalDays}d";
                }
                else if (countdownDiff.TotalHours >= 1)
                {
                    countdownText = $"Live in {(int)countdownDiff.TotalHours}h";
                }

                double totalMins = (heroEvent.EndDate - heroEvent.StartDate).TotalMinutes;
                string durationStr = totalMins > 1440 ? $"{(heroEvent.EndDate - heroEvent.StartDate).TotalDays:0} days" : $"{totalMins:0} mins";

                var heroSession = heroEvent.Sessions?.OrderBy(s => s.StartTime).FirstOrDefault();
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
                    Joined = $"{heroEvent.Enrollments?.Count(e => e.Status == EnrollmentStatus.Confirmed) ?? 0}/{heroEvent.MaxParticipants ?? 20}",
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

            var recentResources = await _unitOfWork.Repository<Resource>().GetQueryable()
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

            var topSkills = await _unitOfWork.Repository<TrainingEvent>().GetQueryable()
                .IgnoreQueryFilters()
                .Where(te => te.CompanyId == companyId && 
                             (te.Status == TrainingEventStatus.Published || te.Status == TrainingEventStatus.Completed) &&
                             te.Skill != null)
                .GroupBy(te => te.Skill!.Name)
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
                    Count = ts.Count * 7 + 11,
                    Heat = heat
                });
            }

            if (trendingSkills.Count == 0)
            {
                trendingSkills.Add(new MenteeTrendingSkillDto { Label = "Gen AI", Count = 28, Heat = "hot" });
                trendingSkills.Add(new MenteeTrendingSkillDto { Label = "React", Count = 21, Heat = "hot" });
                trendingSkills.Add(new MenteeTrendingSkillDto { Label = "Zustand", Count = 14, Heat = "rising" });
                trendingSkills.Add(new MenteeTrendingSkillDto { Label = "Motion", Count = 11, Heat = "normal" });
            }

            var enrolledEventIds = await _unitOfWork.Repository<Enrollment>().GetQueryable()
                .IgnoreQueryFilters()
                .Where(e => e.UserId == userId && (e.Status == EnrollmentStatus.Confirmed || e.Status == EnrollmentStatus.Pending))
                .Select(e => e.TrainingEventId)
                .ToListAsync();

            var recEvents = await _unitOfWork.Repository<TrainingEvent>().GetQueryable()
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

            if (recEvents.Count < 4)
            {
                var extraEvents = await _unitOfWork.Repository<TrainingEvent>().GetQueryable()
                    .IgnoreQueryFilters()
                    .Include(te => te.Skill)
                    .Include(te => te.Trainer)
                        .ThenInclude(tr => tr.User)
                    .Include(te => te.Enrollments)
                    .Include(te => te.Sessions)
                        .ThenInclude(s => s.MeetingRoom)
                    .Where(te => te.CompanyId == companyId && 
                                 te.Status == TrainingEventStatus.Published &&
                                 enrolledEventIds.Contains(te.Id))
                    .OrderBy(te => te.StartDate)
                    .Take(4 - recEvents.Count)
                    .ToListAsync();

                recEvents.AddRange(extraEvents);
            }

            var recommendationsDto = new List<ExploreClassDto>();
            foreach (var te in recEvents)
            {
                var userEnrollment = te.Enrollments?.FirstOrDefault(e => e.UserId == userId);
                string recRegStatus = "NotRegistered";
                if (userEnrollment != null)
                {
                    recRegStatus = userEnrollment.Status == EnrollmentStatus.Confirmed ? "Registered" :
                                   userEnrollment.Status == EnrollmentStatus.Pending ? "Pending" : "NotRegistered";
                }

                var firstSession = te.Sessions?.OrderBy(s => s.StartTime).FirstOrDefault();
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

                recommendationsDto.Add(new ExploreClassDto
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
                    TakenSlots = te.Enrollments?.Count(e => e.Status == EnrollmentStatus.Confirmed) ?? 0,
                    Points = te.RewardPoints,
                    Image = te.CoverImageUrl ?? "https://images.unsplash.com/photo-1633356122544-f134324a6cee?q=80&w=400&auto=format&fit=crop",
                    RegistrationStatus = recRegStatus
                });
            }

            return new MenteeDashboardDto
            {
                HeroWorkshop = heroDto,
                Points = pointsDto,
                Activities = activities,
                TrendingSkills = trendingSkills,
                Recommendations = recommendationsDto
            };
        }
    }
}
