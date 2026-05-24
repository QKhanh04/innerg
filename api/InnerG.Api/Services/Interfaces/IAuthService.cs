using InnerG.Api.DTOs;
using static InnerG.Api.DTOs.GoogleAuthDTO;

namespace InnerG.Api.Services.Interfaces
{
    public interface IAuthService
    {
        Task<AuthResponse> BootstrapCompanyAsync(BootstrapCompanyRequest request);
        Task<CompanyOnboardingResponse> CreateCompanyAsync(CreateCompanyRequest request, string systemAdminUserId);
        Task<InviteResponse> CreateInviteAsync(CreateInviteRequest request, string inviterUserId, Guid? currentCompanyId, bool isSystemAdmin);
        Task<BulkInviteResponse> CreateBulkInvitesAsync(BulkInviteRequest request, string inviterUserId, Guid? currentCompanyId, bool isSystemAdmin);
        Task<InviteResponse> ResendInviteAsync(Guid inviteId, string inviterUserId, Guid? currentCompanyId, bool isSystemAdmin);
        Task RevokeInviteAsync(Guid inviteId, string actorUserId, Guid? currentCompanyId, bool isSystemAdmin);
        Task<InvitePreviewResponse> GetInviteAsync(string token);
        Task<AuthResponse> AcceptInviteAsync(AcceptInviteRequest request);
        Task<AuthResponse> LoginAsync(LoginRequest request);
        Task<AuthResponse> RefreshTokenAsync(string refreshToken);
        Task ForgotPasswordAsync(ForgotPasswordRequest request);
        Task ResetPasswordAsync(ResetPasswordRequest request);
        Task SendTwoFactorEnableCodeAsync(string userId);
        Task EnableTwoFactorAsync(string userId, TwoFactorVerifyRequest request);
        Task DisableTwoFactorAsync(string userId, TwoFactorVerifyRequest request);
        Task<IList<UserSessionResponse>> GetSessionsAsync(string userId);
        Task RevokeSessionAsync(string userId, Guid sessionId);
        Task LogoutAsync(string refreshToken);
        Task LogoutAllAsync(string userId);
        Task<UserInfoResponse> GetCurrentUserInfoAsync(string userId, Guid? companyId);
        Task ConfirmEmailAsync(string userId, string token);
        Task ResendConfirmEmailAsync(string email);
        Task<AuthResponse> LoginWithGoogleAsync(string idToken, Guid? companyId);
        Task<GoogleUserInfo> VerifyGoogleTokenAsync(string idToken);
    }
}
