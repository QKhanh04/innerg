using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;

namespace InnerG.Api.Services.Interfaces
{
    public interface IHrMeetingRoomService
    {
        Task<List<MeetingRoomDto>> GetAllAsync(Guid companyId);
        Task<MeetingRoomDto> GetByIdAsync(Guid id, Guid companyId);
        Task<List<MeetingRoomDto>> GetAvailableAsync(Guid companyId, RoomAvailabilityQuery query);
        Task<MeetingRoomDto> CreateAsync(Guid companyId, MeetingRoomRequest request);
        Task<MeetingRoomDto> UpdateAsync(Guid id, Guid companyId, MeetingRoomRequest request);
        Task DeleteAsync(Guid id, Guid companyId);
    }
}
