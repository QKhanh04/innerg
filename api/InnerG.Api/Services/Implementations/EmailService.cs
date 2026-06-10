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
            var host = _config["SMTP_HOST"] ?? "smtp.gmail.com";
            var portValue = _config["SMTP_PORT"] ?? "587";
            var username = _config["SMTP_USERNAME"];
            var password = _config["SMTP_PASSWORD"];
            var fromName = _config["SMTP_FROM_NAME"] ?? "InnerG Support";

            if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
            {
                Console.WriteLine("[EmailService] SMTP credentials are not configured properly.");
                throw new ConfigurationException("SMTP_USERNAME or SMTP_PASSWORD is missing.");
            }

            if (!int.TryParse(portValue, out var port))
                port = 587;

            // Xóa khoảng trắng thừa trong mật khẩu sinh ra từ App Password
            password = password.Trim().Trim('"', '\'');
            if (host.Contains("gmail", StringComparison.OrdinalIgnoreCase))
                password = password.Replace(" ", string.Empty);

            try
            {
                var message = new MimeMessage();
                message.From.Add(new MailboxAddress(fromName, username));
                message.To.Add(MailboxAddress.Parse(toEmail));
                message.Subject = subject;

                var builder = new BodyBuilder { HtmlBody = html };
                message.Body = builder.ToMessageBody();

                // Xác định Option bảo mật dựa theo Port giống hệt mẫu
                var secureOption = SecureSocketOptions.StartTls;
                if (port == 465) secureOption = SecureSocketOptions.SslOnConnect;

                using var smtp = new SmtpClient();
                // Bỏ qua chứng chỉ SSL giả mạo trên Docker (tuỳ chọn an toàn cho Render)
                smtp.ServerCertificateValidationCallback = (s, c, h, e) => true;

                await smtp.ConnectAsync(host, port, secureOption);
                await smtp.AuthenticateAsync(username, password);
                await smtp.SendAsync(message);
                await smtp.DisconnectAsync(true);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[EmailService] Failed to send email: {ex.Message}");
                throw new ExternalServiceException($"Failed to send email: {ex.Message}");
            }
        }
    }
}
