using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum ResourceType
    {
        Document,
        Video,
        Link,
        Quiz
    }

    public class Resource : TenantEntity
    {
        public Guid TrainingEventId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        
        public ResourceType Type { get; set; }
        public string Url { get; set; } = string.Empty; // File URL or Link
        public string? FileType { get; set; } // .pdf, .mp4, etc.
        public long? FileSizeBytes { get; set; }
        
        public bool IsPublic { get; set; } = false; // Accessible without enrollment?

        // Navigation properties
        public virtual TrainingEvent TrainingEvent { get; set; } = null!;
    }
}
