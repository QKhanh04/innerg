using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace InnerG.Api.DTOs.Mentor
{
    public class RollCallRequest
    {
        [Required]
        public List<Guid> AttendedUserIds { get; set; } = new List<Guid>();
        
        public string? Note { get; set; }
    }
}
