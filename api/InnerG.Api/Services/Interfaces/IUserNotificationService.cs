using System;
using System.Threading.Tasks;
using InnerG.Api.DTOs;

namespace InnerG.Api.Services.Interfaces
{
    public interface IUserNotificationService
    {
        Task<NotificationListResponse> GetNotificationsAsync(Guid userId, int limit = 20, bool unreadOnly = false);
        Task<int> GetUnreadCountAsync(Guid userId);
        Task MarkAsReadAsync(Guid userId, Guid notificationId);
        Task MarkAllAsReadAsync(Guid userId);
    }
}
