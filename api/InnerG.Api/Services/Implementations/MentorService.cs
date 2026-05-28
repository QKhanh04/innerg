using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using InnerG.Api.Models;
using InnerG.Api.DTOs.Mentor;
using InnerG.Api.Repositories.Interfaces;
using InnerG.Api.Services.Interfaces;

namespace InnerG.Api.Services.Implementations
{
    public class MentorService : IMentorService
    {
        private readonly IUnitOfWork _unitOfWork;

        public MentorService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        private async Task<Trainer> GetTrainerByUserIdAsync(Guid userId)
        {
            var trainer = await _unitOfWork.Repository<Trainer>()
                .GetQueryable().Where(t => t.UserId == userId)
                .FirstOrDefaultAsync();

            if (trainer == null)
            {
                var user = await _unitOfWork.Repository<AppUser>().GetByIdAsync(userId);
                if (user == null)
                    throw new Exception("User not found.");

                // Auto-create Trainer profile for users with Mentor role
                trainer = new Trainer
                {
                    Id = Guid.NewGuid(),
                    CompanyId = user.CompanyId,
                    UserId = userId,
                    TrainerType = TrainerType.Internal,
                    FullName = user.FullName ?? user.Email,
                    Email = user.Email,
                    IsActive = true,
                    MentorStatus = "Novice Mentor",
                    AvailabilityConfig = "[]"
                };
                
                await _unitOfWork.Repository<Trainer>().AddAsync(trainer);
                await _unitOfWork.CommitAsync();
            }

            return trainer;
        }

        public async Task<MentorStatsResponse> GetDashboardStatsAsync(Guid userId)
        {
            var trainer = await GetTrainerByUserIdAsync(userId);
            
            // Lấy tổng điểm từ user
            var user = await _unitOfWork.Repository<AppUser>().GetByIdAsync(userId);
            int currentPoints = user?.TotalInnerGPoints ?? 0;

            return new MentorStatsResponse
            {
                TotalClassesTaught = trainer.TotalClassesTaught,
                TotalStudents = trainer.TotalStudents,
                AverageRating = trainer.AvgRating,
                CurrentPoints = currentPoints,
                MentorStatus = trainer.MentorStatus,
                NextLevel = "Senior Mentor", // Giả lập logic level
                PointsToNextLevel = 5000 - currentPoints > 0 ? 5000 - currentPoints : 0
            };
        }

        public async Task<AvailabilityUpdateRequest> GetAvailabilityAsync(Guid userId)
        {
            var trainer = await GetTrainerByUserIdAsync(userId);
            
            if (string.IsNullOrEmpty(trainer.AvailabilityConfig))
            {
                return new AvailabilityUpdateRequest(); // Trả về list rỗng
            }

            try 
            {
                var schedule = JsonSerializer.Deserialize<List<DayAvailabilityDto>>(trainer.AvailabilityConfig);
                return new AvailabilityUpdateRequest { WeeklySchedule = schedule ?? new List<DayAvailabilityDto>() };
            }
            catch
            {
                return new AvailabilityUpdateRequest();
            }
        }

        public async Task UpdateAvailabilityAsync(Guid userId, AvailabilityUpdateRequest request)
        {
            var trainer = await GetTrainerByUserIdAsync(userId);
            
            trainer.AvailabilityConfig = JsonSerializer.Serialize(request.WeeklySchedule);
            await _unitOfWork.Repository<Trainer>().UpdateAsync(trainer);
            await _unitOfWork.CommitAsync();
        }

        public async Task<List<HostedClassResponse>> GetHostedClassesAsync(Guid userId)
        {
            var trainer = await GetTrainerByUserIdAsync(userId);

            var events = await _unitOfWork.Repository<TrainingEvent>()
                .GetQueryable().Where(e => e.TrainerId == trainer.Id)
                .Include(e => e.Skill)
                .Include(e => e.Enrollments)
                .OrderByDescending(e => e.StartDate)
                .ToListAsync();

            return events.Select(e => new HostedClassResponse
            {
                Id = e.Id,
                Title = e.Title,
                CoverImageUrl = e.CoverImageUrl,
                Type = e.Type,
                Status = e.Status,
                StartDate = e.StartDate,
                EndDate = e.EndDate,
                RegisteredCount = e.Enrollments.Count(en => en.Status == EnrollmentStatus.Confirmed),
                MaxParticipants = e.MaxParticipants,
                SkillName = e.Skill?.Name ?? "General"
            }).ToList();
        }

        public async Task<List<PendingEnrollmentResponse>> GetPendingEnrollmentsAsync(Guid userId)
        {
            var trainer = await GetTrainerByUserIdAsync(userId);

            var pendingEnrollments = await _unitOfWork.Repository<Enrollment>()
                .GetQueryable().Where(e => e.TrainingEvent.TrainerId == trainer.Id && e.Status == EnrollmentStatus.Pending)
                .Include(e => e.User)
                .Include(e => e.TrainingEvent)
                .OrderBy(e => e.EnrollmentDate)
                .ToListAsync();

            return pendingEnrollments.Select(e => new PendingEnrollmentResponse
            {
                EnrollmentId = e.Id,
                MenteeId = e.UserId,
                MenteeName = e.User.FullName,
                MenteeAvatar = e.User.AvatarUrl,
                JobTitle = e.User.JobTitle,
                TrainingEventId = e.TrainingEventId,
                EventTitle = e.TrainingEvent.Title,
                RequestedAt = e.EnrollmentDate
            }).ToList();
        }

        public async Task<bool> ProcessEnrollmentAsync(Guid userId, Guid enrollmentId, bool isApproved)
        {
            var trainer = await GetTrainerByUserIdAsync(userId);

            var enrollment = await _unitOfWork.Repository<Enrollment>()
                .GetQueryable().Where(e => e.Id == enrollmentId && e.TrainingEvent.TrainerId == trainer.Id)
                .Include(e => e.TrainingEvent)
                .FirstOrDefaultAsync();

            if (enrollment == null)
                return false;

            if (enrollment.Status != EnrollmentStatus.Pending)
                return false;

            if (isApproved)
            {
                // Kiểm tra slot (tuỳ chọn)
                var currentConfirmed = await _unitOfWork.Repository<Enrollment>()
                    .GetQueryable().Where(e => e.TrainingEventId == enrollment.TrainingEventId && e.Status == EnrollmentStatus.Confirmed)
                    .CountAsync();
                    
                if (enrollment.TrainingEvent.MaxParticipants.HasValue && currentConfirmed >= enrollment.TrainingEvent.MaxParticipants.Value)
                    return false; // Hết chỗ
                    
                enrollment.Status = EnrollmentStatus.Confirmed;
            }
            else
            {
                enrollment.Status = EnrollmentStatus.Rejected;
                enrollment.CancellationReason = "Rejected by Mentor";
            }

            await _unitOfWork.Repository<Enrollment>().UpdateAsync(enrollment);
            await _unitOfWork.CommitAsync();
            return true;
        }

        public async Task<bool> SubmitRollCallAsync(Guid userId, Guid sessionId, RollCallRequest request)
        {
            var trainer = await GetTrainerByUserIdAsync(userId);

            var session = await _unitOfWork.Repository<TrainingSession>()
                .GetQueryable().Where(s => s.Id == sessionId && s.TrainingEvent.TrainerId == trainer.Id)
                .Include(s => s.TrainingEvent)
                .FirstOrDefaultAsync();

            if (session == null)
                return false;

            // Cập nhật Attendance cho những người có mặt
            var attendances = await _unitOfWork.Repository<SessionAttendance>()
                .GetQueryable().Where(a => a.TrainingSessionId == sessionId)
                .ToListAsync();

            foreach (var attendance in attendances)
            {
                if (request.AttendedUserIds.Contains(attendance.UserId))
                {
                    attendance.Status = AttendanceStatus.Present;
                    attendance.CheckInTime = DateTime.UtcNow;
                }
                else
                {
                    attendance.Status = AttendanceStatus.Absent;
                }
                await _unitOfWork.Repository<SessionAttendance>().UpdateAsync(attendance);
            }

            await _unitOfWork.CommitAsync();
            return true;
        }

        public async Task<Guid> CreateClassAsync(Guid userId, CreateClassRequest request)
        {
            var trainer = await GetTrainerByUserIdAsync(userId);

            // Find or create Skill
            var skillName = request.Skills?.FirstOrDefault() ?? "General";
            var skill = await _unitOfWork.Repository<Skill>().GetQueryable()
                .FirstOrDefaultAsync(s => s.Name.ToLower() == skillName.ToLower());

            if (skill == null)
            {
                skill = new Skill
                {
                    Id = Guid.NewGuid(),
                    CompanyId = trainer.CompanyId,
                    Name = skillName,
                    Category = request.Category,
                    IsSystem = false,
                    IsActive = true
                };
                await _unitOfWork.Repository<Skill>().AddAsync(skill);
                await _unitOfWork.CommitAsync();
            }

            // Parse Date & Time
            DateTime startDate;
            if (!DateTime.TryParse($"{request.Date} {request.Time}", out startDate))
            {
                startDate = DateTime.UtcNow.AddDays(1);
            }
            else
            {
                // PostgreSQL strictly requires DateTime to be Utc
                startDate = DateTime.SpecifyKind(startDate, DateTimeKind.Utc);
            }

            // Secure Service Validation: Start date must be in the future
            if (startDate <= DateTime.UtcNow)
            {
                throw new ArgumentException("The scheduled class time must be in the future. Please select a future date and time slot.");
            }

            DateTime endDate = startDate.AddMinutes(request.Duration);

            // Determine Event Type
            TrainingEventType eventType = TrainingEventType.Workshop;
            if (request.Category.Equals("Course", StringComparison.OrdinalIgnoreCase))
                eventType = TrainingEventType.Course;
            else if (request.Category.Equals("Seminar", StringComparison.OrdinalIgnoreCase))
                eventType = TrainingEventType.Seminar;

            // Create Training Event
            var trainingEvent = new TrainingEvent
            {
                Id = Guid.NewGuid(),
                CompanyId = trainer.CompanyId,
                Title = request.Title,
                Description = request.Description,
                Type = eventType,
                Status = TrainingEventStatus.Published, // Auto-publish
                SkillId = skill.Id,
                TrainerId = trainer.Id,
                StartDate = startDate,
                EndDate = endDate,
                MaxParticipants = request.MaxSlots,
                IsExternal = false,
                RewardPoints = request.Points,
                CoverImageUrl = string.IsNullOrWhiteSpace(request.CoverImageUrl) ? "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=600&auto=format&fit=crop" : request.CoverImageUrl
            };

            await _unitOfWork.Repository<TrainingEvent>().AddAsync(trainingEvent);

            // Create primary Session
            var session = new TrainingSession
            {
                Id = Guid.NewGuid(),
                CompanyId = trainer.CompanyId,
                TrainingEventId = trainingEvent.Id,
                Title = $"{request.Title} - Core Session",
                StartTime = startDate,
                EndTime = endDate,
                MeetingLink = request.Format == "Online" ? request.MeetingLink : null,
                Notes = request.Format == "Offline" ? $"Physical Room: {request.Location}" : "Online Session"
            };

            await _unitOfWork.Repository<TrainingSession>().AddAsync(session);

            // Create Resources (Attachments & learning materials)
            if (request.Resources != null && request.Resources.Count > 0)
            {
                foreach (var resReq in request.Resources)
                {
                    ResourceType resType = ResourceType.Document;
                    if (resReq.Type.Equals("Video", StringComparison.OrdinalIgnoreCase))
                        resType = ResourceType.Video;
                    else if (resReq.Type.Equals("Link", StringComparison.OrdinalIgnoreCase))
                        resType = ResourceType.Link;

                    var resource = new Resource
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = trainer.CompanyId,
                        TrainingEventId = trainingEvent.Id,
                        Title = resReq.Title,
                        Description = resReq.Description,
                        Type = resType,
                        Url = resReq.Url,
                        FileType = resReq.FileType,
                        FileSizeBytes = resReq.FileSizeBytes,
                        IsPublic = true
                    };
                    await _unitOfWork.Repository<Resource>().AddAsync(resource);
                }
            }

            await _unitOfWork.CommitAsync();

            return trainingEvent.Id;
        }
    }
}
