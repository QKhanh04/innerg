using System;

namespace InnerG.Api.DTOs.Mentor
{
    public class MentorStatsResponse
    {
        public int TotalClassesTaught { get; set; }
        public int TotalStudents { get; set; }
        public double AverageRating { get; set; }
        public int CurrentPoints { get; set; }
        public string MentorStatus { get; set; } = string.Empty;
        public string? NextLevel { get; set; }
        public int PointsToNextLevel { get; set; }
    }
}
