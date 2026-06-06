using System;
using System.Text.Json;
using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.Models;

namespace InnerG.Api.Helpers
{
    public static class HrAuditHelper
    {
        private static readonly JsonSerializerOptions JsonOptions = new() { WriteIndented = false };

        public static async Task LogAsync(
            AppDbContext context,
            Guid companyId,
            Guid actorUserId,
            string entityType,
            Guid? entityId,
            string action,
            object? oldValue = null,
            object? newValue = null,
            string? ipAddress = null,
            string? userAgent = null)
        {
            context.AuditLogs.Add(new AuditLog
            {
                CompanyId = companyId,
                UserId = actorUserId,
                EntityType = entityType,
                EntityId = entityId,
                Action = action,
                OldValueJson = oldValue != null ? JsonSerializer.Serialize(oldValue, JsonOptions) : null,
                NewValueJson = newValue != null ? JsonSerializer.Serialize(newValue, JsonOptions) : null,
                IpAddress = ipAddress,
                UserAgent = userAgent
            });
            await context.SaveChangesAsync();
        }
    }
}
