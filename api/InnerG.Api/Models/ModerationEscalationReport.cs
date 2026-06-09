using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public enum ModerationEscalationSeverity
    {
        Low,
        Medium,
        High,
        Critical
    }

    public enum ModerationEscalationStatus
    {
        Pending,
        Resolved,
        Dismissed
    }

    public class ModerationEscalationReport : TenantEntity
    {
        public Guid ReportedByUserId { get; set; }
        public string TargetType { get; set; } = string.Empty;
        public Guid TargetId { get; set; }
        public string TargetLabel { get; set; } = string.Empty;
        public string Reason { get; set; } = string.Empty;
        public ModerationEscalationSeverity Severity { get; set; } = ModerationEscalationSeverity.Medium;
        public ModerationEscalationStatus Status { get; set; } = ModerationEscalationStatus.Pending;
        public string? SourceContext { get; set; }
        public string? ResolutionAction { get; set; }
        public string? ResolutionNotes { get; set; }
        public Guid? ReviewedByUserId { get; set; }
        public DateTime? ReviewedAt { get; set; }

        public virtual AppUser ReportedByUser { get; set; } = null!;
        public virtual AppUser? ReviewedByUser { get; set; }
    }
}
