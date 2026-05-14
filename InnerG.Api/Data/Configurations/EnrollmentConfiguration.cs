using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class EnrollmentConfiguration : IEntityTypeConfiguration<Enrollment>
    {
        public void Configure(EntityTypeBuilder<Enrollment> builder)
        {
            builder.Property(x => x.Status)
                   .HasConversion<string>();

            builder.HasIndex(x => new { x.TrainingEventId, x.UserId })
                   .IsUnique()
                   .HasFilter("\"DeletedAt\" IS NULL");
        }
    }
}
