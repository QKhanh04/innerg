using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using InnerG.Api.Services.Interfaces;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/upload")]
    [Authorize] // Chỉ cho phép user đã đăng nhập upload file
    public class UploadController : ControllerBase
    {
        private readonly IFileService _fileService;

        public UploadController(IFileService fileService)
        {
            _fileService = fileService;
        }

        [HttpPost("image")]
        public async Task<IActionResult> UploadImage(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "No file uploaded." });
                }

                // Có thể validate định dạng ảnh ở đây
                var url = await _fileService.UploadImageAsync(file);
                
                return Ok(new { url = url });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("document")]
        public async Task<IActionResult> UploadDocument(IFormFile file)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "No document uploaded." });
                }

                // Cloudinary nhận mọi dạng file bằng RawUploadParams
                var url = await _fileService.UploadDocumentAsync(file);
                
                return Ok(new { 
                    url = url,
                    fileSize = file.Length,
                    fileName = file.FileName 
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
