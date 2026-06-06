using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Seed
{
    public static class DataSeeder
    {
        private const string SeedPassword = "InnerG123";

        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            var context = serviceProvider.GetRequiredService<AppDbContext>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<AppRole>>();
            var userManager = serviceProvider.GetRequiredService<UserManager<AppUser>>();

            var roles = new[]
            {
                AuthRoles.SystemAdmin,
                AuthRoles.HR,
                AuthRoles.Mentor,
                AuthRoles.Mentee
            };

            foreach (var roleName in roles)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                    await roleManager.CreateAsync(new AppRole(roleName));
            }

            var company = await context.Companies.IgnoreQueryFilters().FirstOrDefaultAsync();
            if (company == null)
            {
                company = new Company
                {
                    Id = Guid.NewGuid(),
                    Name = "InnerG Corporation",
                    Domain = "innerg.com",
                    Timezone = "Asia/Ho_Chi_Minh",
                    Language = "vi",
                    IsActive = true
                };

                context.Companies.Add(company);
                await context.SaveChangesAsync();
            }

            var seedUsers = new[]
            {
                new SeedUserDefinition("systemadmin@innerg.com", "System Administrator", null, new[] { AuthRoles.SystemAdmin }),
                new SeedUserDefinition("hr@innerg.com", "Human Resources", company.Id, new[] { AuthRoles.HR }),
                new SeedUserDefinition("mentor@innerg.com", "Mentor User", company.Id, new[] { AuthRoles.Mentor }),
                new SeedUserDefinition("mentee@innerg.com", "Mentee User", company.Id, new[] { AuthRoles.Mentee }),
                new SeedUserDefinition("minhduy16082005@gmail.com", "Duy Nguyen", company.Id, new[] { AuthRoles.HR }),
                new SeedUserDefinition("dangcongquockhanh@gmail.com", "Dang Cong Quoc Khanh", null, new[] { AuthRoles.SystemAdmin }),
                new SeedUserDefinition("khanhhoakt2k4@gmail.com", "Khanh Hoa", company.Id, new[] { AuthRoles.Mentee })
            };

            foreach (var seedUser in seedUsers)
                await EnsureSeedUserAsync(userManager, seedUser);

            if (!await context.SubscriptionPlans.AnyAsync())
            {
                context.SubscriptionPlans.Add(new SubscriptionPlan
                {
                    Name = "Enterprise",
                    MaxUsers = 1000,
                    PricePerUser = 10.0m,
                    BillingCycle = BillingCycle.Monthly,
                    IsActive = true
                });

                await context.SaveChangesAsync();
            }
        }

        private static async Task EnsureSeedUserAsync(
            UserManager<AppUser> userManager,
            SeedUserDefinition definition)
        {
            var normalizedEmail = definition.Email.Trim().ToLowerInvariant();
            var expectedUserName = BuildUserName(normalizedEmail);

            var user = await userManager.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.CompanyId == definition.CompanyId && x.Email == normalizedEmail && x.DeletedAt == null);

            if (user == null && definition.CompanyId == null)
            {
                user = await userManager.Users
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(x => x.Email == normalizedEmail && x.DeletedAt == null);
            }

            if (user == null)
            {
                user = new AppUser
                {
                    CompanyId = definition.CompanyId,
                    UserName = expectedUserName,
                    Email = normalizedEmail,
                    FullName = definition.FullName,
                    EmailConfirmed = true,
                    IsActive = true
                };

                var createResult = await userManager.CreateAsync(user, SeedPassword);
                if (!createResult.Succeeded)
                {
                    throw new InvalidOperationException(
                        $"Failed to seed user '{normalizedEmail}': {string.Join("; ", createResult.Errors.Select(x => x.Description))}");
                }
            }
            else
            {
                var changed = false;

                if (user.CompanyId != definition.CompanyId)
                {
                    user.CompanyId = definition.CompanyId;
                    changed = true;
                }

                if (user.DeletedAt != null)
                {
                    user.DeletedAt = null;
                    changed = true;
                }

                if (!string.Equals(user.UserName, expectedUserName, StringComparison.Ordinal))
                {
                    user.UserName = expectedUserName;
                    changed = true;
                }

                if (!string.Equals(user.FullName, definition.FullName, StringComparison.Ordinal))
                {
                    user.FullName = definition.FullName;
                    changed = true;
                }

                if (!user.EmailConfirmed)
                {
                    user.EmailConfirmed = true;
                    changed = true;
                }

                if (!user.IsActive)
                {
                    user.IsActive = true;
                    changed = true;
                }

                if (changed)
                {
                    var updateResult = await userManager.UpdateAsync(user);
                    if (!updateResult.Succeeded)
                    {
                        throw new InvalidOperationException(
                            $"Failed to update seed user '{normalizedEmail}': {string.Join("; ", updateResult.Errors.Select(x => x.Description))}");
                    }
                }
            }

            var currentRoles = await userManager.GetRolesAsync(user);
            var missingRoles = definition.Roles
                .Except(currentRoles, StringComparer.OrdinalIgnoreCase)
                .ToArray();

            if (missingRoles.Length == 0)
                return;

            var addRolesResult = await userManager.AddToRolesAsync(user, missingRoles);
            if (!addRolesResult.Succeeded)
            {
                throw new InvalidOperationException(
                    $"Failed to assign roles to seed user '{normalizedEmail}': {string.Join("; ", addRolesResult.Errors.Select(x => x.Description))}");
            }
        }

        private static string BuildUserName(string email)
        {
            return email.Trim().ToLowerInvariant();
        }

        private sealed record SeedUserDefinition(string Email, string FullName, Guid? CompanyId, string[] Roles);
    }
}
