using Microsoft.AspNetCore.Http;

namespace InnerG.Api.Exceptions
{
    public class BusinessException : AppException
    {
        public string ErrorCode { get; }
        
        public BusinessException(string errorCode, string message, int statusCode = StatusCodes.Status400BadRequest)
            : base(message, statusCode)
        {
            ErrorCode = errorCode;
        }
    }
}
