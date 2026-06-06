using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using InnerG.Api.DTOs;
using InnerG.Api.Models;
using InnerG.Api.Repositories.Interfaces;
using InnerG.Api.Services.Interfaces;

namespace InnerG.Api.Services.Implementations
{
    public class FeedbackService : IFeedbackService
    {
        private readonly IUnitOfWork _unitOfWork;

        public FeedbackService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<List<CriteriaDto>> GetLearnerCriteriaAsync(Guid companyId)
        {
            return await _unitOfWork.Repository<FeedbackCriteria>().GetQueryable()
                .Where(c => c.IsActive && (c.CompanyId == null || c.CompanyId == companyId))
                .Where(c => c.AppliesTo == CriteriaAppliesTo.Trainer || c.AppliesTo == CriteriaAppliesTo.Both)
                .OrderBy(c => c.DisplayOrder)
                .Select(c => new CriteriaDto
                {
                    Id = c.Id,
                    Name = c.Name,
                    Description = c.Description
                })
                .ToListAsync();
        }

        public async Task<bool> SubmitFeedbackAsync(Guid companyId, Guid userId, Guid eventId, SubmitFeedbackRequestDto request)
        {
            var trainingEvent = await _unitOfWork.Repository<TrainingEvent>().GetQueryable()
                .Include(e => e.Enrollments)
                .Include(e => e.Sessions)
                .FirstOrDefaultAsync(e => e.Id == eventId && e.CompanyId == companyId);

            if (trainingEvent == null)
                return false;

            // Must be enrolled and confirmed
            var enrollment = trainingEvent.Enrollments.FirstOrDefault(e => e.UserId == userId && e.Status == EnrollmentStatus.Confirmed);
            if (enrollment == null)
                throw new Exception("You are not confirmed for this class.");

            if (trainingEvent.Status != TrainingEventStatus.Completed && trainingEvent.EndDate > DateTime.UtcNow)
                throw new Exception("Class must be completed before you can leave a review.");

            // Check if already reviewed
            var existingFeedback = await _unitOfWork.Repository<Feedback>().GetQueryable()
                .FirstOrDefaultAsync(f => f.TrainingEventId == eventId && f.ReviewerUserId == userId);
            if (existingFeedback != null)
                throw new Exception("You have already reviewed this class.");

            var session = trainingEvent.Sessions.FirstOrDefault(); // Associate with first session for now

            var feedback = new Feedback
            {
                Id = Guid.NewGuid(),
                TrainingEventId = eventId,
                TrainingSessionId = session?.Id ?? Guid.Empty, // Require session ID based on model
                ReviewerUserId = userId,
                RevieweeTrainerId = trainingEvent.TrainerId,
                ReviewerRole = ReviewerRole.Learner,
                OverallRating = request.OverallRating,
                Comment = request.Comment,
                IsAnonymous = request.IsAnonymous,
                Responses = request.CriteriaScores.Select(cs => new FeedbackResponse
                {
                    Id = Guid.NewGuid(),
                    CriteriaId = cs.Key,
                    Score = cs.Value
                }).ToList()
            };

            contextFixForSessionId(feedback, session); // Helper call

            await _unitOfWork.Repository<Feedback>().AddAsync(feedback);
            await _unitOfWork.CommitAsync();
            return true;
        }

        private void contextFixForSessionId(Feedback f, TrainingSession? s)
        {
            if (s == null)
            {
                f.TrainingSessionId = f.TrainingEventId; // Fallback to avoid error if no session
            }
        }

        public async Task<List<FeedbackResponseDto>> GetEventFeedbacksAsync(Guid companyId, Guid eventId)
        {
            var feedbacks = await _unitOfWork.Repository<Feedback>().GetQueryable()
                .Include(f => f.Reviewer)
                .Include(f => f.Responses)
                    .ThenInclude(r => r.Criteria)
                .Where(f => f.TrainingEventId == eventId && f.TrainingEvent.CompanyId == companyId)
                .OrderByDescending(f => f.CreatedAt)
                .ToListAsync();

            return feedbacks.Select(f => new FeedbackResponseDto
            {
                Id = f.Id,
                ReviewerName = f.IsAnonymous ? "Anonymous Learner" : f.Reviewer.FullName,
                ReviewerAvatarUrl = f.IsAnonymous ? null : null, // Avatar logic
                OverallRating = f.OverallRating,
                Comment = f.Comment,
                CreatedAt = f.CreatedAt,
                CriteriaScores = f.Responses.ToDictionary(r => r.Criteria.Name, r => r.Score)
            }).ToList();
        }
    }
}
