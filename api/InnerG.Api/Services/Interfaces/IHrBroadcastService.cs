using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;

namespace InnerG.Api.Services.Interfaces
{
    public interface IHrBroadcastService
    {
        Task<int> BroadcastAsync(Guid companyId, BroadcastNotificationRequest request);
        Task<List<NotificationHistoryDto>> GetHistoryAsync(Guid companyId);
    }
}
