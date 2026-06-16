using System;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Seed
{
    public static class DemoBusinessDataSeeder
    {
        public static async Task SeedAsync(IServiceProvider serviceProvider)
        {
            var context = serviceProvider.GetRequiredService<AppDbContext>();
            var configuration = serviceProvider.GetRequiredService<Microsoft.Extensions.Configuration.IConfiguration>();
            var seedCompanyDomain = configuration["SEED_COMPANY_DOMAIN"]?.Trim().ToLowerInvariant() ?? "innerg.com";

            var company = await context.Companies.IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Domain == seedCompanyDomain && x.DeletedAt == null);
            if (company == null) return;

            var mentorEmail = configuration["SEED_MENTOR_EMAIL"];
            var menteeEmail = configuration["SEED_MENTEE_EMAIL"];
            var sysAdminEmail = configuration["SEED_SYSADMIN_EMAIL"];

            if (string.IsNullOrEmpty(mentorEmail) || string.IsNullOrEmpty(menteeEmail) || string.IsNullOrEmpty(sysAdminEmail)) return;

            // Get users
            var mentorUser = await context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == mentorEmail);
            var menteeUser = await context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == menteeEmail);
            var systemAdminUser = await context.Users.IgnoreQueryFilters().FirstOrDefaultAsync(u => u.Email == sysAdminEmail);

            if (mentorUser == null || menteeUser == null || systemAdminUser == null) return;

            // 1. Seed Pending Enrollments for the Mentor
            var mentorTrainer = await context.Trainers.IgnoreQueryFilters().FirstOrDefaultAsync(t => t.UserId == mentorUser.Id);
            if (mentorTrainer != null)
            {
                var mentorEvent = await context.TrainingEvents.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.TrainerId == mentorTrainer.Id);
                
                if (mentorEvent != null)
                {
                    // Check if pending enrollment already exists
                    var existingPending = await context.Enrollments.IgnoreQueryFilters()
                        .AnyAsync(e => e.TrainingEventId == mentorEvent.Id && e.UserId == systemAdminUser.Id); 
                    
                    if (!existingPending)
                    {
                        var pendingEnrollment = new Enrollment
                        {
                            Id = Guid.NewGuid(),
                            CompanyId = company.Id,
                            TrainingEventId = mentorEvent.Id,
                            UserId = systemAdminUser.Id, // Just using as a mock user to appear in pending list
                            Status = EnrollmentStatus.Pending,
                            EnrollmentDate = DateTime.UtcNow.AddHours(-3)
                        };
                        context.Enrollments.Add(pendingEnrollment);
                    }
                }
            }

            // 2. Seed Learning Wishlists & Votes
            var existingWishlists = await context.LearningWishlists.IgnoreQueryFilters().AnyAsync();
            if (!existingWishlists)
            {
                var wishlist1 = new LearningWishlist
                {
                    Id = Guid.NewGuid(),
                    CompanyId = company.Id,
                    UserId = menteeUser.Id,
                    SkillNameCustom = "NestJS Microservices Architecture",
                    Category = "Technical",
                    Description = "Learn how to build scalable microservices using NestJS and gRPC.",
                    Reason = "Many teams are migrating to microservices architecture next quarter.",
                    Urgency = WishlistUrgency.High,
                    VoteCount = 3,
                    Status = WishlistStatus.Pending
                };

                var wishlist2 = new LearningWishlist
                {
                    Id = Guid.NewGuid(),
                    CompanyId = company.Id,
                    UserId = menteeUser.Id,
                    SkillNameCustom = "Kubernetes Basics & Deployment",
                    Category = "Technical",
                    Description = "Fundamentals of K8s, pods, services, and deployments for developers.",
                    Reason = "We need to understand how our apps are deployed and managed in production.",
                    Urgency = WishlistUrgency.Medium,
                    VoteCount = 4,
                    Status = WishlistStatus.Pending
                };

                context.LearningWishlists.AddRange(wishlist1, wishlist2);
            }

            // 3. Seed Points Ledger for Mentor to have a balance
            var existingLedger = await context.InnerGPointsLedger.IgnoreQueryFilters().AnyAsync(l => l.UserId == mentorUser.Id);
            if (!existingLedger)
            {
                var ledger1 = new InnerGPointsLedger
                {
                    Id = Guid.NewGuid(),
                    UserId = mentorUser.Id,
                    Amount = 1500,
                    BalanceAfter = 1500,
                    Type = PointTransactionType.EarnedTeaching,
                    Note = "Points earned from teaching React basics seminar.",
                    CreatedAt = DateTime.UtcNow.AddDays(-10)
                };

                var ledger2 = new InnerGPointsLedger
                {
                    Id = Guid.NewGuid(),
                    UserId = mentorUser.Id,
                    Amount = 300,
                    BalanceAfter = 1800,
                    Type = PointTransactionType.RatingBonus,
                    Note = "Bonus points for receiving consecutive 5-star ratings.",
                    CreatedAt = DateTime.UtcNow.AddDays(-2)
                };

                context.InnerGPointsLedger.AddRange(ledger1, ledger2);
            }

            // 4. Seed Points Ledger for Mentee
            var existingMenteeLedger = await context.InnerGPointsLedger.IgnoreQueryFilters().AnyAsync(l => l.UserId == menteeUser.Id);
            if (!existingMenteeLedger)
            {
                var menteeLedger = new InnerGPointsLedger
                {
                    Id = Guid.NewGuid(),
                    UserId = menteeUser.Id,
                    Amount = 250,
                    BalanceAfter = 250,
                    Type = PointTransactionType.RuleBonus,
                    Note = "Points earned for full attendance in Yoga & Breathwork class.",
                    CreatedAt = DateTime.UtcNow.AddDays(-1)
                };
                context.InnerGPointsLedger.Add(menteeLedger);
            }

            // 5. Seed Professional Skills for Mentor
            var skills = await context.Skills.IgnoreQueryFilters().Where(s => s.CompanyId == company.Id).ToListAsync();
            foreach (var skill in skills)
            {
                var existingUserSkill = await context.UserSkills.IgnoreQueryFilters().AnyAsync(us => us.UserId == mentorUser.Id && us.SkillId == skill.Id);
                if (!existingUserSkill)
                {
                    context.UserSkills.Add(new UserSkill
                    {
                        Id = Guid.NewGuid(),
                        UserId = mentorUser.Id,
                        SkillId = skill.Id,
                        Proficiency = ProficiencyLevel.Expert,
                        IsMentorSkill = true,
                        Source = SkillSource.HRVerified,
                        VerifiedAt = DateTime.UtcNow.AddMonths(-3)
                    });
                }
            }

            // 6. Seed Badges and UserBadges for Mentor
            var badge1 = await context.Badges.IgnoreQueryFilters().FirstOrDefaultAsync(b => b.Name == "Top Mentor 2026");
            if (badge1 == null)
            {
                badge1 = new Badge
                {
                    Id = Guid.NewGuid(),
                    CompanyId = company.Id,
                    Name = "Top Mentor 2026",
                    Description = "Awarded for being the most highly rated mentor.",
                    IconUrl = "https://cdn-icons-png.flaticon.com/512/1785/1785236.png",
                    ConditionType = BadgeConditionType.TopRankedMonthly,
                    IsSystem = false
                };
                var badge2 = new Badge
                {
                    Id = Guid.NewGuid(),
                    CompanyId = company.Id,
                    Name = "First Teaching Session",
                    Description = "Awarded for completing the first teaching session.",
                    IconUrl = "https://cdn-icons-png.flaticon.com/512/3274/3274116.png",
                    ConditionType = BadgeConditionType.FirstTeach,
                    IsSystem = false
                };

                context.Badges.AddRange(badge1, badge2);

                context.UserBadges.Add(new UserBadge
                {
                    Id = Guid.NewGuid(),
                    UserId = mentorUser.Id,
                    BadgeId = badge1.Id,
                    AwardedAt = DateTime.UtcNow.AddMonths(-1)
                });

                context.UserBadges.Add(new UserBadge
                {
                    Id = Guid.NewGuid(),
                    UserId = mentorUser.Id,
                    BadgeId = badge2.Id,
                    AwardedAt = DateTime.UtcNow.AddMonths(-6)
                });
            }

            await context.SaveChangesAsync();
        }
    }
}
