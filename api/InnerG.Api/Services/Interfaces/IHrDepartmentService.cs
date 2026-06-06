using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;

namespace InnerG.Api.Services.Interfaces
{
    public interface IHrDepartmentService
    {
        Task<List<DepartmentResponse>> GetAllAsync(Guid companyId);
        Task<DepartmentResponse> GetByIdAsync(Guid id, Guid companyId);
        Task<DepartmentStatsDto> GetStatsAsync(Guid id, Guid companyId);
        Task<DepartmentResponse> CreateAsync(Guid companyId, DepartmentRequest request);
        Task<DepartmentResponse> UpdateAsync(Guid id, Guid companyId, DepartmentRequest request);
        Task DeleteAsync(Guid id, Guid companyId);
    }
}
