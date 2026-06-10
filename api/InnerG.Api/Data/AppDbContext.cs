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
        public DbSet<Invite> Invites => Set<Invite>();
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
        public DbSet<BillingRecord> BillingRecords => Set<BillingRecord>();
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
        public DbSet<ModerationEscalationReport> ModerationEscalationReports => Set<ModerationEscalationReport>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Rename Identity Tables to match Schema
            builder.Entity<AppUser>().ToTable("Users");
            builder.Entity<AppRole>().ToTable("Roles");
            builder.Entity<IdentityUserRole<Guid>>().ToTable("UserRoles");
            builder.Entity<IdentityUserClaim<Guid>>().ToTable("UserClaims");
            builder.Entity<IdentityUserLogin<Guid>>().ToTable("UserLogins");
            builder.Entity<IdentityUserToken<Guid>>().ToTable("UserTokens");
            builder.Entity<IdentityRoleClaim<Guid>>().ToTable("RoleClaims");

            // Apply Configurations
            builder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);

            // Global configurations
            foreach (var entityType in builder.Model.GetEntityTypes())
            {
                if (typeof(ISoftDelete).IsAssignableFrom(entityType.ClrType) ||
                    typeof(IMultiTenant).IsAssignableFrom(entityType.ClrType))
                {
                    builder.Entity(entityType.ClrType).HasQueryFilter(GetGlobalFilter(entityType.ClrType));
                }

                // Global Enum to String Conversion
                foreach (var property in entityType.GetProperties())
                {
                    var type = property.ClrType;
                    var isNullable = Nullable.GetUnderlyingType(type) != null;
                    var enumType = isNullable ? Nullable.GetUnderlyingType(type) : type;

                    if (enumType != null && enumType.IsEnum)
                    {
                        property.SetColumnType("varchar(50)");
                        var converterType = typeof(Microsoft.EntityFrameworkCore.Storage.ValueConversion.EnumToStringConverter<>).MakeGenericType(enumType);
                        var converter = (Microsoft.EntityFrameworkCore.Storage.ValueConversion.ValueConverter)Activator.CreateInstance(converterType)!;
                        property.SetValueConverter(converter);
                    }
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
        private LambdaExpression GetGlobalFilter(Type type)
        {
            var parameter = Expression.Parameter(type, "it");
            Expression? filter = null;

            if (typeof(ISoftDelete).IsAssignableFrom(type))
            {
                var deletedAt = Expression.Property(parameter, nameof(ISoftDelete.DeletedAt));
                var notDeleted = Expression.Equal(deletedAt, Expression.Constant(null, typeof(DateTime?)));
                filter = notDeleted;
            }

            if (typeof(IMultiTenant).IsAssignableFrom(type))
            {
                var companyId = Expression.Property(parameter, nameof(IMultiTenant.CompanyId));
                var currentUserService = Expression.Property(Expression.Constant(this), nameof(CurrentUserService));
                var tenantId = Expression.Property(currentUserService, nameof(ICurrentUserService.CompanyId));
                var isSystemAdmin = Expression.Property(currentUserService, nameof(ICurrentUserService.IsSystemAdmin));
                var tenantMatches = Expression.Equal(companyId, tenantId);
                var tenantFilter = Expression.OrElse(isSystemAdmin, tenantMatches);
                filter = filter == null ? tenantFilter : Expression.AndAlso(filter, tenantFilter);
            }

            return Expression.Lambda(filter ?? Expression.Constant(true), parameter);
        }
    }
}

