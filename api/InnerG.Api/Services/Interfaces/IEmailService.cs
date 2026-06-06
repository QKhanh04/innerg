using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace InnerG.Api.Services.Interfaces
{
    public interface IEmailService
    {
        Task SendEmailConfirmationAsync(string to, string subject, string html);
        Task SendPasswordResetAsync(string to, string subject, string html);
        Task SendInviteAsync(string to, string subject, string html);
        Task SendTwoFactorCodeAsync(string to, string subject, string html);
        Task SendEmailAsync(string to, string subject, string body, bool isHtml = true);
    }
}
