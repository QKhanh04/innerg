using System.Security.Cryptography;
using System.Text;
using InnerG.Api.Data;
using InnerG.Api.DTOs;
using InnerG.Api.Exceptions;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.WebUtilities;
using Microsoft.EntityFrameworkCore;
using ExcelDataReader;

namespace InnerG.Api.Services.Implementations
{
    public class InvitationService : IInvitationService
    {
        private readonly AppDbContext _context;
        private readonly IEmailService _emailService;
        private readonly IConfiguration _configuration;

        public InvitationService(
            AppDbContext context,
            IEmailService emailService,
            IConfiguration configuration)
        {
            _context = context;
            _emailService = emailService;
            _configuration = configuration;
        }

        public async Task<InviteResponse> CreateInviteAsync(CreateInviteRequest request, string inviterUserId, Guid? currentCompanyId, bool isSystemAdmin, bool allowExternalEmail = false)
        {
            var companyId = request.CompanyId ?? currentCompanyId
                ?? throw new BadRequestException("CompanyId is required");

            if (!Guid.TryParse(inviterUserId, out var inviterId))
                throw new UnauthorizedException();

            if (!isSystemAdmin && currentCompanyId != companyId)
                throw new ForbiddenException("You cannot invite users outside your current company");

            var company = await _context.Companies
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == companyId && x.IsActive && x.DeletedAt == null)
                ?? throw new NotFoundException("Company not found");

            // Removed domain restriction to allow any email as requested

            if (request.DepartmentId.HasValue)
            {
                var departmentExists = await _context.Departments
                    .IgnoreQueryFilters()
                    .AnyAsync(x => x.Id == request.DepartmentId && x.CompanyId == companyId && x.DeletedAt == null);

                if (!departmentExists)
                    throw new BadRequestException("Department does not belong to this company");
            }
            else if (!string.IsNullOrWhiteSpace(request.DepartmentName))
            {
                var dept = await _context.Departments
                    .IgnoreQueryFilters()
                    .FirstOrDefaultAsync(x => x.Name.ToLower() == request.DepartmentName.Trim().ToLower() 
                                         && x.CompanyId == companyId && x.DeletedAt == null);
                if (dept != null)
                {
                    request.DepartmentId = dept.Id;
                }
            }

            var email = NormalizeEmail(request.Email);

            var existingUser = await _context.Users.IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Email == email && x.DeletedAt == null);

            if (existingUser != null)
            {
                if (existingUser.CompanyId == companyId)
                    throw new BusinessException("COMPANY_MEMBER_EXISTS", "Email này đã thuộc công ty hiện tại", 409);
                else
                    throw new BusinessException("EMAIL_ALREADY_IN_SYSTEM", "Email này đã tồn tại trong hệ thống ở một thư mục công ty khác", 409);
            }

            var pendingInvite = await _context.Invites
                .IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.CompanyId == companyId && x.Email == email && x.Status == InviteStatus.Pending);

            if (pendingInvite != null && pendingInvite.ExpiresAt > DateTime.UtcNow)
                throw new ConflictException("A pending invite already exists for this email");

            if (pendingInvite != null && pendingInvite.ExpiresAt <= DateTime.UtcNow)
                pendingInvite.Status = InviteStatus.Expired;

            var roles = NormalizeCompanyRoles(request.Roles);
            var rawToken = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(48));
            var invite = new Invite
            {
                CompanyId = companyId,
                InviterId = inviterId,
                DepartmentId = request.DepartmentId,
                Email = email,
                FullName = string.IsNullOrWhiteSpace(request.FullName) ? null : request.FullName.Trim(),
                Position = string.IsNullOrWhiteSpace(request.Position) ? null : request.Position.Trim(),
                RolesCsv = string.Join(",", roles),
                TokenHash = HashToken(rawToken),
                ExpiresAt = DateTime.UtcNow.AddDays(GetInviteExpiryDays())
            };

            _context.Invites.Add(invite);
            await _context.SaveChangesAsync();

            var inviteLink = BuildInviteLink(rawToken);
            await _emailService.SendInviteAsync(
                email,
                $"You're invited to join {company.Name} on InnerG",
                $"""
                <h3>You're invited to InnerG</h3>
                <p>{company.Name} has invited you to join its internal learning workspace.</p>
                <p>Please click the link below to activate your account. This invite expires on {invite.ExpiresAt:yyyy-MM-dd HH:mm} UTC.</p>
                <a href="{inviteLink}">Accept invite</a>
                """);

            return ToInviteResponse(invite, company, rawToken);
        }

        public async Task<BulkInviteResponse> CreateBulkInvitesAsync(BulkInviteRequest request, string inviterUserId, Guid? currentCompanyId, bool isSystemAdmin)
        {
            if (request == null || request.Invites == null)
                 throw new BadRequestException("Dữ liệu gửi lên không hợp lệ");

            var response = new BulkInviteResponse();
            for (var i = 0; i < request.Invites.Count; i++)
            {
                var inviteRequest = request.Invites[i];
                try
                {
                    response.SuccessfulInvites.Add(await CreateInviteAsync(inviteRequest, inviterUserId, currentCompanyId, isSystemAdmin));
                }
                catch (AppException ex)
                {
                    response.Errors.Add(new BulkInviteError { Row = i + 1, Email = inviteRequest.Email, Error = ex.Message });
                }
            }

            response.SuccessCount = response.SuccessfulInvites.Count;
            response.ErrorCount = response.Errors.Count;
            return response;
        }

        public async Task<InviteResponse> ResendInviteAsync(Guid inviteId, string inviterUserId, Guid? currentCompanyId, bool isSystemAdmin)
        {
            var invite = await GetInviteForMutationAsync(inviteId, currentCompanyId, isSystemAdmin);
            if (invite.Status == InviteStatus.Accepted)
                throw new BadRequestException("Accepted invite cannot be resent");
            if (invite.Status == InviteStatus.Revoked)
                throw new BadRequestException("Revoked invite cannot be resent");
            if (!Guid.TryParse(inviterUserId, out var actorId))
                throw new UnauthorizedException();

            var rawToken = WebEncoders.Base64UrlEncode(RandomNumberGenerator.GetBytes(48));
            invite.InviterId = actorId;
            invite.TokenHash = HashToken(rawToken);
            invite.Status = InviteStatus.Pending;
            invite.ExpiresAt = DateTime.UtcNow.AddDays(GetInviteExpiryDays());
            invite.RevokedAt = null;
            invite.AcceptedAt = null;
            await _context.SaveChangesAsync();

            var inviteLink = BuildInviteLink(rawToken);
            await _emailService.SendInviteAsync(
                invite.Email,
                $"You're invited to join {invite.Company.Name} on InnerG",
                $"""<h3>You're invited to InnerG</h3><p>Please click the link below to activate your account.</p><a href="{inviteLink}">Accept invite</a>""");

            return ToInviteResponse(invite, invite.Company, rawToken);
        }

        public async Task RevokeInviteAsync(Guid inviteId, string actorUserId, Guid? currentCompanyId, bool isSystemAdmin)
        {
            var invite = await GetInviteForMutationAsync(inviteId, currentCompanyId, isSystemAdmin);
            if (invite.Status != InviteStatus.Pending)
                throw new BadRequestException("Only pending invites can be revoked");

            invite.Status = InviteStatus.Revoked;
            invite.RevokedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task RevokeBulkInvitesAsync(BulkRevokeRequest request, string actorUserId, Guid? currentCompanyId, bool isSystemAdmin)
        {
            if (request?.Ids == null || !request.Ids.Any())
                return;

            foreach (var id in request.Ids)
            {
                try
                {
                    await RevokeInviteAsync(id, actorUserId, currentCompanyId, isSystemAdmin);
                }
                catch (AppException)
                {
                    // Ignore individual errors during bulk operation
                }
            }
        }

        public async Task DeleteInviteAsync(Guid inviteId, string actorUserId, Guid? currentCompanyId, bool isSystemAdmin)
        {
            var invite = await GetInviteForMutationAsync(inviteId, currentCompanyId, isSystemAdmin);
            invite.DeletedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteBulkInvitesAsync(BulkRevokeRequest request, string actorUserId, Guid? currentCompanyId, bool isSystemAdmin)
        {
            if (request?.Ids == null || !request.Ids.Any())
                return;

            foreach (var id in request.Ids)
            {
                try
                {
                    await DeleteInviteAsync(id, actorUserId, currentCompanyId, isSystemAdmin);
                }
                catch (AppException)
                {
                    // Ignore individual errors during bulk operation
                }
            }
        }

        public async Task<PaginatedResponse<InviteListItemResponse>> GetInvitesAsync(InviteListQuery query, Guid companyId, bool isSystemAdmin)
        {
            var now = DateTime.UtcNow;
            var pageSize = Math.Min(Math.Max(query.PageSize, 1), 100);
            var page = Math.Max(query.Page, 1);

            var dbQuery = _context.Invites
                .IgnoreQueryFilters()
                .Include(x => x.Inviter)
                .Include(x => x.Department)
                .Where(x => x.DeletedAt == null);

            if (!isSystemAdmin)
                dbQuery = dbQuery.Where(x => x.CompanyId == companyId);

            if (!string.IsNullOrWhiteSpace(query.Search))
            {
                var lower = query.Search.Trim().ToLower();
                dbQuery = dbQuery.Where(x => x.Email.ToLower().Contains(lower) ||
                    (x.FullName != null && x.FullName.ToLower().Contains(lower)));
            }

            // For status filter, handle EXPIRED specially (computed field)
            if (!string.IsNullOrWhiteSpace(query.Status))
            {
                var upperStatus = query.Status.Trim().ToUpper();
                if (upperStatus == "EXPIRED")
                {
                    dbQuery = dbQuery.Where(x => x.Status == InviteStatus.Pending && x.ExpiresAt <= now);
                }
                else
                {
                    // For PENDING, exclude those that are actually expired
                    if (upperStatus == "PENDING")
                        dbQuery = dbQuery.Where(x => x.Status == upperStatus && x.ExpiresAt > now);
                    else
                        dbQuery = dbQuery.Where(x => x.Status == upperStatus);
                }
            }

            var total = await dbQuery.CountAsync();

            var items = await dbQuery
                .OrderByDescending(x => x.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var result = items.Select(x =>
            {
                var computedStatus = x.Status;
                if (x.Status == InviteStatus.Pending && x.ExpiresAt <= now)
                    computedStatus = InviteStatus.Expired;

                return new InviteListItemResponse
                {
                    Id = x.Id,
                    Email = x.Email,
                    FullName = x.FullName,
                    Roles = x.Roles.ToList(),
                    Department = x.Department?.Name,
                    Position = x.Position,
                    Status = computedStatus.ToUpper(),
                    InvitedBy = x.Inviter?.FullName,
                    ExpiresAt = x.ExpiresAt,
                    CreatedAt = x.CreatedAt
                };
            }).ToList();

            return new PaginatedResponse<InviteListItemResponse>
            {
                Data = result,
                Total = total,
                Page = page,
                PageSize = pageSize
            };
        }

        public async Task<ValidateFileResult> ValidateInviteFileAsync(IFormFile file, Guid companyId)
        {
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            if (ext != ".csv" && ext != ".xlsx" && ext != ".xls")
                throw new BusinessException("INVALID_FILE_FORMAT", "File phải là định dạng .csv, .xlsx hoặc .xls", 400);

            var company = await _context.Companies.IgnoreQueryFilters()
                .FirstOrDefaultAsync(x => x.Id == companyId && x.DeletedAt == null)
                ?? throw new NotFoundException("Company not found");

            var rows = ParseFileRows(file, ext);
            var result = new ValidateFileResult();

            for (var i = 0; i < rows.Count; i++)
            {
                var rowData = rows[i];
                var rowNum = i + 2; // 1-indexed, row 1 is header
                var email = NormalizeEmail(rowData.GetValueOrDefault("email", ""));
                var roleCsv = rowData.GetValueOrDefault("role", "");
                var fullName = rowData.GetValueOrDefault("fullname", "") is { Length: > 0 } fn ? fn : null;
                var department = rowData.GetValueOrDefault("department", "") is { Length: > 0 } dep ? dep : null;
                var position = rowData.GetValueOrDefault("position", "") is { Length: > 0 } pos ? pos : null;

                var roles = string.IsNullOrWhiteSpace(roleCsv)
                    ? new List<string>()
                    : roleCsv.Split(',', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries).ToList();

                if (string.IsNullOrWhiteSpace(email))
                {
                    result.Invalid.Add(new ValidateFileRowResult { Row = rowNum, Email = email, ErrorCode = "INVALID_EMAIL_FORMAT", ErrorMessage = "Email không được để trống" });
                    continue;
                }

                if (!IsValidEmailFormat(email))
                {
                    result.Invalid.Add(new ValidateFileRowResult { Row = rowNum, Email = email, ErrorCode = "INVALID_EMAIL_FORMAT", ErrorMessage = "Định dạng email không hợp lệ" });
                    continue;
                }


                var existingUser = await _context.Users.IgnoreQueryFilters()
                    .FirstOrDefaultAsync(x => x.Email == email && x.DeletedAt == null);

                if (existingUser != null)
                {
                    if (existingUser.CompanyId == companyId)
                        result.Invalid.Add(new ValidateFileRowResult { Row = rowNum, Email = email, ErrorCode = "COMPANY_MEMBER_EXISTS", ErrorMessage = "Email này đã thuộc công ty hiện tại" });
                    else
                        result.Invalid.Add(new ValidateFileRowResult { Row = rowNum, Email = email, ErrorCode = "EMAIL_ALREADY_IN_SYSTEM", ErrorMessage = "Email này đã tồn tại trong hệ thống ở một thư mục công ty khác" });
                    continue;
                }

                var hasPending = await _context.Invites.IgnoreQueryFilters()
                    .AnyAsync(x => x.CompanyId == companyId && x.Email == email && x.Status == InviteStatus.Pending && x.ExpiresAt > DateTime.UtcNow);

                if (hasPending)
                {
                    result.Invalid.Add(new ValidateFileRowResult { Row = rowNum, Email = email, ErrorCode = "INVITE_ALREADY_PENDING", ErrorMessage = "Đã có lời mời đang chờ xử lý cho email này" });
                    continue;
                }

                if (roles.Count == 0)
                    roles.Add(AuthRoles.Mentee);

                // normalize roles logic (just simple mapping for preview)
                var normalizedRoles = roles.Select(r => 
                    AuthRoles.CompanyRoles.FirstOrDefault(x => string.Equals(x, r, StringComparison.OrdinalIgnoreCase)) ?? r
                ).Distinct().ToList();

                result.Valid.Add(new ValidateFileRowResult
                {
                    Row = rowNum,
                    Email = email,
                    FullName = fullName,
                    Roles = normalizedRoles,
                    Department = department,
                    Position = position
                });
            }

            return result;
        }

        private async Task<Invite> GetInviteForMutationAsync(Guid inviteId, Guid? currentCompanyId, bool isSystemAdmin)
        {
            var invite = await _context.Invites
                .IgnoreQueryFilters()
                .Include(x => x.Company)
                .FirstOrDefaultAsync(x => x.Id == inviteId)
                ?? throw new NotFoundException("Invite not found");

            if (!isSystemAdmin && currentCompanyId != invite.CompanyId)
                throw new ForbiddenException("You cannot manage invites outside your current company");

            return invite;
        }

        private static List<Dictionary<string, string>> ParseFileRows(IFormFile file, string ext)
        {
            var rows = new List<Dictionary<string, string>>();
            using var stream = file.OpenReadStream();

            if (ext == ".csv")
            {
                using var reader = new System.IO.StreamReader(stream);
                var headerLine = reader.ReadLine();
                if (headerLine == null) return rows;

                var headers = headerLine.Split(',').Select(h => h.Trim().ToLower().Replace("\"", "")).ToArray();

                string? line;
                while ((line = reader.ReadLine()) != null)
                {
                    var values = line.Split(',').Select(v => v.Trim().Replace("\"", "")).ToArray();
                    var row = new Dictionary<string, string>();
                    for (var j = 0; j < headers.Length; j++)
                        row[headers[j]] = j < values.Length ? values[j] : "";
                    rows.Add(row);
                }
            }
            else
            {
                System.Text.Encoding.RegisterProvider(System.Text.CodePagesEncodingProvider.Instance);
                using var excelReader = ext == ".xlsx"
                    ? ExcelDataReader.ExcelReaderFactory.CreateOpenXmlReader(stream)
                    : ExcelDataReader.ExcelReaderFactory.CreateBinaryReader(stream);

                var dataSet = excelReader.AsDataSet(new ExcelDataReader.ExcelDataSetConfiguration
                {
                    ConfigureDataTable = _ => new ExcelDataReader.ExcelDataTableConfiguration { UseHeaderRow = true }
                });

                if (dataSet.Tables.Count == 0) return rows;
                var table = dataSet.Tables[0];
                var headers = table.Columns.Cast<System.Data.DataColumn>()
                    .Select(c => c.ColumnName.Trim().ToLower()).ToArray();

                foreach (System.Data.DataRow dataRow in table.Rows)
                {
                    var row = new Dictionary<string, string>();
                    for (var j = 0; j < headers.Length; j++)
                        row[headers[j]] = dataRow[j]?.ToString()?.Trim() ?? "";
                    rows.Add(row);
                }
            }

            return rows;
        }

        private static bool IsValidEmailFormat(string email)
        {
            try
            {
                var addr = new System.Net.Mail.MailAddress(email);
                return addr.Address == email;
            }
            catch
            {
                return false;
            }
        }

        private static string NormalizeEmail(string email) => email.Trim().ToLowerInvariant();
        
        private static string NormalizeDomain(string domain) => domain.Trim().TrimStart('@').ToLowerInvariant();
        
        private static bool EmailMatchesDomain(string email, string domain)
        {
            var nDomain = NormalizeDomain(domain);
            return email.EndsWith($"@{nDomain}", StringComparison.OrdinalIgnoreCase);
        }

        private int GetInviteExpiryDays()
        {
            var configured = _configuration["Invites:ExpireDays"];
            return int.TryParse(configured, out var days) && days > 0 ? days : 7;
        }

        private static string HashToken(string token)
        {
            var hash = SHA256.HashData(Encoding.UTF8.GetBytes(token));
            return Convert.ToHexString(hash).ToLowerInvariant();
        }

        private string BuildInviteLink(string rawToken)
        {
            var configuredUrl = _configuration["Frontend:AcceptInviteUrl"];
            if (!string.IsNullOrWhiteSpace(configuredUrl))
                return $"{configuredUrl}?token={Uri.EscapeDataString(rawToken)}";

            var frontendUrl = _configuration.GetSection("Frontend:Urls").Get<string[]>()?.FirstOrDefault()
                ?? "http://localhost:5173";

            return $"{frontendUrl.TrimEnd('/')}/accept-invite?token={Uri.EscapeDataString(rawToken)}";
        }

        private static IList<string> NormalizeCompanyRoles(IList<string> roles)
        {
            var requestedRoles = roles.Count == 0 ? [AuthRoles.Mentee] : roles;
            return requestedRoles.Select(NormalizeCompanyRole).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        }

        private static string NormalizeCompanyRole(string role)
        {
            var normalized = AuthRoles.CompanyRoles.FirstOrDefault(x => string.Equals(x, role, StringComparison.OrdinalIgnoreCase));
            return normalized ?? throw new BadRequestException($"Invalid company role: {role}");
        }

        private InviteResponse ToInviteResponse(Invite invite, Company company, string rawToken)
        {
            return new InviteResponse
            {
                Id = invite.Id,
                Email = invite.Email,
                CompanyId = company.Id,
                CompanyName = company.Name,
                Status = invite.Status,
                ExpiresAt = invite.ExpiresAt,
                Roles = invite.Roles.ToList(),
                InviteLink = BuildInviteLink(rawToken)
            };
        }
    }
}
