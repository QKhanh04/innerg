using System;
using System.Collections.Generic;
using InnerG.Api.Models;

namespace InnerG.Api.Services.Interfaces
{
    public interface ITokenService
    {
        string GenerateAccessToken(AppUser user, IList<string> roles);
        UserSession GenerateRefreshToken(Guid userId, string? deviceInfo = null, string? ipAddress = null);
    }
}