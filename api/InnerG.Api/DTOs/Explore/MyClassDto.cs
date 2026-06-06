using System;
using InnerG.Api.Models;

namespace InnerG.Api.DTOs.Explore
{
    public class MyClassDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? CoverImageUrl { get; set; }
        public string MentorName { get; set; } = string.Empty;
        public EnrollmentStatus Status { get; set; }
        public TrainingEventType Type { get; set; }
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public bool HasReviewed { get; set; }
    }
}
