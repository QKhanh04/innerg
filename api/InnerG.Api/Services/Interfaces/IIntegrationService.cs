using System;
using System.Threading.Tasks;
using InnerG.Api.DTOs;

namespace InnerG.Api.Services.Interfaces
{
    public interface IIntegrationService
    {
        Task<GoogleStatusDto> GetGoogleStatusAsync(Guid userId, string? userEmail);
        Task<ConnectGoogleResponseDto> ConnectGoogleAsync(Guid userId, string accessToken);
        Task<DisconnectGoogleResponseDto> DisconnectGoogleAsync(Guid userId);
    }
}
