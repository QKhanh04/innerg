using System;
using System.Threading.Tasks;
using InnerG.Api.DTOs;

namespace InnerG.Api.Services.Interfaces
{
    public interface IMemberService
    {
        Task<PaginatedResponse<MemberResponse>> GetMembersAsync(MemberListQuery query, Guid companyId);
        Task<MemberDetailResponse> GetMemberDetailAsync(Guid userId, Guid companyId);
        Task UpdateMemberAsync(Guid userId, Guid companyId, Guid currentUserId, UpdateMemberRequest request);
        Task AssignMentorRoleAsync(Guid userId, Guid companyId, Guid currentUserId);
        Task RevokeMentorRoleAsync(Guid userId, Guid companyId, Guid currentUserId);
        Task UpdateMemberStatusAsync(Guid userId, Guid companyId, Guid currentUserId, UpdateMemberStatusRequest request);
        Task DeleteMemberAsync(Guid userId, Guid companyId, Guid currentUserId);
        Task<byte[]> ExportMembersCsvAsync(MemberListQuery query, Guid companyId);
    }
}
