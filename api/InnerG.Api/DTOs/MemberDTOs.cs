using System;
using System.Collections.Generic;

namespace InnerG.Api.DTOs
{
    public class MemberListQuery
    {
        public string? Search { get; set; }
        public Guid? DepartmentId { get; set; }
        public string? Role { get; set; }
        public string? Status { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class DepartmentDTO
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
    }

    public class MemberResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public DepartmentDTO? Department { get; set; }
        public string? Position { get; set; }
        public List<string> Roles { get; set; } = new List<string>();
        public string Status { get; set; } = string.Empty;
        public DateTime JoinedAt { get; set; }
        public int LearningPoints { get; set; }
    }

    public class PaginatedResponse<T>
    {
        public List<T> Data { get; set; } = new List<T>();
        public int Total { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
    }

    public class MemberDetailResponse : MemberResponse
    {
        public List<LearningHistoryDTO> LearningHistory { get; set; } = new List<LearningHistoryDTO>();
        public List<SkillDTO> Skills { get; set; } = new List<SkillDTO>();
        public List<BadgeDTO> Badges { get; set; } = new List<BadgeDTO>();
        public int TotalLearningHours { get; set; }
        public TrainerProfileDTO? TrainerProfile { get; set; }
    }

    public class LearningHistoryDTO
    {
        public Guid ClassId { get; set; }
        public string ClassTitle { get; set; } = string.Empty;
        public DateTime ScheduledAt { get; set; }
        public string MentorName { get; set; } = string.Empty;
        public double FeedbackScore { get; set; }
        public string Status { get; set; } = string.Empty;
    }

    public class SkillDTO
    {
        public string SkillName { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
    }

    public class BadgeDTO
    {
        public string Name { get; set; } = string.Empty;
        public string IconUrl { get; set; } = string.Empty;
        public DateTime AwardedAt { get; set; }
    }

    public class TrainerProfileDTO
    {
        public string? Bio { get; set; }
        public double AvgRating { get; set; }
        public int TotalClassesTaught { get; set; }
        public int TotalStudents { get; set; }
        public string MentorStatus { get; set; } = string.Empty;
    }

    public class UpdateMemberRequest
    {
        public Guid? DepartmentId { get; set; }
        public string? Position { get; set; }
    }

    public class UpdateMemberStatusRequest
    {
        public string Status { get; set; } = string.Empty;
    }
}
