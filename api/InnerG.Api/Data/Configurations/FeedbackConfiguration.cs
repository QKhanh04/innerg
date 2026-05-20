using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class FeedbackConfiguration : IEntityTypeConfiguration<Feedback>
    {
        public void Configure(EntityTypeBuilder<Feedback> builder)
        {
            builder.HasIndex(x => new { x.TrainingSessionId, x.ReviewerUserId, x.RevieweeUserId, x.RevieweeTrainerId })
                   .IsUnique()
                   .HasFilter("\"DeletedAt\" IS NULL");

            builder.HasOne(x => x.Reviewer)
                   .WithMany(u => u.Feedbacks)
                   .HasForeignKey(x => x.ReviewerUserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.RevieweeUser)
                   .WithMany()
                   .HasForeignKey(x => x.RevieweeUserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.RevieweeTrainer)
                   .WithMany()
                   .HasForeignKey(x => x.RevieweeTrainerId)
                   .OnDelete(DeleteBehavior.SetNull);
            
            builder.Property(x => x.ReviewerRole).HasConversion<string>();
        }
    }
}
