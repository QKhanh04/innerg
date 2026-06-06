using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;

namespace InnerG.Api.Exceptions.Handlers
{
    internal sealed class BusinessExceptionHandler(ILogger<BusinessExceptionHandler> logger) : IExceptionHandler
    {
        public async ValueTask<bool> TryHandleAsync(
            HttpContext httpContext,
            Exception exception,
            CancellationToken cancellationToken)
        {
            if (exception is not BusinessException businessException)
                return false;

            logger.LogWarning(exception, "Business rules violation: {Code}", businessException.ErrorCode);

            httpContext.Response.StatusCode = businessException.StatusCode;
            httpContext.Response.ContentType = "application/json";

            var errorResponse = new
            {
                error = new
                {
                    code = businessException.ErrorCode,
                    message = businessException.Message
                }
            };

            await httpContext.Response.WriteAsJsonAsync(errorResponse, cancellationToken);
            return true;
        }
    }
}
