using System;
using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;

namespace InnerG.Api.Services.Interfaces
{
    public interface IHrEventService
    {
        Task<Guid> CreateEventAsync(Guid companyId, Guid hrUserId, HrCreateEventRequest request);
    }
}
