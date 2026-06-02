using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class ResourceConfiguration : IEntityTypeConfiguration<Resource>
    {
        public void Configure(EntityTypeBuilder<Resource> builder)
        {
            builder.Property(x => x.Type)
                   .HasConversion<string>();

            builder.HasOne(x => x.TrainingEvent)
                   .WithMany(t => t.Resources)
                   .HasForeignKey(x => x.TrainingEventId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
