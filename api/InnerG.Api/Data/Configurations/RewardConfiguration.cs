using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class RewardConfiguration : IEntityTypeConfiguration<Reward>
    {
        public void Configure(EntityTypeBuilder<Reward> builder)
        {
            builder.Property(x => x.Name).IsRequired().HasMaxLength(255);
            
            builder.Property(x => x.Type)
                   .HasConversion<string>();

            builder.HasIndex(x => new { x.CompanyId, x.Name })
                   .IsUnique()
                   .HasFilter("\"DeletedAt\" IS NULL");
        }
    }
}
