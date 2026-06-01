using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InnerG.Api.Services.Implementations
{
    public class NotificationService : INotificationService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;

        public NotificationService(AppDbContext context, IEmailService emailService)
        {
            _context = context;
            _emailService = emailService;
        }

        public async Task SendAsync(
            Guid userId,
            string type,
            string title,
            string body,
            NotificationChannel channel = NotificationChannel.Push,
            string? referenceType = null,
            Guid? referenceId = null)
        {
            _context.Notifications.Add(new Notification
            {
                UserId = userId,
                Type = type,
                Title = title,
                Body = body,
                Channel = channel,
                ReferenceType = referenceType,
                ReferenceId = referenceId,
                SentAt = DateTime.UtcNow
            });
            await _context.SaveChangesAsync();

            if (channel == NotificationChannel.Email || channel == NotificationChannel.Both)
            {
                var user = await _context.Users.FindAsync(userId);
                if (user != null && !string.IsNullOrEmpty(user.Email))
                {
                    Console.WriteLine($"[NotificationService] Sending email to {user.Email} for {userId}");
                    await _emailService.SendEmailAsync(user.Email, title, body);
                }
                else
                {
                    Console.WriteLine($"[NotificationService] User {userId} has no email or not found.");
                }
            }
        }

        public async Task SendToManyAsync(
            IEnumerable<Guid> userIds,
            string type,
            string title,
            string body,
            NotificationChannel channel = NotificationChannel.Push,
            string? referenceType = null,
            Guid? referenceId = null)
        {
            var distinctIds = userIds.Distinct().ToList();
            if (distinctIds.Count == 0) return;

            var now = DateTime.UtcNow;
            foreach (var userId in distinctIds)
            {
                _context.Notifications.Add(new Notification
                {
                    UserId = userId,
                    Type = type,
                    Title = title,
                    Body = body,
                    Channel = channel,
                    ReferenceType = referenceType,
                    ReferenceId = referenceId,
                    SentAt = now
                });
            }

            await _context.SaveChangesAsync();

            if (channel == NotificationChannel.Email || channel == NotificationChannel.Both)
            {
                var emailList = await _context.Users
                    .Where(u => distinctIds.Contains(u.Id) && u.Email != null && u.Email != "")
                    .Select(u => u.Email)
                    .ToListAsync();

                Console.WriteLine($"[NotificationService] Found {emailList.Count} user emails for broadcasting.");

                foreach (var email in emailList)
                {
                    try
                    {
                        Console.WriteLine($"[NotificationService] Attempting to send email to {email}");
                        await _emailService.SendEmailAsync(email!, title, body);
                        Console.WriteLine($"[NotificationService] Successfully sent email to {email}");
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[NotificationService] Error sending email to {email}: {ex.Message}");
                    }
                }
            }
        }
    }
}
