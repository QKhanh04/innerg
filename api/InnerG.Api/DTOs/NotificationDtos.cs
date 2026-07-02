using System;
using System.Collections.Generic;

namespace InnerG.Api.DTOs
{
    public class SubscribePushRequest
    {
        public string Endpoint { get; set; } = string.Empty;
        public string P256dh { get; set; } = string.Empty;
        public string Auth { get; set; } = string.Empty;
    }

    public class UnsubscribePushRequest
    {
        public string Endpoint { get; set; } = string.Empty;
    }

    public class NotificationItemDto
    {
        public Guid Id { get; set; }
        public string Type { get; set; } = string.Empty;
        public string Title { get; set; } = string.Empty;
        public string Body { get; set; } = string.Empty;
        public bool IsRead { get; set; }
        public DateTime? SentAt { get; set; }
        public string? ReferenceType { get; set; }
        public Guid? ReferenceId { get; set; }
    }

    public class NotificationListResponse
    {
        public List<NotificationItemDto> Items { get; set; } = new();
        public int UnreadCount { get; set; }
    }
}
