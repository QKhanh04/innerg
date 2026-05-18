using System;
using InnerG.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InnerG.Api.Data.Configurations
{
    public class UserSessionConfiguration : IEntityTypeConfiguration<UserSession>
    {
        public void Configure(EntityTypeBuilder<UserSession> builder)
        {
            builder.ToTable("UserSessions");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.TokenHash)
                   .IsRequired()
                   .HasMaxLength(512);

            builder.HasIndex(x => x.TokenHash)
                   .IsUnique();

            builder.Property(x => x.CreatedAt)
                   .HasDefaultValueSql("CURRENT_TIMESTAMP");

            builder.Property(x => x.ExpiresAt)
                   .IsRequired();

            builder.Property(x => x.IsActive)
                   .HasDefaultValue(true);

            // Relation: UserSession → AppUser
            builder.HasOne(x => x.User)
                   .WithMany(u => u.Sessions)
                   .HasForeignKey(x => x.UserId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
