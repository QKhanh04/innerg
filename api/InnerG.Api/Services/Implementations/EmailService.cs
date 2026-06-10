using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
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
            var apiKey = _config["SENDGRID_API_KEY"];
            var from = _config["MAIL_FROM"] ?? string.Empty;
            var fromName = _config["MAIL_FROM_NAME"] ?? "InnerG Support";

            if (string.IsNullOrWhiteSpace(apiKey))
                throw new ConfigurationException("SENDGRID_API_KEY is missing.");
            if (string.IsNullOrWhiteSpace(from))
                throw new ConfigurationException("MAIL_FROM is missing.");

            try
            {
                using var request = new HttpRequestMessage(HttpMethod.Post, "mail/send");
                request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", apiKey);
                request.Content = new StringContent(
                    JsonSerializer.Serialize(new SendGridMailRequest
                    {
                        Personalizations =
                        [
                            new SendGridPersonalization
                            {
                                To =
                                [
                                    new SendGridEmailAddress
                                    {
                                        Email = toEmail
                                    }
                                ]
                            }
                        ],
                        From = new SendGridEmailAddress
                        {
                            Email = from.Trim(),
                            Name = string.IsNullOrWhiteSpace(fromName) ? null : fromName.Trim()
                        },
                        Subject = subject,
                        Content =
                        [
                            new SendGridContent
                            {
                                Type = "text/html",
                                Value = html
                            }
                        ]
                    }),
                    Encoding.UTF8,
                    "application/json");

                using var response = await _httpClient.SendAsync(request);
                if (response.IsSuccessStatusCode)
                    return;

                var responseBody = await response.Content.ReadAsStringAsync();
                _logger.LogWarning("SendGrid email sending failed with status {StatusCode}: {ResponseBody}", response.StatusCode, responseBody);
                throw new ExternalServiceException(BuildSendGridErrorMessage(response.StatusCode, response.ReasonPhrase, responseBody));
            }
            catch (Exception ex)
            {
                if (ex is ExternalServiceException or ConfigurationException)
                    throw;

                _logger.LogError(ex, "Unexpected error while sending email via SendGrid");
                throw new ExternalServiceException($"Failed to send email via SendGrid: {ex.Message}");
            }
        }

        private static string BuildSendGridErrorMessage(System.Net.HttpStatusCode statusCode, string? reasonPhrase, string responseBody)
        {
            var details = TryExtractSendGridErrorDetail(responseBody);
            if (!string.IsNullOrWhiteSpace(details))
                return $"Failed to send email via SendGrid: {(int)statusCode} {reasonPhrase}. {details}";

            return $"Failed to send email via SendGrid: {(int)statusCode} {reasonPhrase}";
        }

        private static string? TryExtractSendGridErrorDetail(string responseBody)
        {
            if (string.IsNullOrWhiteSpace(responseBody))
                return null;

            try
            {
                using var document = JsonDocument.Parse(responseBody);
                var root = document.RootElement;

                var pieces = new List<string>();
                if (root.TryGetProperty("errors", out var errors) && errors.ValueKind == JsonValueKind.Array)
                {
                    foreach (var error in errors.EnumerateArray())
                    {
                        var message = error.TryGetProperty("message", out var messageElement) && messageElement.ValueKind == JsonValueKind.String
                            ? messageElement.GetString()
                            : null;
                        var field = error.TryGetProperty("field", out var fieldElement) && fieldElement.ValueKind == JsonValueKind.String
                            ? fieldElement.GetString()
                            : null;

                        if (!string.IsNullOrWhiteSpace(message) && !string.IsNullOrWhiteSpace(field))
                            pieces.Add($"{field}: {message}");
                        else if (!string.IsNullOrWhiteSpace(message))
                            pieces.Add(message);
                    }
                }

                if (pieces.Count > 0)
                    return string.Join("; ", pieces);
            }
            catch (JsonException)
            {
                // Fall back to raw text below.
            }

            return responseBody.Trim();
        }

        private sealed class SendGridMailRequest
        {
            [JsonPropertyName("personalizations")]
            public SendGridPersonalization[] Personalizations { get; set; } = [];

            [JsonPropertyName("from")]
            public SendGridEmailAddress From { get; set; } = new();

            [JsonPropertyName("subject")]
            public string Subject { get; set; } = string.Empty;

            [JsonPropertyName("content")]
            public SendGridContent[] Content { get; set; } = [];
        }

        private sealed class SendGridPersonalization
        {
            [JsonPropertyName("to")]
            public SendGridEmailAddress[] To { get; set; } = [];
        }

        private sealed class SendGridEmailAddress
        {
            [JsonPropertyName("email")]
            public string Email { get; set; } = string.Empty;

            [JsonPropertyName("name")]
            [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingNull)]
            public string? Name { get; set; }
        }

        private sealed class SendGridContent
        {
            [JsonPropertyName("type")]
            public string Type { get; set; } = string.Empty;

            [JsonPropertyName("value")]
            public string Value { get; set; } = string.Empty;
        }
    }
}
