using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace InnerG.Api.Migrations
{
    /// <inheritdoc />
    public partial class InviteMultiTenantAuth : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql("""
                ALTER TABLE "Companies"
                    ADD COLUMN IF NOT EXISTS "Language" text NOT NULL DEFAULT 'vi';

                ALTER TABLE "Companies"
                    ADD COLUMN IF NOT EXISTS "Timezone" text NOT NULL DEFAULT 'Asia/Ho_Chi_Minh';

                CREATE TABLE IF NOT EXISTS "Invites" (
                    "Id" uuid NOT NULL,
                    "InviterId" uuid NULL,
                    "DepartmentId" uuid NULL,
                    "Email" character varying(256) NOT NULL,
                    "FullName" character varying(200) NULL,
                    "Position" character varying(150) NULL,
                    "RolesCsv" character varying(200) NOT NULL,
                    "TokenHash" character varying(128) NOT NULL,
                    "Status" character varying(30) NOT NULL DEFAULT 'PENDING',
                    "ExpiresAt" timestamp with time zone NOT NULL,
                    "AcceptedAt" timestamp with time zone NULL,
                    "RevokedAt" timestamp with time zone NULL,
                    "CreatedAt" timestamp with time zone NOT NULL,
                    "UpdatedAt" timestamp with time zone NULL,
                    "DeletedAt" timestamp with time zone NULL,
                    "CompanyId" uuid NOT NULL,
                    CONSTRAINT "PK_Invites" PRIMARY KEY ("Id"),
                    CONSTRAINT "FK_Invites_Companies_CompanyId"
                        FOREIGN KEY ("CompanyId") REFERENCES "Companies" ("Id") ON DELETE CASCADE,
                    CONSTRAINT "FK_Invites_Departments_DepartmentId"
                        FOREIGN KEY ("DepartmentId") REFERENCES "Departments" ("Id") ON DELETE SET NULL,
                    CONSTRAINT "FK_Invites_Users_InviterId"
                        FOREIGN KEY ("InviterId") REFERENCES "Users" ("Id") ON DELETE SET NULL
                );

                CREATE INDEX IF NOT EXISTS "IX_Invites_CompanyId_Email_Status"
                    ON "Invites" ("CompanyId", "Email", "Status");

                CREATE INDEX IF NOT EXISTS "IX_Invites_DepartmentId"
                    ON "Invites" ("DepartmentId");

                CREATE INDEX IF NOT EXISTS "IX_Invites_InviterId"
                    ON "Invites" ("InviterId");

                CREATE UNIQUE INDEX IF NOT EXISTS "IX_Invites_TokenHash"
                    ON "Invites" ("TokenHash");
                """);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
        }
    }
}
