using System.Collections.Generic;
using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Models;

namespace InnerG.Api.Services.Interfaces
{
    public interface IHrModerationService
    {
        Task<List<HrPendingEventDto>> GetPendingEventsAsync(Guid companyId, TrainingEventStatus? status = null);
        Task ReviewEventAsync(Guid eventId, Guid companyId, Guid hrUserId, ReviewEventRequest request);
        Task<List<HrPendingResourceDto>> GetPendingResourcesAsync(Guid companyId);
        Task ReviewResourceAsync(Guid resourceId, Guid companyId, Guid hrUserId, ReviewResourceRequest request);
        Task<HrModerationEscalationDto> CreateEscalationReportAsync(Guid companyId, Guid hrUserId, CreateModerationEscalationRequest request);
        Task<List<HrModerationEscalationDto>> GetEscalationReportsAsync(Guid companyId);
        Task<List<HrModerationReportCenterItemDto>> GetModerationReportCenterAsync(Guid companyId);
    }
}
