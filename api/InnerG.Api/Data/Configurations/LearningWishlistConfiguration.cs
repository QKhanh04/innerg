using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using InnerG.Api.Models;

namespace InnerG.Api.Data.Configurations
{
    public class LearningWishlistConfiguration : IEntityTypeConfiguration<LearningWishlist>
    {
        public void Configure(EntityTypeBuilder<LearningWishlist> builder)
        {
            builder.Property(x => x.Status)
                   .HasConversion<string>();

            builder.Property(x => x.Category)
                   .HasMaxLength(100);

            builder.Property(x => x.Description)
                   .HasMaxLength(1500);

            builder.HasOne(x => x.User)
                   .WithMany(u => u.Wishlists)
                   .HasForeignKey(x => x.UserId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
