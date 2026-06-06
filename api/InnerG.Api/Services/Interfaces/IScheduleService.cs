using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InnerG.Api.DTOs;

namespace InnerG.Api.Services.Interfaces
{
    public interface IScheduleService
    {
        Task<List<CalendarEventDto>> GetPersonalScheduleAsync(Guid companyId, Guid userId, DateTime? startDate, DateTime? endDate);
    }
}
