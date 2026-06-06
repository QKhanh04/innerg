using System;
using InnerG.Api.Models;

namespace InnerG.Api.DTOs.Mentor
{
    public class HostedClassResponse
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
        public TrainingEventType Type { get; set; }
        public TrainingEventStatus Status { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int RegisteredCount { get; set; }
        public int? MaxParticipants { get; set; }
        public string SkillName { get; set; } = string.Empty;
    }
}
