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
<<<<<<< HEAD

=======
>>>>>>> 29e95a9290ea4fdcb6d0bfb5f63729e448469c51
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
