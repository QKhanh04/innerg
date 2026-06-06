using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using InnerG.Api.DTOs;
using InnerG.Api.Models;
using InnerG.Api.Repositories.Interfaces;
using InnerG.Api.Services.Interfaces;

namespace InnerG.Api.Services.Implementations
{
    public class IntegrationService : IIntegrationService
    {
        private readonly IUnitOfWork _unitOfWork;

        public IntegrationService(IUnitOfWork unitOfWork)
        {
            _unitOfWork = unitOfWork;
        }

        public async Task<GoogleStatusDto> GetGoogleStatusAsync(Guid userId, string? userEmail)
        {
            var integration = await _unitOfWork.Repository<UserIntegration>().GetQueryable()
                .FirstOrDefaultAsync(ui => ui.UserId == userId && ui.Provider == IntegrationProvider.GoogleCalendar);

            return new GoogleStatusDto
            {
                IsConnected = integration != null && integration.IsActive,
                LastSyncedAt = integration?.LastSyncedAt,
                Email = integration != null && integration.IsActive ? userEmail ?? "user@company.com" : null
            };
        }

        public async Task<ConnectGoogleResponseDto> ConnectGoogleAsync(Guid userId, string accessToken)
        {
            var integration = await _unitOfWork.Repository<UserIntegration>().GetQueryable()
                .FirstOrDefaultAsync(ui => ui.UserId == userId && ui.Provider == IntegrationProvider.GoogleCalendar);

            if (integration == null)
            {
                integration = new UserIntegration
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    Provider = IntegrationProvider.GoogleCalendar,
                    AccessTokenEncrypted = accessToken,
                    RefreshTokenEncrypted = "",
                    TokenExpiresAt = DateTime.UtcNow.AddHours(1),
                    CalendarId = "primary",
                    Scope = "https://www.googleapis.com/auth/calendar.readonly",
                    IsActive = true,
                    LastSyncedAt = DateTime.UtcNow
                };
                await _unitOfWork.Repository<UserIntegration>().AddAsync(integration);
            }
            else
            {
                integration.AccessTokenEncrypted = accessToken;
                integration.IsActive = true;
                integration.LastSyncedAt = DateTime.UtcNow;
                await _unitOfWork.Repository<UserIntegration>().UpdateAsync(integration);
            }

            await _unitOfWork.CommitAsync();

            return new ConnectGoogleResponseDto
            {
                Message = "Connected to Google Calendar successfully.",
                IsConnected = true,
                LastSyncedAt = integration.LastSyncedAt
            };
        }

        public async Task<DisconnectGoogleResponseDto> DisconnectGoogleAsync(Guid userId)
        {
            var integration = await _unitOfWork.Repository<UserIntegration>().GetQueryable()
                .FirstOrDefaultAsync(ui => ui.UserId == userId && ui.Provider == IntegrationProvider.GoogleCalendar);

            if (integration != null)
            {
                integration.IsActive = false;
                await _unitOfWork.Repository<UserIntegration>().UpdateAsync(integration);
                await _unitOfWork.CommitAsync();
            }

            return new DisconnectGoogleResponseDto
            {
                Message = "Disconnected from Google Calendar.",
                IsConnected = false
            };
        }
    }
}
