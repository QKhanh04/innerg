using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InnerG.Api.Services.Implementations
{
    public class HrBroadcastService : IHrBroadcastService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public HrBroadcastService(AppDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<int> BroadcastAsync(Guid companyId, BroadcastNotificationRequest request)
        {
            if (request.ScheduledAt.HasValue && request.ScheduledAt > DateTime.UtcNow)
            {
                // Scheduled broadcasts would be enqueued via background job; send immediately for now.
            }

            IQueryable<AppUser> usersQuery = _context.Users
                .Where(u => u.CompanyId == companyId && u.IsActive && u.DeletedAt == null);

            if (request.TargetType.Equals("Department", StringComparison.OrdinalIgnoreCase)
                && request.TargetDepartmentIds?.Count > 0)
            {
                usersQuery = usersQuery.Where(u =>
                    u.DepartmentId != null && request.TargetDepartmentIds.Contains(u.DepartmentId.Value));
            }

            var userIds = await usersQuery.Select(u => u.Id).ToListAsync();
            Console.WriteLine($"[HrBroadcastService] Found {userIds.Count} users for company {companyId} to broadcast.");

            await _notificationService.SendToManyAsync(
                userIds,
                "HR_BROADCAST",
                request.Title,
                request.Body,
                request.Channel,
                request.ReferenceType,
                request.ReferenceId);

            return userIds.Count;
        }

        public async Task<List<NotificationHistoryDto>> GetHistoryAsync(Guid companyId)
        {
            var userIds = await _context.Users
                .Where(u => u.CompanyId == companyId)
                .Select(u => u.Id)
                .ToListAsync();

            return await _context.Notifications
                .Where(n => userIds.Contains(n.UserId) && n.Type == "HR_BROADCAST")
                .GroupBy(n => new { n.Title, n.Body, n.SentAt })
                .OrderByDescending(g => g.Key.SentAt)
                .Take(50)
                .Select(g => new NotificationHistoryDto
                {
                    Id = g.First().Id,
                    Type = "HR_BROADCAST",
                    Title = g.Key.Title,
                    Body = g.Key.Body,
                    SentAt = g.Key.SentAt,
                    RecipientCount = g.Count()
                })
                .ToListAsync();
        }
    }
}
