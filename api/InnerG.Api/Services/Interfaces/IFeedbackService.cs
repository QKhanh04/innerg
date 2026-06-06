using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InnerG.Api.DTOs;

namespace InnerG.Api.Services.Interfaces
{
    public interface IFeedbackService
    {
        Task<List<CriteriaDto>> GetLearnerCriteriaAsync(Guid companyId);
        Task<bool> SubmitFeedbackAsync(Guid companyId, Guid userId, Guid eventId, SubmitFeedbackRequestDto request);
        Task<List<FeedbackResponseDto>> GetEventFeedbacksAsync(Guid companyId, Guid eventId);
    }
}
