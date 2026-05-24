using FluentValidation;
using InnerG.Api.DTOs;

namespace InnerG.Api.Validators
{
    public class AcceptInviteRequestValidator : AbstractValidator<AcceptInviteRequest>
    {
        public AcceptInviteRequestValidator()
        {
            RuleFor(x => x.Token).NotEmpty();

            RuleFor(x => x.FullName)
                .NotEmpty()
                .MaximumLength(200);

            RuleFor(x => x.Password)
                .NotEmpty()
                .MinimumLength(8)
                .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter")
                .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter")
                .Matches("[0-9]").WithMessage("Password must contain at least one digit");

            RuleFor(x => x.ConfirmPassword)
                .Equal(x => x.Password)
                .WithMessage("Passwords do not match");
        }
    }

    public class CreateInviteRequestValidator : AbstractValidator<CreateInviteRequest>
    {
        public CreateInviteRequestValidator()
        {
            RuleFor(x => x.Email)
                .NotEmpty()
                .EmailAddress();

            RuleFor(x => x.FullName)
                .MaximumLength(200);

            RuleFor(x => x.Position)
                .MaximumLength(150);

            RuleForEach(x => x.Roles)
                .NotEmpty();
        }
    }

    public class BulkInviteRequestValidator : AbstractValidator<BulkInviteRequest>
    {
        public BulkInviteRequestValidator()
        {
            RuleFor(x => x.Invites)
                .NotEmpty()
                .Must(x => x.Count <= 500)
                .WithMessage("Bulk invite supports up to 500 rows per request");

            RuleForEach(x => x.Invites)
                .SetValidator(new CreateInviteRequestValidator());
        }
    }

    public class BootstrapCompanyRequestValidator : AbstractValidator<BootstrapCompanyRequest>
    {
        public BootstrapCompanyRequestValidator()
        {
            RuleFor(x => x.CompanyName).NotEmpty().MaximumLength(200);
            RuleFor(x => x.EmailDomain).NotEmpty().MaximumLength(120);
            RuleFor(x => x.HrFullName).NotEmpty().MaximumLength(200);
            RuleFor(x => x.HrEmail).NotEmpty().EmailAddress();

            RuleFor(x => x.HrPassword)
                .NotEmpty()
                .MinimumLength(8)
                .Matches("[A-Z]").WithMessage("Password must contain at least one uppercase letter")
                .Matches("[a-z]").WithMessage("Password must contain at least one lowercase letter")
                .Matches("[0-9]").WithMessage("Password must contain at least one digit");

            RuleFor(x => x.ConfirmPassword)
                .Equal(x => x.HrPassword)
                .WithMessage("Passwords do not match");
        }
    }

    public class CreateCompanyRequestValidator : AbstractValidator<CreateCompanyRequest>
    {
        public CreateCompanyRequestValidator()
        {
            RuleFor(x => x.CompanyName).NotEmpty().MaximumLength(200);
            RuleFor(x => x.EmailDomain).NotEmpty().MaximumLength(120);
            RuleFor(x => x.HrEmail).NotEmpty().EmailAddress();
            RuleFor(x => x.HrFullName).MaximumLength(200);
        }
    }

    public class TwoFactorVerifyRequestValidator : AbstractValidator<TwoFactorVerifyRequest>
    {
        public TwoFactorVerifyRequestValidator()
        {
            RuleFor(x => x.Code).NotEmpty().Length(6);
        }
    }
}
