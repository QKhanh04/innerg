using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class TrainingSessionConfiguration : IEntityTypeConfiguration<TrainingSession>
    {
        public void Configure(EntityTypeBuilder<TrainingSession> builder)
        {
            builder.HasOne(x => x.MeetingRoom)
                   .WithMany(r => r.Sessions)
                   .HasForeignKey(x => x.MeetingRoomId)
                   .OnDelete(DeleteBehavior.SetNull);

            builder.HasIndex(x => new { x.MeetingRoomId, x.StartTime, x.EndTime })
                   .HasFilter("\"MeetingRoomId\" IS NOT NULL AND \"DeletedAt\" IS NULL");
        }
    }
}
