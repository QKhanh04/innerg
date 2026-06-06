using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class TrainingEventConfiguration : IEntityTypeConfiguration<TrainingEvent>
    {
        public void Configure(EntityTypeBuilder<TrainingEvent> builder)
        {
            builder.Property(x => x.Title).IsRequired().HasMaxLength(255);
            
            builder.Property(x => x.Type)
                   .HasConversion<string>();

            builder.Property(x => x.Status)
                   .HasConversion<string>();

            builder.HasOne(x => x.Skill)
                   .WithMany()
                   .HasForeignKey(x => x.SkillId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.Trainer)
                   .WithMany()
                   .HasForeignKey(x => x.TrainerId)
                   .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
