using System;
using System.Linq;
using System.Linq.Expressions;
using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using InnerG.Api.Models;
using InnerG.Api.Common.Interfaces;
using InnerG.Api.Services.Interfaces;

namespace InnerG.Api.Data
{
    public class AppDbContext : IdentityDbContext<AppUser, AppRole, Guid>
    {
        protected ICurrentUserService CurrentUserService { get; }

        public AppDbContext(
            DbContextOptions<AppDbContext> options,
            ICurrentUserService currentUserService) : base(options)
        {
            CurrentUserService = currentUserService;
        }

        public DbSet<Company> Companies => Set<Company>();
        public DbSet<UserSession> UserSessions => Set<UserSession>();
        public DbSet<Department> Departments => Set<Department>();
        public DbSet<Skill> Skills => Set<Skill>();
        public DbSet<UserSkill> UserSkills => Set<UserSkill>();
        public DbSet<SkillAssessment> SkillAssessments => Set<SkillAssessment>();
        public DbSet<Trainer> Trainers => Set<Trainer>();
        public DbSet<TrainerSkill> TrainerSkills => Set<TrainerSkill>();
        public DbSet<MeetingRoom> MeetingRooms => Set<MeetingRoom>();
        public DbSet<TrainingEvent> TrainingEvents => Set<TrainingEvent>();
        public DbSet<TrainingSession> TrainingSessions => Set<TrainingSession>();
        public DbSet<TrainingEventTargetDepartment> TrainingEventTargetDepartments => Set<TrainingEventTargetDepartment>();
        public DbSet<Enrollment> Enrollments => Set<Enrollment>();
        public DbSet<SessionAttendance> SessionAttendances => Set<SessionAttendance>();
        public DbSet<Reward> Rewards => Set<Reward>();
        public DbSet<UserReward> UserRewards => Set<UserReward>();
        public DbSet<Resource> Resources => Set<Resource>();
        public DbSet<LearningWishlist> LearningWishlists => Set<LearningWishlist>();
        public DbSet<Feedback> Feedbacks => Set<Feedback>();
        public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
        public DbSet<SubscriptionPlan> SubscriptionPlans => Set<SubscriptionPlan>();
        public DbSet<CompanySubscription> CompanySubscriptions => Set<CompanySubscription>();
        public DbSet<UserIntegration> UserIntegrations => Set<UserIntegration>();
        public DbSet<PointRule> PointRules => Set<PointRule>();
        public DbSet<InnerGPointsLedger> InnerGPointsLedger => Set<InnerGPointsLedger>();
        public DbSet<Badge> Badges => Set<Badge>();
        public DbSet<UserBadge> UserBadges => Set<UserBadge>();
        public DbSet<LeaderboardSnapshot> LeaderboardSnapshots => Set<LeaderboardSnapshot>();
        public DbSet<FeedbackCriteria> FeedbackCriteria => Set<FeedbackCriteria>();
        public DbSet<FeedbackResponse> FeedbackResponses => Set<FeedbackResponse>();
        public DbSet<TrainerInvitation> TrainerInvitations => Set<TrainerInvitation>();
        public DbSet<Notification> Notifications => Set<Notification>();
        public DbSet<NotificationPreference> NotificationPreferences => Set<NotificationPreference>();
        public DbSet<WishlistVote> WishlistVotes => Set<WishlistVote>();
        public DbSet<ResourceDepartmentAccess> ResourceDepartmentAccess => Set<ResourceDepartmentAccess>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Apply Configurations
            builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

            // Global Query Filters
            foreach (var entityType in builder.Model.GetEntityTypes())
            {
                // Soft Delete Filter
                if (typeof(ISoftDelete).IsAssignableFrom(entityType.ClrType))
                {
                    builder.Entity(entityType.ClrType).HasQueryFilter(GetSoftDeleteFilter(entityType.ClrType));
                }

                // Multi-tenancy Filter
                if (typeof(IMultiTenant).IsAssignableFrom(entityType.ClrType))
                {
                    builder.Entity(entityType.ClrType).HasQueryFilter(GetTenantFilter(entityType.ClrType));
                }
            }
        }

        public override async Task<int> SaveChangesAsync(CancellationToken cancellationToken = default)
        {
            foreach (var entry in ChangeTracker.Entries())
            {
                // Auditing
                if (entry.Entity is IAuditable auditable)
                {
                    switch (entry.State)
                    {
                        case EntityState.Added:
                            auditable.CreatedAt = DateTime.UtcNow;
                            break;
                        case EntityState.Modified:
                            auditable.UpdatedAt = DateTime.UtcNow;
                            break;
                    }
                }

                // Multi-tenancy
                if (entry.Entity is IMultiTenant tenantEntity && entry.State == EntityState.Added)
                {
                    if (tenantEntity.CompanyId == Guid.Empty)
                    {
                        tenantEntity.CompanyId = CurrentUserService.CompanyId;
                    }
                }

                // Soft Delete
                if (entry.Entity is ISoftDelete softDelete && entry.State == EntityState.Deleted)
                {
                    entry.State = EntityState.Modified;
                    softDelete.DeletedAt = DateTime.UtcNow;
                }
            }

            return await base.SaveChangesAsync(cancellationToken);
        }

        private LambdaExpression GetSoftDeleteFilter(Type type)
        {
            var parameter = Expression.Parameter(type, "it");
            var property = Expression.Property(parameter, nameof(ISoftDelete.DeletedAt));
            var nullValue = Expression.Constant(null, typeof(DateTime?));
            var comparison = Expression.Equal(property, nullValue);
            return Expression.Lambda(comparison, parameter);
        }

        private LambdaExpression GetTenantFilter(Type type)
        {
            var parameter = Expression.Parameter(type, "it");
            var property = Expression.Property(parameter, nameof(IMultiTenant.CompanyId));
            var tenantId = Expression.Property(Expression.Constant(this), nameof(CurrentUserService));
            var tenantIdValue = Expression.Property(tenantId, nameof(ICurrentUserService.CompanyId));
            var comparison = Expression.Equal(property, tenantIdValue);
            return Expression.Lambda(comparison, parameter);
        }
    }
}