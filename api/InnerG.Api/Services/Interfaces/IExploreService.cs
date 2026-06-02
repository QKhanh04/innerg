using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InnerG.Api.DTOs;

namespace InnerG.Api.Services.Interfaces
{
    public interface IExploreService
    {
        Task<List<ExploreClassDto>> GetExploreClassesAsync(Guid companyId, Guid userId);
        Task<string> RegisterClassAsync(Guid companyId, Guid userId, Guid eventId);
        Task<bool> UnregisterClassAsync(Guid companyId, Guid userId, Guid eventId);
        Task<ExploreClassDetailDto?> GetExploreClassDetailAsync(Guid companyId, Guid userId, Guid eventId);
        Task<MenteeDashboardDto> GetMenteeDashboardAsync(Guid companyId, Guid userId);
    }
}
