using System;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using WebPushClient = WebPush.WebPushClient;
using WebPushSubscription = WebPush.PushSubscription;
using WebPushVapidDetails = WebPush.VapidDetails;

namespace InnerG.Api.Services.Implementations
{
    public class PushNotificationService : IPushNotificationService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;
        private readonly WebPushClient _webPushClient;
        private readonly string? _vapidPublicKey;
        private readonly string? _vapidPrivateKey;

        public PushNotificationService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
            _webPushClient = new WebPushClient();

            _vapidPublicKey = _configuration["VAPID_PUBLIC_KEY"];
            _vapidPrivateKey = _configuration["VAPID_PRIVATE_KEY"];

            if (string.IsNullOrEmpty(_vapidPublicKey) || string.IsNullOrEmpty(_vapidPrivateKey))
            {
                Console.WriteLine("[PushNotificationService] VAPID keys not configured — Web Push disabled.");
            }
        }

        public string? GetVapidPublicKey() => _vapidPublicKey;

        public async Task SendPushAsync(Guid userId, string title, string body, string? icon = null)
        {
            if (string.IsNullOrEmpty(_vapidPublicKey) || string.IsNullOrEmpty(_vapidPrivateKey))
            {
                Console.WriteLine($"[PushNotificationService] Skipping push for user {userId} — VAPID not configured.");
                return;
            }

            var subscriptions = await _context.PushSubscriptions
                .IgnoreQueryFilters()
                .Where(s => s.UserId == userId && s.DeletedAt == null)
                .ToListAsync();

            if (!subscriptions.Any())
            {
                Console.WriteLine($"[PushNotificationService] No push subscriptions found for user {userId}");
                return;
            }

            var payload = JsonSerializer.Serialize(new
            {
                title,
                body,
                icon = icon ?? "/logo.png",
                badge = "/logo.png",
                timestamp = DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()
            });

            foreach (var subscription in subscriptions)
            {
                try
                {
                    var pushSubscription = new WebPushSubscription(
                        subscription.Endpoint,
                        subscription.P256dh,
                        subscription.Auth);

                    var vapidDetails = new WebPushVapidDetails(
                        "mailto:support@innerg.com",
                        _vapidPublicKey,
                        _vapidPrivateKey);

                    await _webPushClient.SendNotificationAsync(
                        pushSubscription,
                        payload,
                        vapidDetails);

                    subscription.LastUsedAt = DateTime.UtcNow;
                    Console.WriteLine($"[PushNotificationService] Push sent successfully to user {userId}");
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[PushNotificationService] Error sending push to user {userId}: {ex.Message}");
                    
                    // If subscription is invalid (410 Gone), remove it
                    if (ex.Message.Contains("410") || ex.Message.Contains("Gone"))
                    {
                        subscription.DeletedAt = DateTime.UtcNow;
                    }
                }
            }

            await _context.SaveChangesAsync();
        }

        public async Task SubscribeAsync(Guid userId, string endpoint, string p256dh, string auth, string userAgent)
        {
            var user = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Id == userId);

            var existingSubscription = await _context.PushSubscriptions
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.UserId == userId && s.Endpoint == endpoint);

            if (existingSubscription != null)
            {
                existingSubscription.LastUsedAt = DateTime.UtcNow;
                existingSubscription.UserAgent = userAgent;
                existingSubscription.P256dh = p256dh;
                existingSubscription.Auth = auth;
                existingSubscription.DeletedAt = null;
                if (user?.CompanyId != null)
                    existingSubscription.CompanyId = user.CompanyId.Value;
            }
            else
            {
                _context.PushSubscriptions.Add(new PushSubscription
                {
                    UserId = userId,
                    CompanyId = user?.CompanyId ?? Guid.Empty,
                    Endpoint = endpoint,
                    P256dh = p256dh,
                    Auth = auth,
                    UserAgent = userAgent,
                    LastUsedAt = DateTime.UtcNow
                });
            }

            await _context.SaveChangesAsync();
            Console.WriteLine($"[PushNotificationService] User {userId} subscribed to push notifications");
        }

        public async Task UnsubscribeAsync(Guid userId, string endpoint)
        {
            var subscription = await _context.PushSubscriptions
                .FirstOrDefaultAsync(s => s.UserId == userId && s.Endpoint == endpoint);

            if (subscription != null)
            {
                subscription.DeletedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();
                Console.WriteLine($"[PushNotificationService] User {userId} unsubscribed from push notifications");
            }
        }

        public async Task CleanupOldSubscriptionsAsync()
        {
            var cutoffDate = DateTime.UtcNow.AddDays(-90);
            
            var oldSubscriptions = await _context.PushSubscriptions
                .Where(s => s.LastUsedAt < cutoffDate && s.DeletedAt == null)
                .ToListAsync();

            foreach (var subscription in oldSubscriptions)
            {
                subscription.DeletedAt = DateTime.UtcNow;
            }

            if (oldSubscriptions.Any())
            {
                await _context.SaveChangesAsync();
                Console.WriteLine($"[PushNotificationService] Cleaned up {oldSubscriptions.Count} old push subscriptions");
            }
        }
    }
}