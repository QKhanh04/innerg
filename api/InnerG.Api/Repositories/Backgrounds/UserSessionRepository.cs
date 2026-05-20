using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using InnerG.Api.Data;

namespace InnerG.Api.Repositories.Backgrounds
{
    public interface IUserSessionRepository
    {
        Task<int> CleanupExpiredSessionsAsync(CancellationToken ct);
    }

    public class UserSessionRepository : IUserSessionRepository
    {
        private readonly AppDbContext _context;

        public UserSessionRepository(AppDbContext context)
        {
            _context = context;
        }

        public async Task<int> CleanupExpiredSessionsAsync(CancellationToken ct)
        {
            var now = DateTime.UtcNow;

            // Sessions that are expired or revoked
            var expiredSessions = await _context.UserSessions
                .IgnoreQueryFilters() // We want to clean up even if filtered (though Soft Delete filter usually hides them)
                .Where(x => x.ExpiresAt < now || !x.IsActive)
                .ToListAsync(ct);

            if (!expiredSessions.Any())
                return 0;

            _context.UserSessions.RemoveRange(expiredSessions);
            return await _context.SaveChangesAsync(ct);
        }
    }
}
