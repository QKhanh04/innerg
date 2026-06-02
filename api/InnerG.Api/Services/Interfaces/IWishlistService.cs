using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InnerG.Api.DTOs;

namespace InnerG.Api.Services.Interfaces
{
    public interface IWishlistService
    {
        Task<List<WishlistDto>> GetWishlistAsync(Guid companyId, Guid userId);
        Task<WishlistDto> CreateWishlistAsync(Guid companyId, Guid userId, CreateWishlistRequest request);
        Task<WishlistVoteResultDto> ToggleVoteAsync(Guid companyId, Guid userId, Guid id);
    }
}
