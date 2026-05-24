using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public class Invite : TenantEntity
    {
        public Company Company { get; set; } = null!;
        public Guid? InviterId { get; set; }
        public AppUser? Inviter { get; set; }
        public Guid? DepartmentId { get; set; }
        public Department? Department { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string? Position { get; set; }
        public string RolesCsv { get; set; } = AuthRoles.Mentee;
        public string TokenHash { get; set; } = string.Empty;
        public string Status { get; set; } = InviteStatus.Pending;
        public DateTime ExpiresAt { get; set; }
        public DateTime? AcceptedAt { get; set; }
        public DateTime? RevokedAt { get; set; }

        public IEnumerable<string> Roles =>
            RolesCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
    }
}
