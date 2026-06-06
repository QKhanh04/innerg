using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InnerG.Api.Services.Implementations
{
    public class HrAnalyticsService : IHrAnalyticsService
    {
        private readonly AppDbContext _context;

        public HrAnalyticsService(AppDbContext context)
        {
            _context = context;
        }

        private static (DateTime from, DateTime to) ResolveRange(HrDateRangeQuery query)
        {
            var to = query.To ?? DateTime.UtcNow;
            var from = query.From ?? to.AddMonths(-3);
            return (from, to);
        }

        public async Task<HrAnalyticsOverviewDto> GetOverviewAsync(Guid companyId, HrDateRangeQuery query)
        {
            var (from, to) = ResolveRange(query);

            var completedEvents = await _context.TrainingEvents
                .Where(e => e.CompanyId == companyId && e.Status == TrainingEventStatus.Completed
                            && e.StartDate >= from && e.StartDate <= to)
                .Select(e => e.Id)
                .ToListAsync();

            var totalHours = await _context.TrainingSessions
                .Where(s => s.CompanyId == companyId && completedEvents.Contains(s.TrainingEventId))
                .SumAsync(s => (double)(s.EndTime - s.StartTime).TotalHours);

            var publishedMax = await _context.TrainingEvents
                .Where(e => e.CompanyId == companyId && e.Status == TrainingEventStatus.Published)
                .SumAsync(e => (int?)e.MaxParticipants) ?? 0;

            var confirmedEnrollments = await _context.Enrollments
                .CountAsync(e => e.CompanyId == companyId &&
                    (e.Status == EnrollmentStatus.Confirmed || e.Status == EnrollmentStatus.Completed));

            var activeUsers = await _context.Users.CountAsync(u => u.CompanyId == companyId && u.IsActive);
            var distinctLearners = await _context.Enrollments
                .Where(e => e.CompanyId == companyId)
                .Select(e => e.UserId)
                .Distinct()
                .CountAsync();

            var mentorRoleIds = await _context.Roles
                .Where(r => r.Name == AuthRoles.Mentor || r.Name == AuthRoles.HR)
                .Select(r => r.Id)
                .ToListAsync();

            var topMentors = await _context.Trainers
                .Where(t => t.CompanyId == companyId && t.TrainerType == TrainerType.Internal && t.IsActive)
                .Where(t => t.UserId.HasValue && _context.UserRoles.Any(ur => ur.UserId == t.UserId.Value && mentorRoleIds.Contains(ur.RoleId)))
                .OrderByDescending(t => t.AvgRating)
                .Take(10)
                .Select(t => new TopMentorDto
                {
                    TrainerId = t.Id,
                    FullName = t.FullName,
                    AvgRating = t.AvgRating,
                    TotalClassesTaught = t.TotalClassesTaught,
                    TotalStudents = t.TotalStudents
                })
                .ToListAsync();

            var topLearners = await _context.Enrollments
                .Where(e => e.CompanyId == companyId)
                .GroupBy(e => e.UserId)
                .Select(g => new { UserId = g.Key, Points = g.Sum(e => e.EarnedPoints) })
                .OrderByDescending(x => x.Points)
                .Take(10)
                .ToListAsync();

            var learnerIds = topLearners.Select(x => x.UserId).ToList();
            var learnerNames = await _context.Users
                .Where(u => learnerIds.Contains(u.Id))
                .ToDictionaryAsync(u => u.Id, u => u.FullName);

            return new HrAnalyticsOverviewDto
            {
                TotalEvents = completedEvents.Count,
                TotalHours = totalHours,
                EnrollmentRate = publishedMax > 0 ? (double)confirmedEnrollments / publishedMax : 0,
                ActiveLearnersRate = activeUsers > 0 ? (double)distinctLearners / activeUsers : 0,
                TopMentors = topMentors,
                TopLearners = topLearners.Select(x => new TopLearnerDto
                {
                    UserId = x.UserId,
                    FullName = learnerNames.GetValueOrDefault(x.UserId, "Unknown"),
                    TotalEarnedPoints = x.Points
                }).ToList()
            };
        }

        public async Task<HrChartsDto> GetChartsAsync(Guid companyId, HrChartsQuery query)
        {
            var (from, to) = ResolveRange(query);
            var groupByWeek = query.GroupBy.Equals("week", StringComparison.OrdinalIgnoreCase);

            var events = await _context.TrainingEvents
                .Where(e => e.CompanyId == companyId && e.StartDate >= from && e.StartDate <= to)
                .Select(e => new { e.StartDate, e.Id })
                .ToListAsync();

            var enrollments = await _context.Enrollments
                .Where(e => e.CompanyId == companyId)
                .Select(e => new { e.TrainingEventId, e.UserId })
                .ToListAsync();

            var trend = events
                .GroupBy(e => groupByWeek
                    ? $"{e.StartDate.Year}-W{System.Globalization.ISOWeek.GetWeekOfYear(e.StartDate)}"
                    : $"{e.StartDate.Year}-{e.StartDate.Month:D2}")
                .Select(g =>
                {
                    var eventIds = g.Select(x => x.Id).ToHashSet();
                    return new HrTrendPointDto
                    {
                        Period = g.Key,
                        EventCount = g.Count(),
                        UniqueLearners = enrollments
                            .Where(en => eventIds.Contains(en.TrainingEventId))
                            .Select(en => en.UserId)
                            .Distinct()
                            .Count()
                    };
                })
                .OrderBy(t => t.Period)
                .ToList();

            var byDept = await _context.Enrollments
                .Where(e => e.CompanyId == companyId)
                .Join(_context.Users, e => e.UserId, u => u.Id, (e, u) => new { e, u.DepartmentId, u.Department })
                .GroupBy(x => new { x.DepartmentId, DeptName = x.Department != null ? x.Department.Name : "Unassigned" })
                .Select(g => new HrDepartmentBarDto
                {
                    DepartmentId = g.Key.DepartmentId,
                    DepartmentName = g.Key.DeptName,
                    EnrollmentCount = g.Count()
                })
                .ToListAsync();

            var completion = await _context.TrainingEvents
                .Where(e => e.CompanyId == companyId)
                .GroupBy(e => e.Status)
                .Select(g => new HrCompletionSliceDto
                {
                    Status = g.Key.ToString(),
                    Count = g.Count()
                })
                .ToListAsync();

            return new HrChartsDto
            {
                Trend = trend,
                ByDepartment = byDept,
                Completion = completion
            };
        }

        public async Task<HrSkillMapDto> GetSkillMapAsync(Guid companyId)
        {
            var userSkills = await _context.UserSkills
                .Include(us => us.Skill)
                .Include(us => us.User)
                .ThenInclude(u => u.Department)
                .Where(us => us.User.CompanyId == companyId)
                .ToListAsync();

            var skills = userSkills
                .GroupBy(us => new
                {
                    us.SkillId,
                    us.Skill.Name,
                    DepartmentId = us.User.DepartmentId,
                    DeptName = us.User.Department?.Name ?? "Unassigned",
                    us.Proficiency
                })
                .Select(g => new SkillMapEntryDto
                {
                    SkillId = g.Key.SkillId,
                    SkillName = g.Key.Name,
                    DepartmentId = g.Key.DepartmentId,
                    DepartmentName = g.Key.DeptName,
                    Proficiency = g.Key.Proficiency.ToString(),
                    UserCount = g.Count()
                })
                .ToList();

            var skillIdsWithTrainers = await _context.TrainerSkills
                .Where(ts => _context.Trainers.Any(t =>
                    t.Id == ts.TrainerId && t.CompanyId == companyId && t.IsActive))
                .Select(ts => ts.SkillId)
                .Distinct()
                .ToListAsync();

            var allSkillIds = userSkills.Select(us => us.SkillId).Distinct().ToList();
            var noTrainer = await _context.Skills
                .Where(s => allSkillIds.Contains(s.Id) && !skillIdsWithTrainers.Contains(s.Id))
                .Select(s => s.Name)
                .ToListAsync();

            var mostWanted = await _context.LearningWishlists
                .Where(w => w.CompanyId == companyId)
                .OrderByDescending(w => w.VoteCount)
                .Take(10)
                .Select(w => new MostWantedSkillDto
                {
                    SkillName = w.Skill != null ? w.Skill.Name : (w.SkillNameCustom ?? "Unknown"),
                    VoteCount = w.VoteCount
                })
                .ToListAsync();

            return new HrSkillMapDto
            {
                Skills = skills,
                SkillsWithNoTrainer = noTrainer,
                MostWantedSkills = mostWanted
            };
        }
    }
}
