using System.Threading.Tasks;
using InnerG.Api.Models;

namespace InnerG.Api.Services.Interfaces
{
    public interface IPushNotificationService
    {
        string? GetVapidPublicKey();
        Task SendPushAsync(Guid userId, string title, string body, string? icon = null);
        Task SubscribeAsync(Guid userId, string endpoint, string p256dh, string auth, string userAgent);
        Task UnsubscribeAsync(Guid userId, string endpoint);
        Task CleanupOldSubscriptionsAsync();
    }
}