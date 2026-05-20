using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class TrainerSkillConfiguration : IEntityTypeConfiguration<TrainerSkill>
    {
        public void Configure(EntityTypeBuilder<TrainerSkill> builder)
        {
            builder.HasIndex(x => new { x.TrainerId, x.SkillId })
                   .IsUnique()
                   .HasFilter("\"DeletedAt\" IS NULL");
        }
    }
}
