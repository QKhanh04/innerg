using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InnerG.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddGeminiFileUriToResource : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "GeminiFileUri",
                table: "Resources",
                type: "text",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "GeminiFileUri",
                table: "Resources");
        }
    }
}
