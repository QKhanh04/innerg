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

            builder.HasOne(x => x.User)
                   .WithMany(u => u.Wishlists)
                   .HasForeignKey(x => x.UserId)
                   .OnDelete(DeleteBehavior.Cascade);
        }
    }
}
