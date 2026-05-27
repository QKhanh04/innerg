using System;
using System.Collections.Generic;

namespace InnerG.Api.DTOs
{
    public class CreateInviteRequest
    {
        public Guid? CompanyId { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public Guid? DepartmentId { get; set; }
        public string? DepartmentName { get; set; }
        public string? Position { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
    }

    public class BulkInviteRequest
    {
        public IList<CreateInviteRequest> Invites { get; set; } = new List<CreateInviteRequest>();
    }

    public class BulkInviteResponse
    {
        public int SuccessCount { get; set; }
        public int ErrorCount { get; set; }
        public IList<InviteResponse> SuccessfulInvites { get; set; } = new List<InviteResponse>();
        public IList<BulkInviteError> Errors { get; set; } = new List<BulkInviteError>();
    }

    public class BulkInviteError
    {
        public int Row { get; set; }
        public string Email { get; set; } = string.Empty;
        public string Error { get; set; } = string.Empty;
    }

    public class InviteListQuery
    {
        public string? Status { get; set; }
        public string? Search { get; set; }
        public int Page { get; set; } = 1;
        public int PageSize { get; set; } = 20;
    }

    public class InviteListItemResponse
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
        public string? Department { get; set; }
        public string? Position { get; set; }
        public string Status { get; set; } = string.Empty;
        public string? InvitedBy { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
    }

    public class ValidateFileRowResult
    {
        public int Row { get; set; }
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
        public string? Department { get; set; }
        public string? Position { get; set; }
        public string? ErrorCode { get; set; }
        public string? ErrorMessage { get; set; }
    }

    public class ValidateFileResult
    {
        public IList<ValidateFileRowResult> Valid { get; set; } = new List<ValidateFileRowResult>();
        public IList<ValidateFileRowResult> Invalid { get; set; } = new List<ValidateFileRowResult>();
        public int Total => Valid.Count + Invalid.Count;
    }
}
