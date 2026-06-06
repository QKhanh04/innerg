using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class SkillConfiguration : IEntityTypeConfiguration<Skill>
    {
        public void Configure(EntityTypeBuilder<Skill> builder)
        {
            builder.Property(x => x.Name).IsRequired().HasMaxLength(100);

            builder.HasIndex(x => new { x.CompanyId, x.Name })
                   .IsUnique()
                   .HasFilter("\"DeletedAt\" IS NULL");
        }
    }
}
