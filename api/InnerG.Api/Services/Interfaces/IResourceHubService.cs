using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InnerG.Api.DTOs;

namespace InnerG.Api.Services.Interfaces
{
    public interface IResourceHubService
    {
        Task<IEnumerable<ResourceHubItemDto>> GetResourcesAsync(Guid companyId, Guid userId, string userRole);
    }
}
