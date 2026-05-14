using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class DepartmentConfiguration : IEntityTypeConfiguration<Department>
    {
        public void Configure(EntityTypeBuilder<Department> builder)
        {
            builder.HasIndex(x => new { x.CompanyId, x.Code })
                   .IsUnique()
                   .HasFilter("\"DeletedAt\" IS NULL");

            builder.HasOne(x => x.ParentDepartment)
                   .WithMany(x => x.SubDepartments)
                   .HasForeignKey(x => x.ParentDepartmentId)
                   .OnDelete(DeleteBehavior.Restrict);

            builder.HasOne(x => x.Manager)
                   .WithMany()
                   .HasForeignKey(x => x.ManagerUserId)
                   .OnDelete(DeleteBehavior.SetNull);
        }
    }
}
