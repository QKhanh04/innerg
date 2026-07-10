using InnerG.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InnerG.Api.Data.Configurations
{
    public class PushSubscriptionConfiguration : IEntityTypeConfiguration<PushSubscription>
    {
        public void Configure(EntityTypeBuilder<PushSubscription> builder)
        {
            builder.ToTable("PushSubscriptions");

            builder.Property(x => x.Endpoint)
                .IsRequired()
                .HasMaxLength(2048);

            builder.Property(x => x.P256dh)
                .IsRequired()
                .HasMaxLength(512);

            builder.Property(x => x.Auth)
                .IsRequired()
                .HasMaxLength(256);

            builder.Property(x => x.UserAgent)
                .HasMaxLength(512);

            builder.HasIndex(x => new { x.UserId, x.Endpoint }).IsUnique();

            builder.HasOne(x => x.User)
                .WithMany()
                .HasForeignKey(x => x.UserId)
                .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
