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
    public class RoleSeeder
    {
        public static async Task SeedAsync(IServiceProvider services)
        {
            var roleManager = services.GetRequiredService<RoleManager<AppRole>>();
            var context = services.GetRequiredService<AppDbContext>();

            // Seed Roles
            string[] roles = { "Employee", "Mentor", "HRManager", "Admin", "User" };

            foreach (var role in roles)
            {
                if (!await roleManager.RoleExistsAsync(role))
                {
                    await roleManager.CreateAsync(new AppRole(role));
                }
            }

            // Seed Initial Company (Requirement for SaaS Root)
            if (!await context.Companies.AnyAsync())
            {
                var company = new Company
                {
                    Id = Guid.Parse("00000000-0000-0000-0000-000000000001"), // Fixed GUID for dev/testing
                    Name = "InnerG Default Company",
                    Domain = "innerg.com",
                    IsActive = true
                };

                context.Companies.Add(company);
                await context.SaveChangesAsync();
            }
        }
    }
}