using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Exceptions;
using InnerG.Api.Helpers;
using InnerG.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InnerG.Api.Services.Implementations
{
    public class HrWorkspaceService : IHrWorkspaceService
    {
        private readonly AppDbContext _context;

        public HrWorkspaceService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<WorkspaceSettingsDto> GetSettingsAsync(Guid companyId)
        {
            var company = await _context.Companies.FindAsync(companyId)
                ?? throw new BusinessException("COMPANY_NOT_FOUND", "Không tìm thấy công ty.", 404);

            return new WorkspaceSettingsDto
            {
                Name = company.Name,
                Domain = company.Domain,
                LogoUrl = company.LogoUrl,
                Timezone = company.Timezone,
                Language = company.Language,
                BusinessRules = CompanySettingsHelper.GetBusinessSettings(company)
            };
        }

        public async Task<WorkspaceSettingsDto> UpdateSettingsAsync(Guid companyId, WorkspaceSettingsDto request)
        {
            var company = await _context.Companies.FindAsync(companyId)
                ?? throw new BusinessException("COMPANY_NOT_FOUND", "Không tìm thấy công ty.", 404);

            company.Name = request.Name;
            company.Domain = request.Domain;
            company.LogoUrl = request.LogoUrl;
            company.Timezone = request.Timezone;
            company.Language = request.Language;
            CompanySettingsHelper.SetBusinessSettings(company, request.BusinessRules);
            await _context.SaveChangesAsync();
            return request;
        }
    }
}
