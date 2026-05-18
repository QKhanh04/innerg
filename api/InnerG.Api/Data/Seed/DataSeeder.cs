using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Seed
{
    public static class DataSeeder
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            using var context = serviceProvider.GetRequiredService<AppDbContext>();
            var roleManager = serviceProvider.GetRequiredService<RoleManager<AppRole>>();

            // 1. Seed Roles
            string[] roles = { "SuperAdmin", "Admin", "HR", "Trainer", "User" };
            foreach (var roleName in roles)
            {
                if (!await roleManager.RoleExistsAsync(roleName))
                {
                    await roleManager.CreateAsync(new AppRole(roleName));
                }
            }

            // 2. Seed Default Company
            var company = await context.Companies.IgnoreQueryFilters().FirstOrDefaultAsync();
            if (company == null)
            {
                company = new Company
                {
                    Id = Guid.NewGuid(),
                    Name = "InnerG Corporation",
                    Domain = "innerg.com",
                    IsActive = true
                };
                context.Companies.Add(company);
                await context.SaveChangesAsync();
            }

            // 3. Seed Default Subscription Plan
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
    }
}
