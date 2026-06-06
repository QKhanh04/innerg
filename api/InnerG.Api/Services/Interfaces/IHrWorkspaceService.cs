using System;
using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;

namespace InnerG.Api.Services.Interfaces
{
    public interface IHrWorkspaceService
    {
        Task<WorkspaceSettingsDto> GetSettingsAsync(Guid companyId);
        Task<WorkspaceSettingsDto> UpdateSettingsAsync(Guid companyId, WorkspaceSettingsDto request);
    }
}
