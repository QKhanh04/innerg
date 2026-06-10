using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InnerG.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddResourceModerationState : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ModerationStatus",
                table: "Resources",
                type: "varchar(50)",
                nullable: false,
                defaultValue: "PendingReview");

            migrationBuilder.AddColumn<string>(
                name: "ReviewNotes",
                table: "Resources",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "Resources",
                type: "timestamp with time zone",
                nullable: true);

            migrationBuilder.Sql("""
                UPDATE "Resources"
                SET "ModerationStatus" = CASE
                    WHEN "IsPublic" = TRUE THEN 'Approved'
                    ELSE 'PendingReview'
                END
                WHERE "ModerationStatus" = 'PendingReview'
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ModerationStatus",
                table: "Resources");

            migrationBuilder.DropColumn(
                name: "ReviewNotes",
                table: "Resources");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "Resources");
        }
    }
}
