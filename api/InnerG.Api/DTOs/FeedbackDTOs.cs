using System;
using System.Collections.Generic;

namespace InnerG.Api.DTOs
{
    public class SubmitFeedbackRequestDto
    {
        public int OverallRating { get; set; }
        public string? Comment { get; set; }
        public bool IsAnonymous { get; set; }
        public Dictionary<Guid, int> CriteriaScores { get; set; } = new Dictionary<Guid, int>();
    }

    public class FeedbackResponseDto
    {
        public Guid Id { get; set; }
        public string ReviewerName { get; set; } = string.Empty;
        public string? ReviewerAvatarUrl { get; set; }
        public int OverallRating { get; set; }
        public string? Comment { get; set; }
        public DateTime CreatedAt { get; set; }
        public Dictionary<string, int> CriteriaScores { get; set; } = new Dictionary<string, int>();
    }

    public class CriteriaDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Description { get; set; }
    }
}
