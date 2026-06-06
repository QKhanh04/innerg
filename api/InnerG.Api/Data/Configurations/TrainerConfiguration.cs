using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class TrainerConfiguration : IEntityTypeConfiguration<Trainer>
    {
        public void Configure(EntityTypeBuilder<Trainer> builder)
        {
            builder.HasIndex(x => new { x.CompanyId, x.UserId })
                   .IsUnique()
                   .HasFilter("\"UserId\" IS NOT NULL AND \"DeletedAt\" IS NULL");

            builder.HasOne(x => x.User)
                   .WithMany(u => u.TrainerProfiles)
                   .HasForeignKey(x => x.UserId)
                   .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
