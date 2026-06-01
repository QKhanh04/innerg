using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Exceptions;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InnerG.Api.Services.Implementations
{
    public class HrMeetingRoomService : IHrMeetingRoomService
    {
        private readonly AppDbContext _context;

        public HrMeetingRoomService(AppDbContext context)
        {
            _context = context;
        }

        private static MeetingRoomDto Map(MeetingRoom r)
        {
            var facilities = string.IsNullOrWhiteSpace(r.FacilitiesJson)
                ? new List<string>()
                : JsonSerializer.Deserialize<List<string>>(r.FacilitiesJson) ?? new List<string>();

            return new MeetingRoomDto
            {
                Id = r.Id,
                Name = r.Name,
                Location = r.Location,
                Capacity = r.Capacity,
                Facilities = facilities,
                IsActive = r.IsActive
            };
        }

        public async Task<List<MeetingRoomDto>> GetAllAsync(Guid companyId) =>
            (await _context.MeetingRooms.Where(r => r.CompanyId == companyId).ToListAsync())
            .Select(Map).ToList();

        public async Task<MeetingRoomDto> GetByIdAsync(Guid id, Guid companyId)
        {
            var room = await _context.MeetingRooms
                .FirstOrDefaultAsync(r => r.Id == id && r.CompanyId == companyId)
                ?? throw new BusinessException("ROOM_NOT_FOUND", "Không tìm thấy phòng.", 404);
            return Map(room);
        }

        public async Task<List<MeetingRoomDto>> GetAvailableAsync(Guid companyId, RoomAvailabilityQuery query)
        {
            var busyRoomIds = await _context.TrainingSessions
                .Where(s => s.CompanyId == companyId && s.MeetingRoomId != null &&
                    s.StartTime < query.To && s.EndTime > query.From)
                .Select(s => s.MeetingRoomId!.Value)
                .Distinct()
                .ToListAsync();

            var rooms = await _context.MeetingRooms
                .Where(r => r.CompanyId == companyId && r.IsActive && !busyRoomIds.Contains(r.Id))
                .ToListAsync();

            return rooms.Select(Map).ToList();
        }

        public async Task<MeetingRoomDto> CreateAsync(Guid companyId, MeetingRoomRequest request)
        {
            var room = new MeetingRoom
            {
                CompanyId = companyId,
                Name = request.Name,
                Location = request.Location,
                Capacity = request.Capacity,
                FacilitiesJson = JsonSerializer.Serialize(request.Facilities ?? new List<string>()),
                IsActive = request.IsActive
            };
            _context.MeetingRooms.Add(room);
            await _context.SaveChangesAsync();
            return Map(room);
        }

        public async Task<MeetingRoomDto> UpdateAsync(Guid id, Guid companyId, MeetingRoomRequest request)
        {
            var room = await _context.MeetingRooms
                .FirstOrDefaultAsync(r => r.Id == id && r.CompanyId == companyId)
                ?? throw new BusinessException("ROOM_NOT_FOUND", "Không tìm thấy phòng.", 404);

            room.Name = request.Name;
            room.Location = request.Location;
            room.Capacity = request.Capacity;
            room.FacilitiesJson = JsonSerializer.Serialize(request.Facilities ?? new List<string>());
            room.IsActive = request.IsActive;
            await _context.SaveChangesAsync();
            return Map(room);
        }

        public async Task DeleteAsync(Guid id, Guid companyId)
        {
            var room = await _context.MeetingRooms
                .FirstOrDefaultAsync(r => r.Id == id && r.CompanyId == companyId)
                ?? throw new BusinessException("ROOM_NOT_FOUND", "Không tìm thấy phòng.", 404);
            room.DeletedAt = DateTime.UtcNow;
            room.IsActive = false;
            await _context.SaveChangesAsync();
        }
    }
}
