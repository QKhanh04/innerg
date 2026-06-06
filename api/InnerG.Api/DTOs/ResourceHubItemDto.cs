using System;

namespace InnerG.Api.DTOs
{
    public class ResourceHubItemDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public string Type { get; set; } = string.Empty; // "Document", "Video", "Link"
        public string Url { get; set; } = string.Empty;
        public string? FileType { get; set; } // .pdf, .docx, etc.
        public long? FileSizeBytes { get; set; }
        public bool IsPublic { get; set; }
        
        // Parent workshop metadata
        public Guid WorkshopId { get; set; }
        public string WorkshopTitle { get; set; } = string.Empty;
        public string WorkshopDate { get; set; } = string.Empty;
        public string MentorName { get; set; } = string.Empty;
        public string? MentorAvatar { get; set; }
        public string Tag { get; set; } = string.Empty; // Category from Skill (Technical, Soft Skill, etc.)
        
        // Permission check
        public bool HasAccess { get; set; }
    }
}
