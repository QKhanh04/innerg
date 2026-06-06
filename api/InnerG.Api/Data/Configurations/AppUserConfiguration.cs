using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class AppUserConfiguration : IEntityTypeConfiguration<AppUser>
    {
        public void Configure(EntityTypeBuilder<AppUser> builder)
        {
            builder.Property(x => x.CompanyId).IsRequired(false);

            // Unique: (CompanyId, Email)
            builder.HasIndex(x => new { x.CompanyId, x.Email })
                .IsUnique()
                .HasFilter("\"DeletedAt\" IS NULL");

            // Indexes
            builder.HasIndex(x => x.CompanyId);
            builder.HasIndex(x => x.DepartmentId);
            builder.HasIndex(x => x.SsoUid);
            builder.HasIndex(x => x.IsActive);

            // SsoProvider as Enum string or simple varchar
            builder.Property(x => x.SsoProvider).HasMaxLength(50);
            
            // Other properties
            builder.Property(x => x.FullName).IsRequired().HasMaxLength(255);
            builder.Property(x => x.JobTitle).HasMaxLength(100);
            builder.Property(x => x.PhoneInternal).HasMaxLength(20);
            builder.Property(x => x.TwoFactorSecret).HasMaxLength(100);
        }
    }
}
