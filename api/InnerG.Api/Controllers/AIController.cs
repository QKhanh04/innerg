using System;
using System.Threading.Tasks;
using InnerG.Api.Services.Interfaces;
using InnerG.Api.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/ai")]
    [Authorize]
    public class AIController : ControllerBase
    {
        private readonly IAILearningService _aiLearningService;
        private readonly AppDbContext _context;

        public AIController(IAILearningService aiLearningService, AppDbContext context)
        {
            _aiLearningService = aiLearningService;
            _context = context;
        }

        [HttpPost("chat")]
        public async Task<IActionResult> Chat([FromBody] ChatRequestDto request)
        {
            try
            {
                var response = await _aiLearningService.ChatWithDocumentAsync(request);
                return Ok(new { content = response });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
