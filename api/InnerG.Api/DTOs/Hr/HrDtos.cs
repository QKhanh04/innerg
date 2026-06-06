using System;
using System.Collections.Generic;
using InnerG.Api.Models;

namespace InnerG.Api.DTOs.Hr
{
    // Analytics
    public class HrDateRangeQuery
    {
        public DateTime? From { get; set; }
        public DateTime? To { get; set; }
    }

    public class HrAnalyticsOverviewDto
    {
        public int TotalEvents { get; set; }
        public double TotalHours { get; set; }
        public double EnrollmentRate { get; set; }
        public double ActiveLearnersRate { get; set; }
        public List<TopMentorDto> TopMentors { get; set; } = new();
        public List<TopLearnerDto> TopLearners { get; set; } = new();
    }

    public class TopMentorDto
    {
        public Guid TrainerId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public double AvgRating { get; set; }
        public int TotalClassesTaught { get; set; }
        public int TotalStudents { get; set; }
    }

    public class TopLearnerDto
    {
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public int TotalEarnedPoints { get; set; }
    }

    public class HrChartsQuery : HrDateRangeQuery
    {
        public string GroupBy { get; set; } = "month";
    }

    public class HrTrendPointDto
    {
        public string Period { get; set; } = string.Empty;
        public int EventCount { get; set; }
        public int UniqueLearners { get; set; }
    }

    public class HrDepartmentBarDto
    {
        public Guid? DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public int EnrollmentCount { get; set; }
    }

    public class HrCompletionSliceDto
    {
        public string Status { get; set; } = string.Empty;
        public int Count { get; set; }
    }

    public class HrChartsDto
    {
        public List<HrTrendPointDto> Trend { get; set; } = new();
        public List<HrDepartmentBarDto> ByDepartment { get; set; } = new();
        public List<HrCompletionSliceDto> Completion { get; set; } = new();
    }

    public class HrSkillMapDto
    {
        public List<SkillMapEntryDto> Skills { get; set; } = new();
        public List<string> SkillsWithNoTrainer { get; set; } = new();
        public List<MostWantedSkillDto> MostWantedSkills { get; set; } = new();
    }

    public class SkillMapEntryDto
    {
        public Guid SkillId { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public Guid? DepartmentId { get; set; }
        public string DepartmentName { get; set; } = string.Empty;
        public string Proficiency { get; set; } = string.Empty;
        public int UserCount { get; set; }
    }

    public class MostWantedSkillDto
    {
        public string SkillName { get; set; } = string.Empty;
        public int VoteCount { get; set; }
    }

    // Wishlist HR
    public class HrWishlistQuery
    {
        public WishlistStatus? Status { get; set; }
        public int? MinVotes { get; set; }
        public Guid? DepartmentId { get; set; }
    }

    public class HrWishlistItemDto
    {
        public Guid Id { get; set; }
        public string ProposerName { get; set; } = string.Empty;
        public string? DepartmentName { get; set; }
        public string SkillName { get; set; } = string.Empty;
        public string? Category { get; set; }
        public string? Description { get; set; }
        public string Urgency { get; set; } = string.Empty;
        public int VoteCount { get; set; }
        public string Status { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
    }

    public class UpdateWishlistStatusRequest
    {
        public WishlistStatus Status { get; set; }
        public string? RejectionReason { get; set; }
    }

    public class AssignTrainerRequest
    {
        public Guid TrainerId { get; set; }
    }

    public class LinkEventRequest
    {
        public Guid TrainingEventId { get; set; }
    }

    public class SuggestedTrainerDto
    {
        public Guid TrainerId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public double AvgRating { get; set; }
        public string Proficiency { get; set; } = string.Empty;
    }

    // Moderation
    public class HrPendingEventDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string TrainerName { get; set; } = string.Empty;
        public DateTime StartDate { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
    }

    public class ReviewEventRequest
    {
        public bool Approved { get; set; }
        public string? Reason { get; set; }
    }

    public class HrPendingResourceDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string EventTitle { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
    }

    public class ReviewResourceRequest
    {
        public bool Approved { get; set; }
    }

    // Department
    public class DepartmentRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Code { get; set; }
        public Guid? ParentDepartmentId { get; set; }
        public Guid? ManagerUserId { get; set; }
    }

    public class DepartmentResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Code { get; set; }
        public Guid? ParentDepartmentId { get; set; }
        public string? ParentDepartmentName { get; set; }
        public Guid? ManagerUserId { get; set; }
        public string? ManagerName { get; set; }
        public int UserCount { get; set; }
    }

    public class DepartmentStatsDto
    {
        public int EnrollmentCount { get; set; }
        public double TotalHours { get; set; }
        public double? AvgRating { get; set; }
    }

    // Point rules, rewards, badges
    public class PointRuleDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public RuleType RuleType { get; set; }
        public ConditionType ConditionType { get; set; }
        public ConditionOperator? ConditionOperator { get; set; }
        public string? ConditionValue { get; set; }
        public decimal PointsValue { get; set; }
        public int Priority { get; set; }
        public bool IsActive { get; set; }
    }

    public class PointRuleRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public RuleType RuleType { get; set; }
        public ConditionType ConditionType { get; set; }
        public ConditionOperator? ConditionOperator { get; set; }
        public string? ConditionValue { get; set; }
        public decimal PointsValue { get; set; }
        public int Priority { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class RewardDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public RewardType Type { get; set; }
        public int PointCost { get; set; }
        public int StockQuantity { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; }
    }

    public class RewardRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public RewardType Type { get; set; }
        public int PointCost { get; set; }
        public int StockQuantity { get; set; }
        public string? ImageUrl { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class BadgeDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? IconUrl { get; set; }
        public BadgeConditionType ConditionType { get; set; }
        public int? ConditionValue { get; set; }
        public bool IsSystem { get; set; }
    }

    public class BadgeRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string? IconUrl { get; set; }
        public BadgeConditionType ConditionType { get; set; }
        public int? ConditionValue { get; set; }
    }

    public class UserRewardDto
    {
        public Guid Id { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string RewardName { get; set; } = string.Empty;
        public RedemptionStatus Status { get; set; }
        public int PointsSpent { get; set; }
        public DateTime RedeemedAt { get; set; }
        public string? AdminNotes { get; set; }
    }

    public class UpdateRedemptionRequest
    {
        public RedemptionStatus Status { get; set; }
        public string? AdminNotes { get; set; }
    }

    public class AdjustPointsRequest
    {
        public Guid UserId { get; set; }
        public int Amount { get; set; }
        public string Note { get; set; } = string.Empty;
    }

    // Reports
    public class HrEventReportDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public string TrainerName { get; set; } = string.Empty;
        public int EnrolledCount { get; set; }
        public int AttendedCount { get; set; }
        public double? AvgRating { get; set; }
        public DateTime StartDate { get; set; }
    }

    public class HrEventDetailReportDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public List<EnrollmentReportRowDto> Enrollments { get; set; } = new();
        public List<SessionAttendanceSummaryDto> Sessions { get; set; } = new();
        public List<CriteriaRatingDto> CriteriaRatings { get; set; } = new();
    }

    public class EnrollmentReportRowDto
    {
        public string FullName { get; set; } = string.Empty;
        public string? DepartmentName { get; set; }
        public string Status { get; set; } = string.Empty;
        public int EarnedPoints { get; set; }
        public bool FeedbackSubmitted { get; set; }
    }

    public class SessionAttendanceSummaryDto
    {
        public Guid SessionId { get; set; }
        public string Title { get; set; } = string.Empty;
        public DateTime StartTime { get; set; }
        public int PresentCount { get; set; }
        public int AbsentCount { get; set; }
    }

    public class CriteriaRatingDto
    {
        public string CriteriaName { get; set; } = string.Empty;
        public double AvgScore { get; set; }
    }

    public class HrMemberReportDto
    {
        public Guid UserId { get; set; }
        public string FullName { get; set; } = string.Empty;
        public List<EnrollmentReportRowDto> Enrollments { get; set; } = new();
        public TrainerReportSummaryDto? TrainerSummary { get; set; }
        public List<BadgeSummaryDto> Badges { get; set; } = new();
        public List<PointsLedgerRowDto> PointsHistory { get; set; } = new();
    }

    public class TrainerReportSummaryDto
    {
        public int TotalClassesTaught { get; set; }
        public double AvgRating { get; set; }
        public int TotalStudents { get; set; }
    }

    public class BadgeSummaryDto
    {
        public string Name { get; set; } = string.Empty;
        public DateTime AwardedAt { get; set; }
    }

    public class PointsLedgerRowDto
    {
        public int Amount { get; set; }
        public int BalanceAfter { get; set; }
        public string Type { get; set; } = string.Empty;
        public string? Note { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    // Notifications broadcast
    public class BroadcastNotificationRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public string? ReferenceType { get; set; }
        public Guid? ReferenceId { get; set; }
        public string TargetType { get; set; } = "Company";
        public List<Guid>? TargetDepartmentIds { get; set; }
        public NotificationChannel Channel { get; set; } = NotificationChannel.Push;
        public DateTime? ScheduledAt { get; set; }
    }

    public class NotificationHistoryDto
    {
        public Guid Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public DateTime? SentAt { get; set; }
        public int RecipientCount { get; set; }
    }

    // Workspace
    public class WorkspaceSettingsDto
    {
        public string Name { get; set; } = string.Empty;
        public string Domain { get; set; } = string.Empty;
        public string? LogoUrl { get; set; }
        public string Timezone { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
        public CompanyBusinessSettingsDto BusinessRules { get; set; } = new();
    }

    public class CompanyBusinessSettingsDto
    {
        public int CancellationWindowHours { get; set; } = 2;
        public int WaitlistConfirmationHours { get; set; } = 24;
        public int FeedbackDeadlineDays { get; set; } = 3;
        public int WishlistVoteThreshold { get; set; } = 5;
        public int MaxReschedulesAllowed { get; set; } = 2;
        public int InviteExpiryDays { get; set; } = 7;
        public int MaxLoginAttempts { get; set; } = 5;
        public bool RequireContentApproval { get; set; }
    }

    // Meeting rooms
    public class MeetingRoomDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Location { get; set; }
        public int Capacity { get; set; }
        public List<string> Facilities { get; set; } = new();
        public bool IsActive { get; set; }
    }

    public class MeetingRoomRequest
    {
        public string Name { get; set; } = string.Empty;
        public string? Location { get; set; }
        public int Capacity { get; set; }
        public List<string>? Facilities { get; set; }
        public bool IsActive { get; set; } = true;
    }

    public class RoomAvailabilityQuery
    {
        public DateTime From { get; set; }
        public DateTime To { get; set; }
    }

    // HR create event
    public class HrCreateEventRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public TrainingEventType Type { get; set; }
        public Guid SkillId { get; set; }
        public Guid TrainerId { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? MaxParticipants { get; set; }
        public int RewardPoints { get; set; }
        public List<Guid>? TargetDepartmentIds { get; set; }
    }
}
