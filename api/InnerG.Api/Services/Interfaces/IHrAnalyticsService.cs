using System;
using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;

namespace InnerG.Api.Services.Interfaces
{
    public interface IHrAnalyticsService
    {
        Task<HrAnalyticsOverviewDto> GetOverviewAsync(Guid companyId, HrDateRangeQuery query);
        Task<HrChartsDto> GetChartsAsync(Guid companyId, HrChartsQuery query);
        Task<HrSkillMapDto> GetSkillMapAsync(Guid companyId);
    }
}
