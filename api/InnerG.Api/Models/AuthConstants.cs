namespace InnerG.Api.Models
{
    public static class AuthRoles
    {
        public const string Mentee = "Mentee";
        public const string Mentor = "Mentor";
        public const string HR = "HR";
        public const string SystemAdmin = "SystemAdmin";

        public static readonly string[] CompanyRoles =
        [
            Mentee,
            Mentor,
            HR
        ];
    }

    public static class InviteStatus
    {
        public const string Pending = "PENDING";
        public const string Accepted = "ACCEPTED";
        public const string Expired = "EXPIRED";
        public const string Revoked = "REVOKED";
    }
}
