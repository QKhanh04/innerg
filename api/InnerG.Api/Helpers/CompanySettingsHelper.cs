using System.Text.Json;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Models;

namespace InnerG.Api.Helpers
{
    public static class CompanySettingsHelper
    {
        private static readonly JsonSerializerOptions JsonOptions = new()
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = false
        };

        public static CompanyBusinessSettingsDto GetBusinessSettings(Company company)
        {
            if (string.IsNullOrWhiteSpace(company.BusinessSettingsJson))
                return new CompanyBusinessSettingsDto();

            return JsonSerializer.Deserialize<CompanyBusinessSettingsDto>(company.BusinessSettingsJson, JsonOptions)
                   ?? new CompanyBusinessSettingsDto();
        }

        public static void SetBusinessSettings(Company company, CompanyBusinessSettingsDto settings)
        {
            company.BusinessSettingsJson = JsonSerializer.Serialize(settings, JsonOptions);
        }
    }
}
