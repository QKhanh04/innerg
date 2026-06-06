using System;

namespace InnerG.Api.DTOs
{
    public class ConnectGoogleRequest
    {
        public string AccessToken { get; set; } = string.Empty;
    }

    public class GoogleStatusDto
    {
        public bool IsConnected { get; set; }
        public DateTime? LastSyncedAt { get; set; }
        public string? Email { get; set; }
    }

    public class ConnectGoogleResponseDto
    {
        public string Message { get; set; } = string.Empty;
        public bool IsConnected { get; set; }
        public DateTime? LastSyncedAt { get; set; }
    }

    public class DisconnectGoogleResponseDto
    {
        public string Message { get; set; } = string.Empty;
        public bool IsConnected { get; set; }
    }
}
