using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;

namespace InnerG.Api.Services.Interfaces
{
    public interface IHrReportsService
    {
        Task<List<HrEventReportDto>> GetEventReportsAsync(Guid companyId, HrDateRangeQuery query, Guid? departmentId);
        Task<HrEventDetailReportDto> GetEventDetailAsync(Guid eventId, Guid companyId);
        Task<HrMemberReportDto> GetMemberReportAsync(Guid userId, Guid companyId);
        Task<byte[]> ExportEventsCsvAsync(Guid companyId, HrDateRangeQuery query);
        Task<byte[]> ExportMembersCsvAsync(Guid companyId);
    }
}
