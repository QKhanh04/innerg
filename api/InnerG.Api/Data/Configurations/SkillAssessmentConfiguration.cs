using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class SkillAssessmentConfiguration : IEntityTypeConfiguration<SkillAssessment>
    {
        public void Configure(EntityTypeBuilder<SkillAssessment> builder)
        {
            builder.HasOne(x => x.User)
                   .WithMany(u => u.AssessmentsReceived)
                   .HasForeignKey(x => x.UserId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Assessor)
                   .WithMany(u => u.AssessmentsGiven)
                   .HasForeignKey(x => x.AssessorUserId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasIndex(x => new { x.UserId, x.SkillId, x.Period });
        }
    }
}
