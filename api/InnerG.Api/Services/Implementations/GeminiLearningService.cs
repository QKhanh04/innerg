using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using DocumentFormat.OpenXml.Packaging;
using DocumentFormat.OpenXml.Wordprocessing;
using DocumentFormat.OpenXml.Presentation;

namespace InnerG.Api.Services.Implementations
{
    public class GeminiLearningService : IAILearningService
    {
        private readonly AppDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public GeminiLearningService(AppDbContext context, IConfiguration config, IHttpClientFactory httpClientFactory)
        {
            _context = context;
            _httpClient = httpClientFactory.CreateClient();
            _apiKey = config["GEMINI_API_KEY"] ?? throw new Exception("GEMINI_API_KEY is not configured.");
        }

        public async Task<string> ChatWithDocumentAsync(ChatRequestDto request)
        {
            var filesToChat = new List<(string fileUri, string mimeType)>();
            string systemInstruction = "";

            if (request.TrainingEventId.HasValue)
            {
                var resources = await _context.Resources
                    .Where(r => r.TrainingEventId == request.TrainingEventId.Value && !string.IsNullOrEmpty(r.Url))
                    .ToListAsync();
                
                if (!resources.Any()) throw new Exception("No resources found in this class to chat with.");

                foreach (var resource in resources)
                {
                    string fileUri = await EnsureFileUploadedAsync(resource);
                    string mimeType = GetMimeType(resource.Url, resource.FileType ?? "");
                    filesToChat.Add((fileUri, mimeType));
                }
                systemInstruction = "You are an excellent Teaching Assistant for this class. I have provided you with ALL the documents and materials for this class. Please read them carefully. Answer my following questions comprehensively based on the context of all these documents.";
            }
            else if (request.ResourceId.HasValue)
            {
                var resource = await _context.Resources.FirstOrDefaultAsync(r => r.Id == request.ResourceId.Value);
                if (resource == null) throw new Exception("Resource not found.");

                string fileUri = await EnsureFileUploadedAsync(resource);
                string mimeType = GetMimeType(resource.Url, resource.FileType ?? "");
                filesToChat.Add((fileUri, mimeType));
                systemInstruction = "This is the document. Please read it carefully and answer my following questions based solely on this document.";
            }
            else
            {
                throw new Exception("Must provide either ResourceId or TrainingEventId.");
            }

            return await GenerateContentAsync(filesToChat, request.History, request.NewMessage, systemInstruction);
        }

        private async Task<string> EnsureFileUploadedAsync(Resource resource)
        {
            if (!string.IsNullOrEmpty(resource.GeminiFileUri)) return resource.GeminiFileUri;

            string fileUri = await UploadFileToGeminiAsync(resource.Url, resource.FileType ?? "application/pdf");
            resource.GeminiFileUri = fileUri;
            await _context.SaveChangesAsync();
            return fileUri;
        }

        public async Task GenerateAndSaveSummaryAsync(Guid resourceId)
        {
            try
            {
                // In a real background task, we might need a separate scope for DbContext,
                // but since it runs per-request for now or injected scoped, we use the current one.
                var resource = await _context.Resources.FirstOrDefaultAsync(r => r.Id == resourceId);
                if (resource == null || string.IsNullOrEmpty(resource.Url)) return;

                string fileUri = await EnsureFileUploadedAsync(resource);
                string mimeType = GetMimeType(resource.Url, resource.FileType ?? "");

                var files = new List<(string, string)> { (fileUri, mimeType) };
                string systemInstruction = "You are an AI Summarizer.";
                string prompt = "Please provide a concise summary of this document in 3-5 bullet points. Focus on the core knowledge. Do not include introductory text, just return the bullet points directly.";

                string summary = await GenerateContentAsync(files, new List<ChatMessageDto>(), prompt, systemInstruction);

                resource.AILearningSummary = summary;
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to generate summary for {resourceId}: {ex.Message}");
                try {
                    var resource = await _context.Resources.FirstOrDefaultAsync(r => r.Id == resourceId);
                    if (resource != null) {
                        resource.AILearningSummary = $"[DEBUG ERROR] AI Summary Failed: {ex.Message}";
                        await _context.SaveChangesAsync();
                    }
                } catch { }
            }
        }

        private string GetMimeType(string fileUrl, string fileType)
        {
            string mimeType = "application/pdf";
            if (fileUrl.EndsWith(".docx") || fileType.Contains("doc")) mimeType = "text/plain"; // We will extract it as text
            else if (fileUrl.EndsWith(".pptx") || fileType.Contains("ppt")) mimeType = "text/plain"; // We will extract it as text
            else if (fileUrl.EndsWith(".txt") || fileType.Contains("txt")) mimeType = "text/plain";
            return mimeType;
        }

        private async Task<string> UploadFileToGeminiAsync(string fileUrl, string fileType)
        {
            // Download from Cloudinary
            var fileBytes = await _httpClient.GetByteArrayAsync(fileUrl);
            
            // Map common types
            string mimeType = GetMimeType(fileUrl, fileType);

            // Extract text if it's a document format not supported by Gemini natively
            if (fileUrl.EndsWith(".docx") || fileType.Contains("doc"))
            {
                fileBytes = Encoding.UTF8.GetBytes(ExtractTextFromDocx(fileBytes));
            }
            else if (fileUrl.EndsWith(".pptx") || fileType.Contains("ppt"))
            {
                fileBytes = Encoding.UTF8.GetBytes(ExtractTextFromPptx(fileBytes));
            }

            // Upload to Gemini
            var uploadUrl = $"https://generativelanguage.googleapis.com/upload/v1beta/files?key={_apiKey}";
            using var content = new ByteArrayContent(fileBytes);
            content.Headers.ContentType = new MediaTypeHeaderValue(mimeType);

            // Using X-Goog-Upload-Protocol = raw
            var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl)
            {
                Content = content
            };
            request.Headers.Add("X-Goog-Upload-Protocol", "raw");
            request.Headers.Add("X-Goog-Upload-File-Length", fileBytes.Length.ToString());

            var response = await _httpClient.SendAsync(request);
            if (!response.IsSuccessStatusCode)
            {
                var error = await response.Content.ReadAsStringAsync();
                throw new Exception($"Gemini File Upload Failed: {error}");
            }

            var responseBody = await response.Content.ReadAsStringAsync();
            var json = JsonDocument.Parse(responseBody);
            
            return json.RootElement.GetProperty("file").GetProperty("uri").GetString() ?? "";
        }

        private async Task<string> GenerateContentAsync(List<(string fileUri, string mimeType)> files, List<ChatMessageDto> history, string newMessage, string systemInstruction)
        {
            var chatUrl = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key={_apiKey}";

            var contents = new List<object>();

            // Add the file(s) to the initial context (system-like instruction)
            var fileParts = new List<object>();
            foreach (var f in files)
            {
                fileParts.Add(new { fileData = new { fileUri = f.fileUri, mimeType = f.mimeType } });
            }
            fileParts.Add(new { text = systemInstruction });

            contents.Add(new
            {
                role = "user",
                parts = fileParts.ToArray()
            });
            contents.Add(new
            {
                role = "model",
                parts = new object[] { new { text = "I have read the document(s) and I am ready to help." } }
            });

            // Map history
            foreach (var msg in history)
            {
                contents.Add(new
                {
                    role = msg.Role == "ai" ? "model" : "user",
                    parts = new object[] { new { text = msg.Content } }
                });
            }

            // Add the new message
            contents.Add(new
            {
                role = "user",
                parts = new object[] { new { text = newMessage } }
            });

            var requestBody = new
            {
                contents = contents,
                generationConfig = new
                {
                    temperature = 0.2
                }
            };

            var jsonContent = new StringContent(JsonSerializer.Serialize(requestBody), Encoding.UTF8, "application/json");
            
            var response = await _httpClient.PostAsync(chatUrl, jsonContent);
            var responseBody = await response.Content.ReadAsStringAsync();

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Gemini Chat Failed: {responseBody}");
            }

            var json = JsonDocument.Parse(responseBody);
            try
            {
                return json.RootElement
                    .GetProperty("candidates")[0]
                    .GetProperty("content")
                    .GetProperty("parts")[0]
                    .GetProperty("text").GetString() ?? "I couldn't generate a response.";
            }
            catch
            {
                return "Error parsing response from AI.";
            }
        }

        private string ExtractTextFromDocx(byte[] bytes)
        {
            using var stream = new MemoryStream(bytes);
            using var doc = WordprocessingDocument.Open(stream, false);
            var body = doc.MainDocumentPart?.Document?.Body;
            if (body == null) return "No text found in document.";

            var sb = new StringBuilder();
            foreach (var para in body.Elements<Paragraph>())
            {
                sb.AppendLine(para.InnerText);
            }
            return sb.ToString();
        }

        private string ExtractTextFromPptx(byte[] bytes)
        {
            using var stream = new MemoryStream(bytes);
            using var doc = PresentationDocument.Open(stream, false);
            var presentationPart = doc.PresentationPart;
            if (presentationPart == null) return "No text found in presentation.";

            var sb = new StringBuilder();
            var slideIds = presentationPart.Presentation.SlideIdList?.Elements<SlideId>();
            if (slideIds == null) return "No slides found.";

            foreach (var slideId in slideIds)
            {
                var slidePart = (SlidePart)presentationPart.GetPartById(slideId.RelationshipId!);
                if (slidePart.Slide != null)
                {
                    foreach (var text in slidePart.Slide.Descendants<DocumentFormat.OpenXml.Drawing.Text>())
                    {
                        sb.AppendLine(text.Text);
                    }
                }
            }
            return sb.ToString();
        }
    }
}
