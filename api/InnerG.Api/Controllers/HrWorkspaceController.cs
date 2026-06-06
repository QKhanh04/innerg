using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/hr/workspace")]
    [Authorize(Roles = AuthRoles.HR)]
    public class HrWorkspaceController : HrControllerBase
    {
        private readonly IHrWorkspaceService _service;

        public HrWorkspaceController(IHrWorkspaceService service) => _service = service;

        [HttpGet("settings")]
        public async Task<IActionResult> GetSettings() =>
            Ok(await _service.GetSettingsAsync(GetCurrentCompanyId()));

        [HttpPut("settings")]
        public async Task<IActionResult> UpdateSettings([FromBody] WorkspaceSettingsDto request) =>
            Ok(await _service.UpdateSettingsAsync(GetCurrentCompanyId(), request));
    }
}
