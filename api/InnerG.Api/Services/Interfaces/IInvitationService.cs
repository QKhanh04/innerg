using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InnerG.Api.DTOs;
using Microsoft.AspNetCore.Http;

namespace InnerG.Api.Services.Interfaces
{
    public interface IInvitationService
    {
        Task<InviteResponse> CreateInviteAsync(CreateInviteRequest request, string inviterUserId, Guid? currentCompanyId, bool isSystemAdmin, bool allowExternalEmail = false);
        Task<BulkInviteResponse> CreateBulkInvitesAsync(BulkInviteRequest request, string inviterUserId, Guid? currentCompanyId, bool isSystemAdmin);
        Task<InviteResponse> ResendInviteAsync(Guid inviteId, string inviterUserId, Guid? currentCompanyId, bool isSystemAdmin);
        Task RevokeInviteAsync(Guid inviteId, string actorUserId, Guid? currentCompanyId, bool isSystemAdmin);
        Task RevokeBulkInvitesAsync(BulkRevokeRequest request, string actorUserId, Guid? currentCompanyId, bool isSystemAdmin);
        Task<PaginatedResponse<InviteListItemResponse>> GetInvitesAsync(InviteListQuery query, Guid companyId, bool isSystemAdmin);
        Task<ValidateFileResult> ValidateInviteFileAsync(IFormFile file, Guid companyId);
    }
}
