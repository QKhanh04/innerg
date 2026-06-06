using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Threading.Tasks;

namespace InnerG.Api.DTOs
{
    public class LoginRequest
    {
        public string EmailOrUsername { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public Guid? CompanyId { get; set; }
        public string? TwoFactorCode { get; set; }
    }

    public class ForgotPasswordRequest
    {
        public string Email { get; set; } = string.Empty;
        public Guid? CompanyId { get; set; }
    }

    public class ResetPasswordRequest
    {
        public string UserId { get; set; } = string.Empty;
        public string Token { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class AcceptInviteRequest
    {
        public string Token { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string? AvatarUrl { get; set; }
        public string Password { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class BootstrapCompanyRequest
    {
        public string CompanyName { get; set; } = string.Empty;
        public string EmailDomain { get; set; } = string.Empty;
        public string Timezone { get; set; } = "Asia/Ho_Chi_Minh";
        public string Language { get; set; } = "vi";
        public string HrFullName { get; set; } = string.Empty;
        public string HrEmail { get; set; } = string.Empty;
        public string HrPassword { get; set; } = string.Empty;
        public string ConfirmPassword { get; set; } = string.Empty;
    }

    public class CreateCompanyRequest
    {
        public string CompanyName { get; set; } = string.Empty;
        public string EmailDomain { get; set; } = string.Empty;
        public string Timezone { get; set; } = "Asia/Ho_Chi_Minh";
        public string Language { get; set; } = "vi";
        public string HrEmail { get; set; } = string.Empty;
        public string? HrFullName { get; set; }
        public bool AllowExternalHrEmail { get; set; }
    }




    public class WorkspaceOption
    {
        public Guid? CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public string? EmailDomain { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
    }

    public class InvitePreviewResponse
    {
        public string Email { get; set; } = string.Empty;
        public string? FullName { get; set; }
        public string? Position { get; set; }
        public Guid CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
    }

    public class InviteResponse
    {
        public Guid Id { get; set; }
        public string Email { get; set; } = string.Empty;
        public Guid CompanyId { get; set; }
        public string CompanyName { get; set; } = string.Empty;
        public string Status { get; set; } = string.Empty;
        public DateTime ExpiresAt { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
        public string InviteLink { get; set; } = string.Empty;
        public bool EmailSent { get; set; }
        public string EmailDeliveryMessage { get; set; } = string.Empty;
    }

    public class CompanyResponse
    {
        public Guid Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string EmailDomain { get; set; } = string.Empty;
        public string Timezone { get; set; } = string.Empty;
        public string Language { get; set; } = string.Empty;
    }

    public class CompanyOnboardingResponse
    {
        public CompanyResponse Company { get; set; } = new();
        public InviteResponse HrInvite { get; set; } = new();
    }

    public class TwoFactorVerifyRequest
    {
        public string Code { get; set; } = string.Empty;
    }

    public class UserSessionResponse
    {
        public Guid Id { get; set; }
        public string? DeviceInfo { get; set; }
        public string? IpAddress { get; set; }
        public bool IsActive { get; set; }
        public DateTime ExpiresAt { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? RevokedAt { get; set; }
    }

    public class AuthResponse
    {
        public string Token { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public string UserId { get; set; } = string.Empty;
        public string UserName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public Guid? CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
        public bool RequiresWorkspaceSelection { get; set; }
        public bool RequiresTwoFactor { get; set; }
        public IList<WorkspaceOption> Workspaces { get; set; } = new List<WorkspaceOption>();
    }

    public class UserInfoResponse
    {
        public string UserName { get; set; } = string.Empty;
        public string FullName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public Guid? CompanyId { get; set; }
        public string? CompanyName { get; set; }
        public IList<string> Roles { get; set; } = new List<string>();
    }

}
