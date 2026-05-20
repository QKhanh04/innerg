using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InnerG.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddCategoryAndDescriptionToWishlist : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "LearningWishlists",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "LearningWishlists",
                type: "character varying(1500)",
                maxLength: 1500,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "LearningWishlists");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "LearningWishlists");
        }
    }
}
