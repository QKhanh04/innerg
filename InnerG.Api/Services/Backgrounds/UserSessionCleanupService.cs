using System;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using InnerG.Api.Repositories.Backgrounds;

namespace InnerG.Api.Services.Backgrounds
{
    public class UserSessionCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly ILogger<UserSessionCleanupService> _logger;

        public UserSessionCleanupService(
            IServiceScopeFactory scopeFactory,
            ILogger<UserSessionCleanupService> logger)
        {
            _scopeFactory = scopeFactory;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            // Initial cleanup
            await CleanupAsync(stoppingToken);

            while (!stoppingToken.IsCancellationRequested)
            {
                // Run every 24 hours
                await Task.Delay(TimeSpan.FromHours(24), stoppingToken);

                await CleanupAsync(stoppingToken);
            }
        }

        private async Task CleanupAsync(CancellationToken ct)
        {
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var repo = scope.ServiceProvider.GetRequiredService<IUserSessionRepository>();

                var deleted = await repo.CleanupExpiredSessionsAsync(ct);

                if (deleted > 0)
                {
                    _logger.LogInformation("UserSession cleanup removed {Count} expired/revoked sessions", deleted);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error occurred while cleaning up user sessions.");
            }
        }
    }
}
