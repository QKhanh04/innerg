using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;
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
                
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(fromName, username));
                message.To.Add(MailboxAddress.Parse(toEmail));
                message.Subject = subject;

                var builder = new BodyBuilder { HtmlBody = html };
                message.Body = builder.ToMessageBody();

                using var smtp = new SmtpClient();
                smtp.Timeout = 30000; // 30 seconds timeout
                
                // SecureSocketOptions.Auto allows MailKit to automatically select the most secure
                // protocol (SSL, TLS, StartTLS) based on the port and server capabilities.
                var secureOption = enableSsl ? SecureSocketOptions.Auto : SecureSocketOptions.None;
                
                await smtp.ConnectAsync(host, port, secureOption);
                await smtp.AuthenticateAsync(username, password);
                await smtp.SendAsync(message);
                await smtp.DisconnectAsync(true);
                
                Console.WriteLine($"[EmailService] SMTP send completed for {toEmail}");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] General exception for {toEmail}: {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[EmailService] Inner Exception: {ex.InnerException.Message}");
                }
                throw new ExternalServiceException($"Failed to send email: {ex.Message}");
            }
        }
    }
}
