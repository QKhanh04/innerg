using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class SessionAttendanceConfiguration : IEntityTypeConfiguration<SessionAttendance>
    {
        public void Configure(EntityTypeBuilder<SessionAttendance> builder)
        {
            builder.Property(x => x.Status)
                   .HasConversion<string>();

            builder.HasIndex(x => new { x.TrainingSessionId, x.UserId })
                   .IsUnique()
                   .HasFilter("\"DeletedAt\" IS NULL");
        }
    }
}
