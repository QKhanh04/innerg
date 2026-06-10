using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using InnerG.Api.Exceptions;
using InnerG.Api.Services.Interfaces;

namespace InnerG.Api.Services.Implementations
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly HttpClient _httpClient;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, HttpClient httpClient, ILogger<EmailService> logger)
        {
            _config = config;
            _httpClient = httpClient;
            _logger = logger;
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
            var apiKey = _config["RESEND_API_KEY"];
            var from = _config["Mail_From"] ?? "onboarding@resend.dev";
            var fromName = _config["MAIL_FROM_NAME"] ?? "InnerG Support";

            if (string.IsNullOrWhiteSpace(apiKey))
                throw new ConfigurationException("RESEND_API_KEY is missing.");

            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, "emails");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                request.Content = new StringContent(
                    JsonSerializer.Serialize(new ResendEmailRequest
                    {
                        From = $"{fromName} <{from}>",
                        To = [toEmail],
                        Subject = subject,
                        Html = html
                    }),
                    Encoding.UTF8,
                    "application/json");

                using var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                    return;

                var responseBody = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("Resend email sending failed with status {StatusCode}: {ResponseBody}", response.StatusCode, responseBody);
                throw new ExternalServiceException($"Failed to send email via Resend: {(int)response.StatusCode} {response.ReasonPhrase}");
            }
            catch (Exception ex)
            {
                if (ex is ExternalServiceException or ConfigurationException)
                    throw;

                _logger.LogError(ex, "Unexpected error while sending email via Resend");
                throw new ExternalServiceException($"Failed to send email via Resend: {ex.Message}");
            }
        }

        private sealed class ResendEmailRequest
        {
            public string From { get; set; } = string.Empty;
            public string[] To { get; set; } = [];
            public string Subject { get; set; } = string.Empty;
            public string Html { get; set; } = string.Empty;
        }
    }
}
