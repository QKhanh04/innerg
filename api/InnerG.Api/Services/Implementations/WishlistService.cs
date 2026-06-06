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
    public class WishlistService : IWishlistService
    {
        private readonly IUnitOfWork _unitOfWork;

        public WishlistService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<List<WishlistDto>> GetWishlistAsync(Guid companyId, Guid userId)
        {
            // Retrieve all company wishlists
            var wishlistItems = await _unitOfWork.Repository<LearningWishlist>().GetQueryable()
                .IgnoreQueryFilters()
                .Where(w => w.CompanyId == companyId)
                .Include(w => w.User)
                .OrderByDescending(w => w.VoteCount)
                .ToListAsync();

            // Retrieve all votes for this company's wishlists to populate voters and toggle status
            var allWishlistIds = wishlistItems.Select(w => w.Id).ToList();
            var votes = await _unitOfWork.Repository<WishlistVote>().GetQueryable()
                .IgnoreQueryFilters()
                .Where(v => allWishlistIds.Contains(v.WishlistId) && v.DeletedAt == null)
                .Include(v => v.User)
                .ToListAsync();

            var dtoList = new List<WishlistDto>();

            foreach (var item in wishlistItems)
            {
                var isVoted = votes.Any(v => v.WishlistId == item.Id && v.UserId == userId);
                
                // Top 4 voters' avatars
                var topVoters = votes
                    .Where(v => v.WishlistId == item.Id)
                    .Select(v => v.User?.AvatarUrl ?? $"https://api.dicebear.com/7.x/adventurer/svg?seed={v.User?.UserName ?? "User"}")
                    .Take(4)
                    .ToList();

                // Status Mapping
                string statusStr = "pending";
                if (item.Status == WishlistStatus.FindingTrainer) statusStr = "in-review";
                else if (item.Status == WishlistStatus.Scheduled || item.Status == WishlistStatus.Completed) statusStr = "approved";
                else if (item.Status == WishlistStatus.Rejected) statusStr = "rejected";

                // Dynamic HrNote based on Status and RejectionReason
                string? hrNote = null;
                if (item.Status == WishlistStatus.Rejected)
                {
                    hrNote = item.RejectionReason ?? "Rejected by HR.";
                }
                else if (item.Status == WishlistStatus.Scheduled)
                {
                    hrNote = "Workshop scheduled! Mentee can register from the explore dashboard now.";
                }
                else if (item.Status == WishlistStatus.FindingTrainer)
                {
                    hrNote = "HR is actively looking for a mentor to host this workshop! Stay tuned.";
                }

                // Normalize category
                string rawCat = item.Category ?? "Technical";
                string normalizedCat = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(rawCat.Trim().ToLower());
                if (normalizedCat == "Soft Skill" || normalizedCat == "Soft Skills")
                {
                    normalizedCat = "Soft Skills";
                }

                dtoList.Add(new WishlistDto
                {
                    Id = item.Id,
                    Title = item.SkillNameCustom ?? "Untitled Skill Request",
                    Description = item.Description ?? string.Empty,
                    Category = normalizedCat,
                    ProposedBy = item.User?.FullName ?? "Unknown Member",
                    ProposedByAvatar = item.User?.AvatarUrl ?? $"https://api.dicebear.com/7.x/adventurer/svg?seed={item.User?.FullName ?? "User"}",
                    Votes = item.VoteCount,
                    Voted = isVoted,
                    Status = statusStr,
                    CommentsCount = (item.VoteCount % 3) * 4 + 2,
                    Voters = topVoters,
                    HrNote = hrNote
                });
            }

            return dtoList;
        }

        public async Task<WishlistDto> CreateWishlistAsync(Guid companyId, Guid userId, CreateWishlistRequest request)
        {
            if (string.IsNullOrEmpty(request.Title) || string.IsNullOrEmpty(request.Description))
            {
                throw new ArgumentException("Title and Description are required.");
            }

            // Normalize category
            string rawCat = request.Category ?? "Technical";
            string normalizedCat = System.Globalization.CultureInfo.CurrentCulture.TextInfo.ToTitleCase(rawCat.Trim().ToLower());
            if (normalizedCat == "Soft Skill" || normalizedCat == "Soft Skills")
            {
                normalizedCat = "Soft Skills";
            }

            var wishlist = new LearningWishlist
            {
                Id = Guid.NewGuid(),
                CompanyId = companyId,
                UserId = userId,
                SkillNameCustom = request.Title,
                Category = normalizedCat,
                Description = request.Description,
                Reason = request.Reason,
                Status = WishlistStatus.Pending,
                VoteCount = 1
            };

            await _unitOfWork.Repository<LearningWishlist>().AddAsync(wishlist);

            // Auto-cast initial vote by the proposer
            var vote = new WishlistVote
            {
                Id = Guid.NewGuid(),
                WishlistId = wishlist.Id,
                UserId = userId
            };
            await _unitOfWork.Repository<WishlistVote>().AddAsync(vote);

            await _unitOfWork.CommitAsync();

            // Eagerly fetch the creator user profile
            var user = await _unitOfWork.Repository<AppUser>().GetByIdAsync(userId);

            return new WishlistDto
            {
                Id = wishlist.Id,
                Title = wishlist.SkillNameCustom,
                Description = wishlist.Description,
                Category = wishlist.Category,
                ProposedBy = user?.FullName ?? "You",
                ProposedByAvatar = user?.AvatarUrl ?? $"https://api.dicebear.com/7.x/adventurer/svg?seed={user?.FullName ?? "User"}",
                Votes = 1,
                Voted = true,
                Status = "pending",
                CommentsCount = 0,
                Voters = new List<string> { user?.AvatarUrl ?? "https://api.dicebear.com/7.x/adventurer/svg?seed=You" },
                HrNote = null
            };
        }

        public async Task<WishlistVoteResultDto> ToggleVoteAsync(Guid companyId, Guid userId, Guid id)
        {
            var wishlist = await _unitOfWork.Repository<LearningWishlist>().GetQueryable()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(w => w.Id == id && w.CompanyId == companyId);

            if (wishlist == null)
            {
                throw new KeyNotFoundException("Wishlist proposal not found.");
            }

            var existingVote = await _unitOfWork.Repository<WishlistVote>().GetQueryable()
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(v => v.WishlistId == id && v.UserId == userId);

            if (existingVote != null && existingVote.DeletedAt == null)
            {
                // Active vote exists -> Soft delete it (Remove Vote)
                await _unitOfWork.Repository<WishlistVote>().DeleteAsync(existingVote);
                wishlist.VoteCount = Math.Max(1, wishlist.VoteCount - 1);
                await _unitOfWork.Repository<LearningWishlist>().UpdateAsync(wishlist);
                await _unitOfWork.CommitAsync();
                return new WishlistVoteResultDto { Voted = false, Votes = wishlist.VoteCount, Message = "Vote removed successfully." };
            }
            else if (existingVote != null && existingVote.DeletedAt != null)
            {
                // Soft-deleted vote exists -> Restore it (Add Vote)
                existingVote.DeletedAt = null;
                existingVote.CreatedAt = DateTime.UtcNow; // Update timestamp
                await _unitOfWork.Repository<WishlistVote>().UpdateAsync(existingVote);
                wishlist.VoteCount += 1;
                await _unitOfWork.Repository<LearningWishlist>().UpdateAsync(wishlist);
                await _unitOfWork.CommitAsync();
                return new WishlistVoteResultDto { Voted = true, Votes = wishlist.VoteCount, Message = "Vote cast successfully." };
            }
            else
            {
                // No vote record exists -> Create new (Add Vote)
                var newVote = new WishlistVote
                {
                    Id = Guid.NewGuid(),
                    WishlistId = id,
                    UserId = userId
                };
                await _unitOfWork.Repository<WishlistVote>().AddAsync(newVote);
                wishlist.VoteCount += 1;
                await _unitOfWork.Repository<LearningWishlist>().UpdateAsync(wishlist);
                await _unitOfWork.CommitAsync();
                return new WishlistVoteResultDto { Voted = true, Votes = wishlist.VoteCount, Message = "Vote cast successfully." };
            }
        }
    }
}
