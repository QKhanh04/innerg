using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class TrainingEventTargetDepartmentConfiguration : IEntityTypeConfiguration<TrainingEventTargetDepartment>
    {
        public void Configure(EntityTypeBuilder<TrainingEventTargetDepartment> builder)
        {
            builder.HasIndex(x => new { x.TrainingEventId, x.DepartmentId })
                   .IsUnique();

            builder.HasOne(x => x.TrainingEvent)
                   .WithMany(e => e.TargetDepartments)
                   .HasForeignKey(x => x.TrainingEventId)
                   .OnDelete(DeleteBehavior.Cascade);

            builder.HasOne(x => x.Department)
                   .WithMany()
                   .HasForeignKey(x => x.DepartmentId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
