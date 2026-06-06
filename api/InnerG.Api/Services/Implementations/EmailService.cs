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

        public async Task SendEmailAsync(string to, string subject, string body, bool isHtml = true)
        {
            if (isHtml)
                await SendHtmlEmailAsync(to, subject, body);
            else
            {
                // Simple plain text send if needed, but SendHtmlEmailAsync currently handles html
                // For now, reuse SendHtmlEmailAsync as it's the core sender
                await SendHtmlEmailAsync(to, subject, body);
            }
        }

        private async Task SendHtmlEmailAsync(string toEmail, string subject, string html)
        {
            var host = _config["SMTP_HOST"] ?? throw new ConfigurationException("SMTP_HOST");
            var portValue = _config["SMTP_PORT"] ?? throw new ConfigurationException("SMTP_PORT");
            var username = _config["SMTP_USERNAME"] ?? throw new ConfigurationException("SMTP_USERNAME");
            var password = _config["SMTP_PASSWORD"] ?? throw new ConfigurationException("SMTP_PASSWORD");
            var fromName = _config["SMTP_FROM_NAME"] ?? "Support";
            var enableSsl = bool.TryParse(_config["SMTP_ENABLE_SSL"], out var configuredSsl) ? configuredSsl : true;

            if (!int.TryParse(portValue, out var port) || port <= 0)
                throw new ConfigurationException("SMTP_PORT");

            password = password.Trim().Trim('"', '\'');
            if (host.Contains("gmail", StringComparison.OrdinalIgnoreCase))
                password = password.Replace(" ", string.Empty);

            try
            {
                Console.WriteLine($"[EmailService] Preparing to send email to {toEmail} via {host}:{port}");
                var message = new MailMessage
                {
                    Subject = subject,
                    Body = html,
                    IsBodyHtml = true,
                    From = new MailAddress(username, fromName)
                };

                message.To.Add(toEmail);

                using var smtp = new SmtpClient(host, port)
                {
                    UseDefaultCredentials = false,
                    Credentials = new NetworkCredential(username, password),
                    EnableSsl = enableSsl,
                    DeliveryMethod = SmtpDeliveryMethod.Network,
                    Timeout = 30000 // 30 seconds
                };

                await smtp.SendMailAsync(message);
                Console.WriteLine($"[EmailService] SMTP send completed for {toEmail}");
            }
            catch (SmtpException ex)
            {
                Console.WriteLine($"[EmailService] SmtpException for {toEmail}: {ex.Message}");
                throw new ExternalServiceException($"Failed to send email: {ex.Message}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] General exception for {toEmail}: {ex.Message}");
                throw;
            }
        }
    }
}
