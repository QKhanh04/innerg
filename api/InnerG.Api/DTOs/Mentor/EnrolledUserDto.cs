using System;

namespace InnerG.Api.DTOs.Mentor
{
    public class EnrolledUserDto
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string? Avatar { get; set; }
        public string? Position { get; set; }
        public bool Attended { get; set; }
    }
}
