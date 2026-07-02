using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace InnerG.Api.Services.Interfaces
{
    public class ChatMessageDto
    {
        public string Role { get; set; } = string.Empty; // "user" or "model"
        public string Content { get; set; } = string.Empty;
    }

    public class ChatRequestDto
    {
        public Guid? ResourceId { get; set; }
        public Guid? TrainingEventId { get; set; }
        public string NewMessage { get; set; } = string.Empty;
        public List<ChatMessageDto> History { get; set; } = new();
    }

    public interface IAILearningService
    {
        Task<string> ChatWithDocumentAsync(ChatRequestDto request);
        Task GenerateAndSaveSummaryAsync(Guid resourceId);
    }
}
