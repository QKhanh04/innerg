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
            using var context = serviceProvider.GetRequiredService<AppDbContext>();
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
                new SeedUserDefinition("systemadmin@innerg.com", "System Administrator", new[] { AuthRoles.SystemAdmin }),
                new SeedUserDefinition("hr@innerg.com", "Human Resources", new[] { AuthRoles.HR }),
                new SeedUserDefinition("mentor@innerg.com", "Mentor User", new[] { AuthRoles.Mentor }),
                new SeedUserDefinition("mentee@innerg.com", "Mentee User", new[] { AuthRoles.Mentee })
            };

            foreach (var seedUser in seedUsers)
                await EnsureSeedUserAsync(userManager, company, seedUser);

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

            // 4. Seed Default Skills, Trainers, Training Events, and Sessions for Testing Schedules
            if (!await context.Skills.AnyAsync())
            {
                var techSkill = new Skill
                {
                    Id = Guid.NewGuid(),
                    CompanyId = company.Id,
                    Name = "React Architecture & Advanced Patterns",
                    Category = "Technical",
                    Description = "Learn how to build scalable React web applications.",
                    IsSystem = true,
                    IsActive = true
                };

                var softSkill = new Skill
                {
                    Id = Guid.NewGuid(),
                    CompanyId = company.Id,
                    Name = "Zen Mindset & Emotional Intelligence",
                    Category = "Soft Skill",
                    Description = "Achieve high productivity through stress reduction and focus techniques.",
                    IsSystem = true,
                    IsActive = true
                };

                context.Skills.AddRange(techSkill, softSkill);
                await context.SaveChangesAsync();

                // If any test users exist, seed scheduled sessions for them!
                var firstUser = await context.Users.IgnoreQueryFilters().FirstOrDefaultAsync();
                if (firstUser != null)
                {
                    // Ensure firstUser is a Trainer in database to test Teaching view
                    var trainer = await context.Trainers.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.UserId == firstUser.Id);
                    if (trainer == null)
                    {
                        trainer = new Trainer
                        {
                            Id = Guid.NewGuid(),
                            CompanyId = company.Id,
                            UserId = firstUser.Id,
                            TrainerType = TrainerType.Internal,
                            FullName = firstUser.FullName,
                            Email = firstUser.Email,
                            IsActive = true
                        };
                        context.Trainers.Add(trainer);
                        await context.SaveChangesAsync();
                    }

                    // Seed a training event where the user is the Mentor (Teaching)
                    var teachingEvent = new TrainingEvent
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = company.Id,
                        Title = "Advanced React & Design Systems",
                        Description = "Deep dive into frontend frameworks.",
                        Type = TrainingEventType.SharingSession,
                        Status = TrainingEventStatus.Published,
                        SkillId = techSkill.Id,
                        TrainerId = trainer.Id,
                        StartDate = DateTime.UtcNow.AddDays(-1),
                        EndDate = DateTime.UtcNow.AddDays(7),
                        MaxParticipants = 20,
                        RewardPoints = 50
                    };
                    context.TrainingEvents.Add(teachingEvent);

                    // Create sessions for teaching
                    var session1 = new TrainingSession
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = company.Id,
                        TrainingEventId = teachingEvent.Id,
                        Title = "Session 1: Advanced Hooks & Custom State",
                        StartTime = DateTime.UtcNow.Date.AddDays(1).AddHours(9), // Tomorrow 9:00 AM
                        EndTime = DateTime.UtcNow.Date.AddDays(1).AddHours(11), // Tomorrow 11:00 AM
                        MeetingLink = "https://meet.google.com/abc-defg-hij",
                        Notes = "Prepare your IDE with Vite template."
                    };
                    var session2 = new TrainingSession
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = company.Id,
                        TrainingEventId = teachingEvent.Id,
                        Title = "Session 2: Architecture & Performance Tuning",
                        StartTime = DateTime.UtcNow.Date.AddDays(3).AddHours(10), // 3 days later 10:00 AM
                        EndTime = DateTime.UtcNow.Date.AddDays(3).AddHours(12), // 3 days later 12:00 PM
                        MeetingLink = "https://meet.google.com/xyz-uvwx-yza",
                        Notes = "Bring questions on memoization."
                    };
                    context.TrainingSessions.AddRange(session1, session2);

                    // Seed an external trainer and an event where the user is the Mentee (Upcoming)
                    var externalTrainer = new Trainer
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = company.Id,
                        TrainerType = TrainerType.External,
                        FullName = "Prof. Thu Ha",
                        Email = "thuha@expert.com",
                        OrganizationName = "Zen Mindset Institute",
                        IsActive = true
                    };
                    context.Trainers.Add(externalTrainer);
                    await context.SaveChangesAsync();

                    var learningEvent = new TrainingEvent
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = company.Id,
                        Title = "Vinyasa Yoga & Breathwork for High-Productivity",
                        Description = "Mindfulness training for high-stress corporate roles.",
                        Type = TrainingEventType.Workshop,
                        Status = TrainingEventStatus.Published,
                        SkillId = softSkill.Id,
                        TrainerId = externalTrainer.Id,
                        StartDate = DateTime.UtcNow.AddDays(-2),
                        EndDate = DateTime.UtcNow.AddDays(5),
                        MaxParticipants = 30,
                        RewardPoints = 100
                    };
                    context.TrainingEvents.Add(learningEvent);
                    await context.SaveChangesAsync();

                    // Enroll the user in this event
                    var enrollment = new Enrollment
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = company.Id,
                        TrainingEventId = learningEvent.Id,
                        UserId = firstUser.Id,
                        Status = EnrollmentStatus.Confirmed,
                        EnrollmentDate = DateTime.UtcNow
                    };
                    context.Enrollments.Add(enrollment);

                    // Create sessions for learning
                    var learnSession1 = new TrainingSession
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = company.Id,
                        TrainingEventId = learningEvent.Id,
                        Title = "Vinyasa Flow & Stress Control",
                        StartTime = DateTime.UtcNow.Date.AddDays(2).AddHours(15), // 2 days later 3:00 PM
                        EndTime = DateTime.UtcNow.Date.AddDays(2).AddHours(16.5), // 2 days later 4:30 PM
                        MeetingLink = "https://meet.google.com/yoga-flow-zen",
                        Notes = "Wear comfortable clothing and have a yoga mat ready."
                    };
                    var learnSession2 = new TrainingSession
                    {
                        Id = Guid.NewGuid(),
                        CompanyId = company.Id,
                        TrainingEventId = learningEvent.Id,
                        Title = "Breathwork Masterclass",
                        StartTime = DateTime.UtcNow.Date.AddDays(-1).AddHours(10), // Yesterday 10:00 AM (Completed)
                        EndTime = DateTime.UtcNow.Date.AddDays(-1).AddHours(11),
                        MeetingLink = "https://meet.google.com/breathwork-flow",
                        Notes = "Completed."
                    };
                    context.TrainingSessions.AddRange(learnSession1, learnSession2);

                    await context.SaveChangesAsync();
                }
            }
        }

        private static async Task EnsureSeedUserAsync(
            UserManager<AppUser> userManager,
            Company company,
            SeedUserDefinition definition)
        {
            var normalizedEmail = definition.Email.Trim().ToLowerInvariant();
            var expectedUserName = normalizedEmail;

            var user = await userManager.Users
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.CompanyId == company.Id && x.Email == normalizedEmail && x.DeletedAt == null);

            if (user == null)
            {
                user = new AppUser
                {
                    CompanyId = company.Id,
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

        private sealed record SeedUserDefinition(string Email, string FullName, string[] Roles);
    }
}
