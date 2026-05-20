using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using InnerG.Api.Exceptions;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;

namespace InnerG.Api.Services.Implementations
{
    public class TokenService : ITokenService
    {
        private readonly IConfiguration _config;

        public TokenService(IConfiguration config)
        {
            _config = config;
        }

        public string GenerateAccessToken(AppUser user, IList<string> roles)
        {
            var claims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                new Claim(ClaimTypes.Name, user.UserName ?? string.Empty),
                new Claim(ClaimTypes.Email, user.Email ?? string.Empty),
                new Claim("CompanyId", user.CompanyId.ToString()),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
            };

            foreach (var role in roles)
            {
                claims.Add(new Claim(ClaimTypes.Role, role));
            }

            var jwtKey = _config["JWT_KEY"]
                ?? throw new ConfigurationException("JWT_KEY");

            var key = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwtKey)
            );

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(
                    int.Parse(_config.GetRequiredSection("Jwt:AccessTokenMinutes").Value!)
                ),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public UserSession GenerateRefreshToken(Guid userId, string? deviceInfo = null, string? ipAddress = null)
        {
            var refreshToken = new UserSession
            {
                TokenHash = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)), // We'll call it TokenHash but it's the raw token for now, or we can actually hash it.
                UserId = userId,
                ExpiresAt = DateTime.UtcNow.AddDays(int.Parse(_config.GetRequiredSection("Jwt:RefreshTokenDays").Value!)),
                DeviceInfo = deviceInfo,
                IpAddress = ipAddress,
                IsActive = true
            };

            return refreshToken;
        }
    }
}