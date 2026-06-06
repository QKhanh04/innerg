using System;
using System.Collections.Generic;

namespace InnerG.Api.DTOs
{
    public class WishlistDto
    {
        public Guid Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string ProposedBy { get; set; } = string.Empty;
        public string ProposedByAvatar { get; set; } = string.Empty;
        public int Votes { get; set; }
        public bool Voted { get; set; }
        public string Status { get; set; } = "pending"; // pending, in-review, approved, rejected
        public int CommentsCount { get; set; } = 0;
        public List<string> Voters { get; set; } = new List<string>();
        public string? HrNote { get; set; }
    }

    public class CreateWishlistRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public string? Reason { get; set; }
    }

    public class WishlistVoteResultDto
    {
        public bool Voted { get; set; }
        public int Votes { get; set; }
        public string Message { get; set; } = string.Empty;
    }
}
