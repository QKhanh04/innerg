using InnerG.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InnerG.Api.Data.Configurations
{
    public class InviteConfiguration : IEntityTypeConfiguration<Invite>
    {
        public void Configure(EntityTypeBuilder<Invite> builder)
        {
            builder.ToTable("Invites");

            builder.HasKey(x => x.Id);

            builder.Property(x => x.Email)
                .IsRequired()
                .HasMaxLength(256);

            builder.Property(x => x.FullName)
                .HasMaxLength(200);

            builder.Property(x => x.Position)
                .HasMaxLength(150);

            builder.Property(x => x.RolesCsv)
                .IsRequired()
                .HasMaxLength(200);

            builder.Property(x => x.TokenHash)
                .IsRequired()
                .HasMaxLength(128);

            builder.Property(x => x.Status)
                .IsRequired()
                .HasMaxLength(30)
                .HasDefaultValue(InviteStatus.Pending);

            builder.HasIndex(x => x.TokenHash)
                .IsUnique();

            builder.HasIndex(x => new { x.CompanyId, x.Email, x.Status });

            builder.HasOne(x => x.Company)
                .WithMany(x => x.Invites)
                .HasForeignKey(x => x.CompanyId)
                .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Inviter)
                .WithMany(x => x.SentInvites)
                .HasForeignKey(x => x.InviterId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.HasOne(x => x.Department)
                .WithMany(x => x.Invites)
                .HasForeignKey(x => x.DepartmentId)
                .OnDelete(DeleteBehavior.SetNull);

            builder.Ignore(x => x.Roles);
        }
    }
}
