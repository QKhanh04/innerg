using System.Net;
using System.Net.Mail;
using InnerG.Api.Exceptions;
using InnerG.Api.Services.Interfaces;

namespace InnerG.Api.Services.Implementations
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;

        public EmailService(IConfiguration config)
        {
            _config = config;
        }

        public Task SendEmailConfirmationAsync(string toEmail, string subject, string html)
        {
            return SendHtmlEmailAsync(toEmail, subject, html);
        }

        public Task SendPasswordResetAsync(string toEmail, string subject, string html)
        {
            return SendHtmlEmailAsync(toEmail, subject, html);
        }

        public Task SendInviteAsync(string toEmail, string subject, string html)
        {
            return SendHtmlEmailAsync(toEmail, subject, html);
        }

        public Task SendTwoFactorCodeAsync(string toEmail, string subject, string html)
        {
            return SendHtmlEmailAsync(toEmail, subject, html);
        }

        private async Task SendHtmlEmailAsync(string toEmail, string subject, string html)
        {
            var host = _config["SMTP_HOST"] ?? throw new ConfigurationException("SMTP_HOST");
            var username = _config["SMTP_USERNAME"] ?? throw new ConfigurationException("SMTP_USERNAME");
            var password = _config["SMTP_PASSWORD"] ?? throw new ConfigurationException("SMTP_PASSWORD");
            var fromName = _config["SMTP_FROM_NAME"] ?? "Support";
            var portStr = _config["SMTP_PORT"] ?? "587";
            int.TryParse(portStr, out var port);

            try
            {
                var message = new MailMessage
                {
                    Subject = subject,
                    Body = html,
                    IsBodyHtml = true,
                    From = new MailAddress(username, fromName)
                };

                message.To.Add(toEmail);

                using var smtp = new SmtpClient(host, port > 0 ? port : 587)
                {
                    Credentials = new NetworkCredential(username, password),
                    EnableSsl = true
                };

                await smtp.SendMailAsync(message);
            }
            catch (Exception ex)
            {
                // Bao gồm lỗi gốc để dễ debug
                throw new ExternalServiceException($"Failed to send email: {ex.Message}", ex);
            }
        }
    }
}
