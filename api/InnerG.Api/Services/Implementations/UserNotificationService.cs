using System;
using System.Linq;
using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.DTOs;
using InnerG.Api.Exceptions;
using InnerG.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InnerG.Api.Services.Implementations
{
    public class UserNotificationService : IUserNotificationService
    {
        private readonly AppDbContext _context;

        public UserNotificationService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<NotificationListResponse> GetNotificationsAsync(Guid userId, int limit = 20, bool unreadOnly = false)
        {
            limit = Math.Clamp(limit, 1, 100);

            var query = _context.Notifications
                .Where(n => n.UserId == userId);

            if (unreadOnly)
                query = query.Where(n => !n.IsRead);

            var unreadCount = await _context.Notifications
                .CountAsync(n => n.UserId == userId && !n.IsRead);

            var items = await query
                .OrderByDescending(n => n.SentAt ?? n.CreatedAt)
                .Take(limit)
                .Select(n => new NotificationItemDto
                {
                    Id = n.Id,
                    Type = n.Type,
                    Title = n.Title,
                    Body = n.Body,
                    IsRead = n.IsRead,
                    SentAt = n.SentAt,
                    ReferenceType = n.ReferenceType,
                    ReferenceId = n.ReferenceId
                })
                .ToListAsync();

            return new NotificationListResponse
            {
                Items = items,
                UnreadCount = unreadCount
            };
        }

        public async Task<int> GetUnreadCountAsync(Guid userId) =>
            await _context.Notifications.CountAsync(n => n.UserId == userId && !n.IsRead);

        public async Task MarkAsReadAsync(Guid userId, Guid notificationId)
        {
            var notification = await _context.Notifications
                .FirstOrDefaultAsync(n => n.Id == notificationId && n.UserId == userId);

            if (notification == null)
                throw new BusinessException("NOTIFICATION_NOT_FOUND", "Không tìm thấy thông báo.", 404);

            notification.IsRead = true;
            notification.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task MarkAllAsReadAsync(Guid userId)
        {
            var unread = await _context.Notifications
                .Where(n => n.UserId == userId && !n.IsRead)
                .ToListAsync();

            if (unread.Count == 0) return;

            var now = DateTime.UtcNow;
            foreach (var notification in unread)
            {
                notification.IsRead = true;
                notification.UpdatedAt = now;
            }

            await _context.SaveChangesAsync();
        }
    }
}
