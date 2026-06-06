using System;
using System.Threading.Tasks;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/hr/departments")]
    [Authorize(Roles = AuthRoles.HR)]
    public class HrDepartmentsController : HrControllerBase
    {
        private readonly IHrDepartmentService _service;

        public HrDepartmentsController(IHrDepartmentService service) => _service = service;

        [HttpGet]
        public async Task<IActionResult> List() =>
            Ok(await _service.GetAllAsync(GetCurrentCompanyId()));

        [HttpGet("{id:guid}")]
        public async Task<IActionResult> Get(Guid id) =>
            Ok(await _service.GetByIdAsync(id, GetCurrentCompanyId()));

        [HttpGet("{id:guid}/stats")]
        public async Task<IActionResult> Stats(Guid id) =>
            Ok(await _service.GetStatsAsync(id, GetCurrentCompanyId()));

        [HttpPost]
        public async Task<IActionResult> Create([FromBody] DepartmentRequest request) =>
            Ok(await _service.CreateAsync(GetCurrentCompanyId(), request));

        [HttpPut("{id:guid}")]
        public async Task<IActionResult> Update(Guid id, [FromBody] DepartmentRequest request) =>
            Ok(await _service.UpdateAsync(id, GetCurrentCompanyId(), request));

        [HttpDelete("{id:guid}")]
        public async Task<IActionResult> Delete(Guid id)
        {
            await _service.DeleteAsync(id, GetCurrentCompanyId());
            return NoContent();
        }
    }
}
