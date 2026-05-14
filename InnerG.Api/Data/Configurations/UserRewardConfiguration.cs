using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class UserRewardConfiguration : IEntityTypeConfiguration<UserReward>
    {
        public void Configure(EntityTypeBuilder<UserReward> builder)
        {
            builder.Property(x => x.Status)
                   .HasConversion<string>();

            builder.HasOne(x => x.User)
                   .WithMany(u => u.Redemptions)
                   .HasForeignKey(x => x.UserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.Reward)
                   .WithMany(r => r.Redemptions)
                   .HasForeignKey(x => x.RewardId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
