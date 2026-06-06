using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace InnerG.Api.Services.Interfaces
{
    public interface IFileService
    {
        Task<string> UploadImageAsync(IFormFile file);
        Task<string> UploadDocumentAsync(IFormFile file);
    }
}
