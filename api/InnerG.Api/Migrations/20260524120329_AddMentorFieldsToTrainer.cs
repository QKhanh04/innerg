using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InnerG.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddMentorFieldsToTrainer : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Commented out to fix "column already exists" error during auto-migration
            
            migrationBuilder.AddColumn<double>(
                name: "AvgRating",
                table: "Trainers",
                type: "double precision",
                nullable: false,
                defaultValue: 0.0);

            migrationBuilder.AddColumn<string>(
                name: "MentorStatus",
                table: "Trainers",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "TotalClassesTaught",
                table: "Trainers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "TotalStudents",
                table: "Trainers",
                type: "integer",
                nullable: false,
                defaultValue: 0);

        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AvgRating",
                table: "Trainers");

            migrationBuilder.DropColumn(
                name: "MentorStatus",
                table: "Trainers");

            migrationBuilder.DropColumn(
                name: "TotalClassesTaught",
                table: "Trainers");

            migrationBuilder.DropColumn(
                name: "TotalStudents",
                table: "Trainers");
        }
    }
}
