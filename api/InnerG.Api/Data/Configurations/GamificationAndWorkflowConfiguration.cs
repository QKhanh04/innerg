using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class UserBadgeConfiguration : IEntityTypeConfiguration<UserBadge>
    {
        public void Configure(EntityTypeBuilder<UserBadge> builder)
        {
            builder.HasIndex(x => new { x.UserId, x.BadgeId }).IsUnique();
        }
    }

    public class TrainerInvitationConfiguration : IEntityTypeConfiguration<TrainerInvitation>
    {
        public void Configure(EntityTypeBuilder<TrainerInvitation> builder)
        {
            builder.Property(x => x.Status).HasConversion<string>();
            builder.HasOne(x => x.InvitedUser).WithMany().HasForeignKey(x => x.InvitedUserId).OnDelete(DeleteBehavior.SetNull);
            builder.HasOne(x => x.InvitedTrainer).WithMany().HasForeignKey(x => x.InvitedTrainerId).OnDelete(DeleteBehavior.SetNull);
        }
    }
}
