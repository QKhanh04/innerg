using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Exceptions;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InnerG.Api.Services.Implementations
{
    public class HrReportsService : IHrReportsService
    {
        private readonly AppDbContext _context;

        public HrReportsService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<HrEventReportDto>> GetEventReportsAsync(
            Guid companyId, HrDateRangeQuery query, Guid? departmentId)
        {
            var from = query.From ?? DateTime.UtcNow.AddMonths(-3);
            var to = query.To ?? DateTime.UtcNow;

            var events = await _context.TrainingEvents
                .Include(e => e.Trainer)
                .Include(e => e.Enrollments)
                .Where(e => e.CompanyId == companyId && e.StartDate >= from && e.StartDate <= to)
                .ToListAsync();

            if (departmentId.HasValue)
            {
                var userIds = await _context.Users
                    .Where(u => u.DepartmentId == departmentId)
                    .Select(u => u.Id)
                    .ToListAsync();
                events = events.Where(e => e.Enrollments.Any(en => userIds.Contains(en.UserId))).ToList();
            }

            var eventIds = events.Select(e => e.Id).ToList();
            var feedbackAvg = await _context.Feedbacks
                .Where(f => eventIds.Contains(f.TrainingEventId))
                .GroupBy(f => f.TrainingEventId)
                .Select(g => new { EventId = g.Key, Avg = g.Average(f => (double?)f.OverallRating) })
                .ToDictionaryAsync(x => x.EventId, x => x.Avg);

            var attendance = await _context.SessionAttendances
                .Include(a => a.TrainingSession)
                .Where(a => a.CompanyId == companyId && eventIds.Contains(a.TrainingSession.TrainingEventId))
                .GroupBy(a => a.TrainingSession.TrainingEventId)
                .Select(g => new { EventId = g.Key, Present = g.Count(a => a.Status == AttendanceStatus.Present) })
                .ToDictionaryAsync(x => x.EventId, x => x.Present);

            return events.Select(e => new HrEventReportDto
            {
                Id = e.Id,
                Title = e.Title,
                Status = e.Status.ToString(),
                TrainerName = e.Trainer.FullName,
                EnrolledCount = e.Enrollments.Count,
                AttendedCount = attendance.GetValueOrDefault(e.Id, 0),
                AvgRating = feedbackAvg.GetValueOrDefault(e.Id),
                StartDate = e.StartDate
            }).OrderByDescending(e => e.StartDate).ToList();
        }

        public async Task<HrEventDetailReportDto> GetEventDetailAsync(Guid eventId, Guid companyId)
        {
            var evt = await _context.TrainingEvents
                .Include(e => e.Enrollments).ThenInclude(en => en.User).ThenInclude(u => u.Department)
                .Include(e => e.Sessions).ThenInclude(s => s.Attendances)
                .FirstOrDefaultAsync(e => e.Id == eventId && e.CompanyId == companyId);

            if (evt == null)
                throw new BusinessException("EVENT_NOT_FOUND", "Không tìm thấy lớp học.", 404);

            var criteriaRatings = await _context.FeedbackResponses
                .Include(fr => fr.Criteria)
                .Where(fr => _context.Feedbacks.Any(f =>
                    f.TrainingEventId == eventId && f.Id == fr.FeedbackId))
                .GroupBy(fr => fr.Criteria.Name)
                .Select(g => new CriteriaRatingDto
                {
                    CriteriaName = g.Key,
                    AvgScore = g.Average(x => (double)x.Score)
                })
                .ToListAsync();

            return new HrEventDetailReportDto
            {
                Id = evt.Id,
                Title = evt.Title,
                Enrollments = evt.Enrollments.Select(en => new EnrollmentReportRowDto
                {
                    FullName = en.User.FullName,
                    DepartmentName = en.User.Department?.Name,
                    Status = en.Status.ToString(),
                    EarnedPoints = en.EarnedPoints,
                    FeedbackSubmitted = en.FeedbackSubmitted
                }).ToList(),
                Sessions = evt.Sessions.Select(s => new SessionAttendanceSummaryDto
                {
                    SessionId = s.Id,
                    Title = s.Title,
                    StartTime = s.StartTime,
                    PresentCount = s.Attendances.Count(a => a.Status == AttendanceStatus.Present),
                    AbsentCount = s.Attendances.Count(a => a.Status == AttendanceStatus.Absent)
                }).ToList(),
                CriteriaRatings = criteriaRatings
            };
        }

        public async Task<HrMemberReportDto> GetMemberReportAsync(Guid userId, Guid companyId)
        {
            var user = await _context.Users
                .Include(u => u.Enrollments)
                .Include(u => u.TrainerProfiles)
                .Include(u => u.Badges).ThenInclude(b => b.Badge)
                .Include(u => u.PointsLedger)
                .FirstOrDefaultAsync(u => u.Id == userId && u.CompanyId == companyId);

            if (user == null)
                throw new BusinessException("USER_NOT_FOUND", "Không tìm thấy nhân viên.", 404);

            TrainerReportSummaryDto? trainerSummary = null;
            var trainer = user.TrainerProfiles.FirstOrDefault();
            if (trainer != null)
            {
                trainerSummary = new TrainerReportSummaryDto
                {
                    TotalClassesTaught = trainer.TotalClassesTaught,
                    AvgRating = trainer.AvgRating,
                    TotalStudents = trainer.TotalStudents
                };
            }

            return new HrMemberReportDto
            {
                UserId = user.Id,
                FullName = user.FullName,
                Enrollments = user.Enrollments.Select(en => new EnrollmentReportRowDto
                {
                    FullName = user.FullName,
                    Status = en.Status.ToString(),
                    EarnedPoints = en.EarnedPoints,
                    FeedbackSubmitted = en.FeedbackSubmitted
                }).ToList(),
                TrainerSummary = trainerSummary,
                Badges = user.Badges.Select(b => new BadgeSummaryDto
                {
                    Name = b.Badge.Name,
                    AwardedAt = b.AwardedAt
                }).ToList(),
                PointsHistory = user.PointsLedger.OrderByDescending(p => p.CreatedAt)
                    .Take(50)
                    .Select(p => new PointsLedgerRowDto
                    {
                        Amount = p.Amount,
                        BalanceAfter = p.BalanceAfter,
                        Type = p.Type.ToString(),
                        Note = p.Note,
                        CreatedAt = p.CreatedAt
                    }).ToList()
            };
        }

        public async Task<byte[]> ExportEventsCsvAsync(Guid companyId, HrDateRangeQuery query)
        {
            var reports = await GetEventReportsAsync(companyId, query, null);
            var sb = new StringBuilder();
            sb.AppendLine("Id,Title,Status,Trainer,Enrolled,Attended,AvgRating,StartDate");
            foreach (var r in reports)
                sb.AppendLine($"{r.Id},{Escape(r.Title)},{r.Status},{Escape(r.TrainerName)},{r.EnrolledCount},{r.AttendedCount},{r.AvgRating},{r.StartDate:O}");
            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        public async Task<byte[]> ExportMembersCsvAsync(Guid companyId)
        {
            var users = await _context.Users
                .Include(u => u.Department)
                .Where(u => u.CompanyId == companyId && u.DeletedAt == null)
                .OrderBy(u => u.FullName)
                .ToListAsync();

            var sb = new StringBuilder();
            sb.AppendLine("Id,FullName,Email,JobTitle,Department,Points,IsActive");
            foreach (var u in users)
                sb.AppendLine($"{u.Id},{Escape(u.FullName)},{Escape(u.Email)},{Escape(u.JobTitle)},{Escape(u.Department?.Name)},{u.TotalInnerGPoints},{u.IsActive}");
            return Encoding.UTF8.GetBytes(sb.ToString());
        }

        private static string Escape(string? value) =>
            $"\"{(value ?? "").Replace("\"", "\"\"")}\"";
    }
}
