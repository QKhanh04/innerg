using System;
using System.Threading.Tasks;
using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Configuration;
using InnerG.Api.Services.Interfaces;

namespace InnerG.Api.Services.Implementations
{
    public class CloudinaryService : IFileService
    {
        private readonly Cloudinary _cloudinary;

        public CloudinaryService(IConfiguration configuration)
        {
            // Lấy URL từ biến môi trường (DotNetEnv sẽ nạp từ file .env)
            var cloudinaryUrl = Environment.GetEnvironmentVariable("CLOUDINARY_URL") ?? configuration["Cloudinary:Url"];
            if (string.IsNullOrEmpty(cloudinaryUrl))
            {
                throw new ArgumentException("Cloudinary config is missing. CLOUDINARY_URL is not set.");
            }
            
            _cloudinary = new Cloudinary(cloudinaryUrl);
            _cloudinary.Api.Secure = true; // Bắt buộc trả về https
        }

        public async Task<string> UploadImageAsync(IFormFile file)
        {
            if (file == null || file.Length == 0) return string.Empty;

            using var stream = file.OpenReadStream();
            var uploadParams = new ImageUploadParams
            {
                File = new FileDescription(file.FileName, stream),
                // Tối ưu hóa ảnh tự động bằng AI của Cloudinary
                Transformation = new Transformation().Quality("auto").FetchFormat("auto")
            };
            uploadParams.AddCustomParam("upload_preset", "InnerG");

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            
            if (uploadResult.Error != null)
            {
                throw new Exception(uploadResult.Error.Message);
            }

            return uploadResult.SecureUrl.ToString();
        }

        public async Task<string> UploadDocumentAsync(IFormFile file)
        {
            if (file == null || file.Length == 0) return string.Empty;

            using var stream = file.OpenReadStream();
            
            // Đối với các file không phải ảnh (PDF, DOCX, XLSX), Cloudinary cần lưu dưới dạng Raw
            var uploadParams = new RawUploadParams
            {
                File = new FileDescription(file.FileName, stream)
            };
            uploadParams.AddCustomParam("upload_preset", "InnerG");

            var uploadResult = await _cloudinary.UploadAsync(uploadParams);
            
            if (uploadResult.Error != null)
            {
                throw new Exception(uploadResult.Error.Message);
            }

            return uploadResult.SecureUrl.ToString();
        }
    }
}
