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

            if (!int.TryParse(portValue, out var port) || port <= 0)
                throw new ConfigurationException("SMTP_PORT");

            password = password.Trim().Trim('"', '\'');
            if (host.Contains("gmail", StringComparison.OrdinalIgnoreCase))
                password = password.Replace(" ", string.Empty);

            try
            {
                Console.WriteLine($"[EmailService] Preparing to send email to {toEmail}");
                
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(fromName, username));
                message.To.Add(MailboxAddress.Parse(toEmail));
                message.Subject = subject;

                var builder = new BodyBuilder { HtmlBody = html };
                message.Body = builder.ToMessageBody();

                using var smtp = new SmtpClient();
                smtp.Timeout = 15000; // Giảm xuống 15s để bắt lỗi nhanh hơn nếu kẹt mạng
                
                // Render có thể chặn cơ chế nâng cấp STARTTLS trên port 587.
                // Nếu dùng 465, bắt buộc SslOnConnect. 587 dùng StartTls.
                var secureOption = SecureSocketOptions.Auto;
                if (port == 465) secureOption = SecureSocketOptions.SslOnConnect;
                else if (port == 587) secureOption = SecureSocketOptions.StartTls;
                
                // Bỏ qua lỗi Check SSL giả mạo (rất hay gặp trên Docker/Linux cloud)
                smtp.ServerCertificateValidationCallback = (s, c, h, e) => true;
                
                Console.WriteLine($"[EmailService] 1. Attempting ConnectAsync to {host}:{port} with Option: {secureOption}");
                await smtp.ConnectAsync(host, port, secureOption);
                
                Console.WriteLine($"[EmailService] 2. Connected! Attempting AuthenticateAsync as {username}");
                await smtp.AuthenticateAsync(username, password);
                
                Console.WriteLine($"[EmailService] 3. Authenticated! Attempting SendAsync...");
                await smtp.SendAsync(message);
                
                Console.WriteLine($"[EmailService] 4. Sent successfully. Disconnecting...");
                await smtp.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] FATAL ERROR: {ex.GetType().Name} - {ex.Message}");
                if (ex.InnerException != null)
                {
                    Console.WriteLine($"[EmailService] Inner Exception: {ex.InnerException.Message}");
                }
                throw new ExternalServiceException($"Failed to send email: {ex.Message}");
            }
        }
    }
}
