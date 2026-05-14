using System;
using InnerG.Api.Common.Models;

namespace InnerG.Api.Models
{
    public class WishlistVote : BaseEntity
    {
        public Guid WishlistId { get; set; }
        public Guid UserId { get; set; }

        public virtual LearningWishlist Wishlist { get; set; } = null!;
        public virtual AppUser User { get; set; } = null!;
    }
}
