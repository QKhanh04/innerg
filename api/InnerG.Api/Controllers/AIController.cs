using System;
using System.Linq;
using System.Threading.Tasks;
using InnerG.Api.Services.Interfaces;
using InnerG.Api.Data;
using InnerG.Api.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

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

        /// <summary>
        /// Clears all cached Gemini File URIs so they get re-uploaded on next chat.
        /// Call this after changing API keys or when files have expired (48h limit).
        /// </summary>
        [HttpPost("clear-gemini-cache")]
        [AllowAnonymous]
        public async Task<IActionResult> ClearGeminiCache()
        {
            var resources = await _context.Resources
                .Where(r => r.GeminiFileUri != null)
                .ToListAsync();

            foreach (var r in resources)
                r.GeminiFileUri = null;

            await _context.SaveChangesAsync();

            return Ok(new { message = $"Cleared GeminiFileUri for {resources.Count} resources. Files will be re-uploaded on next chat." });
        }
    }
}
