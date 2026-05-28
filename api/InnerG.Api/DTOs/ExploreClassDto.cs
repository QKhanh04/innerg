using System;
using System.Collections.Generic;

namespace InnerG.Api.DTOs
{
    public class ExploreClassDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Level { get; set; } = string.Empty;
        public string Format { get; set; } = string.Empty;
        public string FormatDetail { get; set; } = string.Empty;
        
        public ExploreMentorDto Mentor { get; set; } = null!;
        public List<string> Skills { get; set; } = new List<string>();
        
        public string Date { get; set; } = string.Empty;
        public string Time { get; set; } = string.Empty;
        public string Duration { get; set; } = string.Empty;
        
        public int TotalSlots { get; set; }
        public int TakenSlots { get; set; }
        public int Points { get; set; }
        public string Image { get; set; } = string.Empty;
        public string RegistrationStatus { get; set; } = "NotRegistered"; // Pending, Registered, NotRegistered
    }

    public class ExploreMentorDto
    {
        public string Name { get; set; } = string.Empty;
        public string Avatar { get; set; } = string.Empty;
        public string Rating { get; set; } = "4.8";
        public string Position { get; set; } = string.Empty;
    }
}
