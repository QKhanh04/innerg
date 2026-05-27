using System;

namespace InnerG.Api.DTOs.Mentor
{
    public class PendingEnrollmentResponse
    {
        public Guid EnrollmentId { get; set; }
        public Guid MenteeId { get; set; }
        public string MenteeName { get; set; } = string.Empty;
        public string? MenteeAvatar { get; set; }
        public string? JobTitle { get; set; }
        
        public Guid TrainingEventId { get; set; }
        public string EventTitle { get; set; } = string.Empty;
        public DateTime RequestedAt { get; set; }
    }
}
