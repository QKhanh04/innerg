using System;
using System.Collections.Generic;

namespace InnerG.Api.DTOs
{
    public class ExploreClassDetailDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        
        public string Format { get; set; } = string.Empty; // "Online" or "Offline"
        public string FormatDetail { get; set; } = string.Empty; // e.g. "Zoom", "Room 302"
        
        public ExploreMentorDto Mentor { get; set; } = null!;
        public List<string> Skills { get; set; } = new List<string>();
        
        public string Date { get; set; } = string.Empty; // "MMM dd, yyyy"
        public string Time { get; set; } = string.Empty; // "hh:mm tt"
        public string Duration { get; set; } = string.Empty;
        
        public int TotalSlots { get; set; }
        public int TakenSlots { get; set; }
        public int Points { get; set; }
        public string Image { get; set; } = string.Empty;
        
        public string RegistrationStatus { get; set; } = "NotRegistered"; // For Mentee
        public string EventStatus { get; set; } = string.Empty; // "Draft", "Published", etc. for Mentor/HR

        public List<TrainingSessionDto> Sessions { get; set; } = new List<TrainingSessionDto>();
        public List<ExploreResourceDto> Resources { get; set; } = new List<ExploreResourceDto>();
    }

    public class TrainingSessionDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string StartTime { get; set; } = string.Empty;
        public string EndTime { get; set; } = string.Empty;
        public string Duration { get; set; } = string.Empty;
        public string Format { get; set; } = string.Empty;
        public string LocationOrLink { get; set; } = string.Empty;
    }

    public class ExploreResourceDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty; // "Document", "Video", "Link"
        public string Url { get; set; } = string.Empty;
        public string FileType { get; set; } = string.Empty;
        public long? FileSizeBytes { get; set; }
    }
}
