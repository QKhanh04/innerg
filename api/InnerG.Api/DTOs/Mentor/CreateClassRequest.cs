using System;
using System.Collections.Generic;

namespace InnerG.Api.DTOs.Mentor
{
    public class CreateClassRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = "Technical";
        public string Level { get; set; } = "Beginner";
        public string Format { get; set; } = "Online";
        public string? MeetingLink { get; set; }
        public string? Location { get; set; }
        public string Date { get; set; } = string.Empty; // yyyy-MM-dd
        public string Time { get; set; } = string.Empty; // HH:mm
        public int Duration { get; set; } = 60; // in minutes
        public int MaxSlots { get; set; } = 15;
        public int Points { get; set; } = 100;
        public List<string> Skills { get; set; } = new List<string>();
        public List<CreateResourceRequest> Resources { get; set; } = new List<CreateResourceRequest>();
    }

    public class CreateResourceRequest
    {
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Type { get; set; } = "Document"; // Document, Video, Link
        public string Url { get; set; } = string.Empty;
        public string? FileType { get; set; }
        public long? FileSizeBytes { get; set; }
    }
}
