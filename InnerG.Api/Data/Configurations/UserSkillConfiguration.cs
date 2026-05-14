using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class UserSkillConfiguration : IEntityTypeConfiguration<UserSkill>
    {
        public void Configure(EntityTypeBuilder<UserSkill> builder)
        {
            builder.HasIndex(x => new { x.UserId, x.SkillId })
                   .IsUnique()
                   .HasFilter("\"DeletedAt\" IS NULL");

            builder.HasOne(x => x.VerifiedByUser)
                   .WithMany()
                   .HasForeignKey(x => x.VerifiedByUserId)
                   .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
