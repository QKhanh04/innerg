using InnerG.Api.Models;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace InnerG.Api.Data.Configurations
{
    public class CompanyConfiguration : IEntityTypeConfiguration<Company>
    {
        public void Configure(EntityTypeBuilder<Company> builder)
        {
            builder.Property(x => x.Name)
                .IsRequired()
                .HasColumnType("text");

            builder.Property(x => x.Domain)
                .IsRequired()
                .HasColumnType("text");

            builder.Property(x => x.Timezone)
                .IsRequired()
                .HasColumnType("text")
                .HasDefaultValue("Asia/Ho_Chi_Minh");

            builder.Property(x => x.Language)
                .IsRequired()
                .HasColumnType("text")
                .HasDefaultValue("vi");
        }
    }
}
