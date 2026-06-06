using Microsoft.EntityFrameworkCore;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Seed
{
    public static class UserNameNormalizationSeeder
    {
        public static async Task NormalizeAsync(AppDbContext context)
        {
            var users = await context.Users
                .IgnoreQueryFilters()
                .OrderBy(x => x.CreatedAt)
                .ThenBy(x => x.Id)
                .ToListAsync();

            var usedNames = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
            var hasChanges = false;

            foreach (var user in users)
            {
                var baseUserName = NormalizeEmail(user.Email);
                if (string.IsNullOrWhiteSpace(baseUserName))
                    baseUserName = $"user-{user.Id:N}".ToLowerInvariant();

                var candidate = baseUserName;
                var suffix = 2;

                while (!usedNames.Add(candidate))
                {
                    candidate = $"{baseUserName}-{suffix}";
                    suffix++;
                }

                var normalizedCandidate = candidate.ToUpperInvariant();
                if (!string.Equals(user.UserName, candidate, StringComparison.Ordinal) ||
                    !string.Equals(user.NormalizedUserName, normalizedCandidate, StringComparison.Ordinal))
                {
                    user.UserName = candidate;
                    user.NormalizedUserName = normalizedCandidate;
                    hasChanges = true;
                }
            }

            if (hasChanges)
                await context.SaveChangesAsync();
        }

        private static string NormalizeEmail(string? email)
        {
            return string.IsNullOrWhiteSpace(email)
                ? string.Empty
                : email.Trim().ToLowerInvariant();
        }
    }
}
