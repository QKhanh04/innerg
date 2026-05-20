using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class CompanySubscriptionConfiguration : IEntityTypeConfiguration<CompanySubscription>
    {
        public void Configure(EntityTypeBuilder<CompanySubscription> builder)
        {
            builder.Property(x => x.Status).HasConversion<string>();
            builder.HasIndex(x => new { x.CompanyId, x.Status });
        }
    }

    public class UserIntegrationConfiguration : IEntityTypeConfiguration<UserIntegration>
    {
        public void Configure(EntityTypeBuilder<UserIntegration> builder)
        {
            builder.Property(x => x.Provider).HasConversion<string>();
            builder.HasIndex(x => new { x.UserId, x.Provider }).IsUnique();
        }
    }
}
