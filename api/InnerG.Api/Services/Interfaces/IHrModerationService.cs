using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;

namespace InnerG.Api.Services.Interfaces
{
    public interface IHrModerationService
    {
        Task<List<HrPendingEventDto>> GetPendingEventsAsync(Guid companyId);
        Task ReviewEventAsync(Guid eventId, Guid companyId, Guid hrUserId, ReviewEventRequest request);
        Task<List<HrPendingResourceDto>> GetPendingResourcesAsync(Guid companyId);
        Task ReviewResourceAsync(Guid resourceId, Guid companyId, ReviewResourceRequest request);
    }
}
