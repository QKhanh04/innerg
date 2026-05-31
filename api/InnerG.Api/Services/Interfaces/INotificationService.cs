using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using InnerG.Api.Models;

namespace InnerG.Api.Services.Interfaces
{
    public interface INotificationService
    {
        Task SendAsync(
            Guid userId,
            string type,
            string title,
            string body,
            NotificationChannel channel = NotificationChannel.Push,
            string? referenceType = null,
            Guid? referenceId = null);

        Task SendToManyAsync(
            IEnumerable<Guid> userIds,
            string type,
            string title,
            string body,
            NotificationChannel channel = NotificationChannel.Push,
            string? referenceType = null,
            Guid? referenceId = null);
    }

}
