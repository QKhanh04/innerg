using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InnerG.Api.DTOs.Mentor;

namespace InnerG.Api.Services.Interfaces
{
    public interface IMentorService
    {
        Task<MentorStatsResponse> GetDashboardStatsAsync(Guid userId);
        Task<AvailabilityUpdateRequest> GetAvailabilityAsync(Guid userId);
        Task UpdateAvailabilityAsync(Guid userId, AvailabilityUpdateRequest request);
        Task<List<HostedClassResponse>> GetHostedClassesAsync(Guid userId);
        Task<List<PendingEnrollmentResponse>> GetPendingEnrollmentsAsync(Guid userId);
        Task<bool> ProcessEnrollmentAsync(Guid userId, Guid enrollmentId, bool isApproved);
        Task<bool> SubmitRollCallAsync(Guid userId, Guid sessionId, RollCallRequest request);
        Task<Guid> CreateClassAsync(Guid userId, CreateClassRequest request);
        Task<bool> UpdateClassAsync(Guid userId, Guid classId, CreateClassRequest request);
        Task<bool> CancelClassAsync(Guid userId, Guid classId);
    }
}
