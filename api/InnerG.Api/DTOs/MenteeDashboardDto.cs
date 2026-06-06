using System;
using System.Collections.Generic;

namespace InnerG.Api.DTOs
{
    public class MenteeDashboardDto
    {
        public MenteeDashboardHeroDto? HeroWorkshop { get; set; }
        public MenteePointsDto Points { get; set; } = null!;
        public List<MenteeActivityDto> Activities { get; set; } = new();
        public List<MenteeTrendingSkillDto> TrendingSkills { get; set; } = new();
        public List<ExploreClassDto> Recommendations { get; set; } = new();
    }

    public class MenteeDashboardHeroDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Instructor { get; set; } = string.Empty;
        public string InstructorAvatar { get; set; } = string.Empty;
        public string InstructorRole { get; set; } = string.Empty;
        public string Rating { get; set; } = "4.9";
        public string Location { get; set; } = "Online";
        public string Joined { get; set; } = "0/0";
        public string Duration { get; set; } = "60 min";
        public List<string> Tags { get; set; } = new();
        public string Description { get; set; } = string.Empty;
        public List<string> Outcomes { get; set; } = new();
        public string? CountdownText { get; set; }
        public bool IsRegistered { get; set; }
        public string RegistrationStatus { get; set; } = "NotRegistered";
    }

    public class MenteePointsDto
    {
        public int TotalPoints { get; set; }
        public int Level { get; set; }
        public int CurrentLevelProgress { get; set; }
        public int NextLevelRequirement { get; set; }
        public int PointsNeededForNextLevel { get; set; }
    }

    public class MenteeActivityDto
    {
        public string Title { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // Resource, Video, Link, Repo
        public string TimeAgo { get; set; } = string.Empty;
        public string IconType { get; set; } = string.Empty; // book, video, mic
    }

    public class MenteeTrendingSkillDto
    {
        public string Label { get; set; } = string.Empty;
        public int Count { get; set; }
        public string Heat { get; set; } = "normal"; // hot, rising, normal
    }
}
