using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;

namespace InnerG.Api.Services.Interfaces
{
    public interface IHrWishlistService
    {
        Task<List<HrWishlistItemDto>> GetWishlistsAsync(Guid companyId, HrWishlistQuery query);
        Task UpdateStatusAsync(Guid wishlistId, Guid companyId, Guid hrUserId, UpdateWishlistStatusRequest request);
        Task AssignTrainerAsync(Guid wishlistId, Guid companyId, Guid hrUserId, AssignTrainerRequest request);
        Task LinkEventAsync(Guid wishlistId, Guid companyId, Guid hrUserId, LinkEventRequest request);
        Task<List<SuggestedTrainerDto>> SuggestTrainersAsync(Guid wishlistId, Guid companyId);
    }
}
