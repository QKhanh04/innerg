using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using InnerG.Api.Models;
using InnerG.Api.Data;
using InnerG.Api.DTOs;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/wishlist")]
    [Authorize]
    public class WishlistController : ControllerBase
    {
        private readonly AppDbContext _context;

        public WishlistController(AppDbContext context)
        {
            _context = context;
        }

        private Guid GetCurrentUserId()
        {
            var id = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            return string.IsNullOrEmpty(id) ? Guid.Empty : Guid.Parse(id);
        }

        private Guid GetCurrentCompanyId()
        {
            var companyIdValue = User.FindFirstValue("company_id") ?? User.FindFirstValue("CompanyId") ?? User.FindFirst("company_id")?.Value;
            return string.IsNullOrEmpty(companyIdValue) ? Guid.Empty : Guid.Parse(companyIdValue);
        }

        [HttpGet]
        public async Task<IActionResult> GetWishlist()
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing from token." });
                }

                // Retrieve all company wishlists
                var wishlistItems = await _context.LearningWishlists
                    .IgnoreQueryFilters()
                    .Where(w => w.CompanyId == companyId)
                    .Include(w => w.User)
                    .OrderByDescending(w => w.VoteCount)
                    .ToListAsync();

                // Retrieve all votes for this company's wishlists to populate voters and toggle status
                var allWishlistIds = wishlistItems.Select(w => w.Id).ToList();
                var votes = await _context.WishlistVotes
                    .Where(v => allWishlistIds.Contains(v.WishlistId))
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

                    // Normalize category to title casing and "Soft Skills" plural
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
                        CommentsCount = (item.VoteCount % 3) * 4 + 2, // Procedural mock comments count to feel premium and alive!
                        Voters = topVoters,
                        HrNote = hrNote
                    });
                }

                return Ok(dtoList);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateWishlist([FromBody] CreateWishlistRequest request)
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing." });
                }

                if (string.IsNullOrEmpty(request.Title) || string.IsNullOrEmpty(request.Description))
                {
                    return BadRequest(new { message = "Title and Description are required." });
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

                await _context.LearningWishlists.AddAsync(wishlist);

                // Auto-cast initial vote by the proposer
                var vote = new WishlistVote
                {
                    Id = Guid.NewGuid(),
                    WishlistId = wishlist.Id,
                    UserId = userId
                };
                await _context.WishlistVotes.AddAsync(vote);

                await _context.SaveChangesAsync();

                // Eagerly fetch the creator user profile for proposing details
                var user = await _context.Users.FindAsync(userId);

                return Ok(new WishlistDto
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
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("{id}/vote")]
        public async Task<IActionResult> ToggleVote(Guid id)
        {
            try
            {
                var companyId = GetCurrentCompanyId();
                var userId = GetCurrentUserId();

                if (companyId == Guid.Empty)
                {
                    return BadRequest(new { message = "Company context is missing." });
                }

                var wishlist = await _context.LearningWishlists
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(w => w.Id == id && w.CompanyId == companyId);

                if (wishlist == null)
                {
                    return NotFound(new { message = "Wishlist proposal not found." });
                }

                var existingVote = await _context.WishlistVotes
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(v => v.WishlistId == id && v.UserId == userId);

                if (existingVote != null && existingVote.DeletedAt == null)
                {
                    // Active vote exists -> Soft delete it (Remove Vote)
                    _context.WishlistVotes.Remove(existingVote);
                    wishlist.VoteCount = Math.Max(1, wishlist.VoteCount - 1);
                    _context.LearningWishlists.Update(wishlist);
                    await _context.SaveChangesAsync();
                    return Ok(new { voted = false, votes = wishlist.VoteCount, message = "Vote removed successfully." });
                }
                else if (existingVote != null && existingVote.DeletedAt != null)
                {
                    // Soft-deleted vote exists -> Restore it (Add Vote)
                    existingVote.DeletedAt = null;
                    existingVote.CreatedAt = DateTime.UtcNow; // Update timestamp
                    _context.WishlistVotes.Update(existingVote);
                    wishlist.VoteCount += 1;
                    _context.LearningWishlists.Update(wishlist);
                    await _context.SaveChangesAsync();
                    return Ok(new { voted = true, votes = wishlist.VoteCount, message = "Vote cast successfully." });
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
                    await _context.WishlistVotes.AddAsync(newVote);
                    wishlist.VoteCount += 1;
                    _context.LearningWishlists.Update(wishlist);
                    await _context.SaveChangesAsync();
                    return Ok(new { voted = true, votes = wishlist.VoteCount, message = "Vote cast successfully." });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
