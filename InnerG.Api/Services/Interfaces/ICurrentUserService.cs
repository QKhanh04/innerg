using System;

namespace InnerG.Api.Services.Interfaces
{
    public interface ICurrentUserService
    {
        Guid UserId { get; }
        Guid CompanyId { get; }
        bool IsAuthenticated { get; }
    }
}
