using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.DTOs.Hr;
using InnerG.Api.Exceptions;
using InnerG.Api.Helpers;
using InnerG.Api.Models;
using InnerG.Api.Services.Interfaces;
using Microsoft.EntityFrameworkCore;

namespace InnerG.Api.Services.Implementations
{
    public class HrModerationService : IHrModerationService
    {
        private readonly AppDbContext _context;
        private readonly INotificationService _notificationService;

        public HrModerationService(AppDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        public async Task<List<HrPendingEventDto>> GetPendingEventsAsync(Guid companyId, TrainingEventStatus? status = null)
        {
            var query = _context.TrainingEvents
                .Include(e => e.Trainer)
                .Where(e => e.CompanyId == companyId);

            if (status.HasValue)
            {
                query = query.Where(e => e.Status == status.Value);
            }

            return await query
                .OrderBy(e => e.StartDate)
                .Select(e => new HrPendingEventDto
                {
                    Id = e.Id,
                    Title = e.Title,
                    TrainerName = e.Trainer.FullName,
                    StartDate = e.StartDate,
                    Type = e.Type.ToString(),
                    Status = e.Status.ToString()
                })
                .ToListAsync();
        }

        public async Task ReviewEventAsync(Guid eventId, Guid companyId, Guid hrUserId, ReviewEventRequest request)
        {
            var evt = await _context.TrainingEvents
                .Include(e => e.Trainer).ThenInclude(t => t.User)
                .Include(e => e.TargetDepartments)
                .FirstOrDefaultAsync(e => e.Id == eventId && e.CompanyId == companyId);

            if (evt == null)
                throw new BusinessException("EVENT_NOT_FOUND", "Không tìm thấy lớp học.", 404);

            if (request.Approved)
            {
                evt.Status = TrainingEventStatus.Published;
                await _context.SaveChangesAsync();

                var deptIds = evt.TargetDepartments.Select(td => td.DepartmentId).ToList();
                if (deptIds.Count > 0)
                {
                    var userIds = await _context.Users
                        .Where(u => u.CompanyId == companyId && u.IsActive &&
                                    u.DepartmentId != null && deptIds.Contains(u.DepartmentId.Value))
                        .Select(u => u.Id)
                        .ToListAsync();

                    await _notificationService.SendToManyAsync(
                        userIds, "EVENT_PUBLISHED",
                        $"Lớp học mới: {evt.Title}",
                        $"Một lớp học mới đã được publish trong phòng ban của bạn.",
                        referenceType: "TrainingEvent", referenceId: evt.Id);
                }

                if (evt.Trainer.UserId.HasValue)
                {
                    await _notificationService.SendAsync(
                        evt.Trainer.UserId.Value, "CONTENT_APPROVED",
                        "Lớp học đã được duyệt",
                        $"Lớp \"{evt.Title}\" đã được HR phê duyệt và publish.",
                        referenceType: "TrainingEvent", referenceId: evt.Id);
                }
            }
            else
            {
                evt.Status = TrainingEventStatus.Draft;
                await _context.SaveChangesAsync();

                if (evt.Trainer.UserId.HasValue)
                {
                    await _notificationService.SendAsync(
                        evt.Trainer.UserId.Value, "CONTENT_REJECTED",
                        "Lớp học bị từ chối",
                        request.Reason ?? "Lớp học cần chỉnh sửa trước khi gửi lại.",
                        referenceType: "TrainingEvent", referenceId: evt.Id);
                }
            }
        }

        public async Task<List<HrPendingResourceDto>> GetPendingResourcesAsync(Guid companyId)
        {
            return await _context.Resources
                .Include(r => r.TrainingEvent)
                .Where(r => r.CompanyId == companyId && !r.IsPublic)
                .OrderByDescending(r => r.CreatedAt)
                .Select(r => new HrPendingResourceDto
                {
                    Id = r.Id,
                    Title = r.Title,
                    EventTitle = r.TrainingEvent.Title,
                    Type = r.Type.ToString(),
                    CreatedAt = r.CreatedAt
                })
                .ToListAsync();
        }

        public async Task ReviewResourceAsync(Guid resourceId, Guid companyId, Guid hrUserId, ReviewResourceRequest request)
        {
            var resource = await _context.Resources
                .Include(r => r.TrainingEvent)
                    .ThenInclude(e => e.Trainer)
                .FirstOrDefaultAsync(r => r.Id == resourceId && r.CompanyId == companyId);
            if (resource == null)
                throw new BusinessException("RESOURCE_NOT_FOUND", "Không tìm thấy tài nguyên.", 404);

            if (request.Approved)
            {
                resource.IsPublic = true;
            }
            else
            {
                resource.IsPublic = false;
            }

            await _context.SaveChangesAsync();
            await HrAuditHelper.LogAsync(
                _context,
                companyId,
                hrUserId,
                "Resource",
                resource.Id,
                request.Approved ? "Approve" : "Reject",
                null,
                new
                {
                    resource.Title,
                    resource.IsPublic,
                    request.Reason
                });

            var trainerUserId = resource.TrainingEvent?.Trainer?.UserId;
            if (!trainerUserId.HasValue)
                return;

            if (request.Approved)
            {
                await _notificationService.SendAsync(
                    trainerUserId.Value,
                    "CONTENT_APPROVED",
                    "Tai nguyen da duoc duyet",
                    $"Tai nguyen \"{resource.Title}\" da duoc HR phe duyet va hien co the duoc truy cap.",
                    referenceType: "Resource",
                    referenceId: resource.Id);
            }
            else
            {
                await _notificationService.SendAsync(
                    trainerUserId.Value,
                    "CONTENT_REJECTED",
                    "Tai nguyen can chinh sua",
                    request.Reason?.Trim() ?? "Tai nguyen can duoc chinh sua truoc khi gui lai de duyet.",
                    referenceType: "Resource",
                    referenceId: resource.Id);
            }
        }

        public async Task<HrModerationEscalationDto> CreateEscalationReportAsync(Guid companyId, Guid hrUserId, CreateModerationEscalationRequest request)
        {
            if (request.TargetId == Guid.Empty)
                throw new BadRequestException("TargetId is required");

            if (string.IsNullOrWhiteSpace(request.TargetType))
                throw new BadRequestException("TargetType is required");

            if (string.IsNullOrWhiteSpace(request.Reason))
                throw new BadRequestException("Reason is required");

            var normalizedTargetType = request.TargetType.Trim();
            var targetLabel = await ResolveTargetLabelAsync(companyId, normalizedTargetType, request.TargetId);

            var existingPending = await _context.ModerationEscalationReports
                .IgnoreQueryFilters()
                .AnyAsync(x =>
                    x.CompanyId == companyId &&
                    x.TargetType == normalizedTargetType &&
                    x.TargetId == request.TargetId &&
                    x.Status == ModerationEscalationStatus.Pending &&
                    x.DeletedAt == null);

            if (existingPending)
                throw new ConflictException("A pending escalation already exists for this target");

            var report = new ModerationEscalationReport
            {
                CompanyId = companyId,
                ReportedByUserId = hrUserId,
                TargetType = normalizedTargetType,
                TargetId = request.TargetId,
                TargetLabel = targetLabel,
                Reason = request.Reason.Trim(),
                Severity = request.Severity,
                SourceContext = string.IsNullOrWhiteSpace(request.SourceContext) ? null : request.SourceContext.Trim()
            };

            _context.ModerationEscalationReports.Add(report);
            _context.AuditLogs.Add(new AuditLog
            {
                CompanyId = companyId,
                UserId = hrUserId,
                EntityType = "ModerationEscalationReport",
                EntityId = report.Id,
                Action = "Create",
                Result = "SUCCESS",
                NewValueJson = System.Text.Json.JsonSerializer.Serialize(new
                {
                    report.TargetType,
                    report.TargetId,
                    report.TargetLabel,
                    report.Reason,
                    report.Severity,
                    report.SourceContext
                })
            });

            await _context.SaveChangesAsync();
            await NotifySystemAdminsAsync(companyId, report);

            return ToEscalationDto(report);
        }

        public async Task<List<HrModerationEscalationDto>> GetEscalationReportsAsync(Guid companyId)
        {
            return await _context.ModerationEscalationReports
                .Where(x => x.CompanyId == companyId)
                .OrderByDescending(x => x.CreatedAt)
                .Select(x => new HrModerationEscalationDto
                {
                    Id = x.Id,
                    TargetId = x.TargetId,
                    TargetType = x.TargetType,
                    TargetLabel = x.TargetLabel,
                    Reason = x.Reason,
                    Severity = x.Severity,
                    Status = x.Status,
                    SourceContext = x.SourceContext,
                    CreatedAt = x.CreatedAt
                })
                .ToListAsync();
        }

        public async Task<List<HrModerationReportCenterItemDto>> GetModerationReportCenterAsync(Guid companyId)
        {
            var pendingEvents = await _context.TrainingEvents
                .Include(x => x.Trainer)
                .Where(x => x.CompanyId == companyId && x.Status == TrainingEventStatus.PendingApproval)
                .Select(x => new HrModerationReportCenterItemDto
                {
                    ItemType = "PendingEventReview",
                    TargetId = x.Id,
                    TargetType = "TrainingEvent",
                    TargetLabel = x.Title,
                    WorkflowStatus = "PendingHrReview",
                    Summary = $"Awaiting HR approval for trainer {x.Trainer.FullName}",
                    Detail = $"Start date: {x.StartDate:dd/MM/yyyy}",
                    CreatedAt = x.CreatedAt
                })
                .ToListAsync();

            var pendingResources = await _context.Resources
                .Include(x => x.TrainingEvent)
                .Where(x => x.CompanyId == companyId && !x.IsPublic)
                .Select(x => new HrModerationReportCenterItemDto
                {
                    ItemType = "PendingResourceReview",
                    TargetId = x.Id,
                    TargetType = "Resource",
                    TargetLabel = x.Title,
                    WorkflowStatus = "PendingHrReview",
                    Summary = $"Awaiting HR review for resource in {x.TrainingEvent.Title}",
                    Detail = $"Resource type: {x.Type}",
                    CreatedAt = x.CreatedAt
                })
                .ToListAsync();

            var escalationReports = await _context.ModerationEscalationReports
                .Where(x => x.CompanyId == companyId)
                .Select(x => new HrModerationReportCenterItemDto
                {
                    ItemType = "EscalationReport",
                    ItemId = x.Id,
                    TargetId = x.TargetId,
                    TargetType = x.TargetType,
                    TargetLabel = x.TargetLabel,
                    WorkflowStatus = x.Status.ToString(),
                    Summary = x.Reason,
                    Detail = x.ResolutionNotes,
                    Severity = x.Severity.ToString(),
                    SourceContext = x.SourceContext,
                    CreatedAt = x.CreatedAt
                })
                .ToListAsync();

            return pendingEvents
                .Concat(pendingResources)
                .Concat(escalationReports)
                .OrderByDescending(x => x.CreatedAt)
                .ToList();
        }

        private async Task<string> ResolveTargetLabelAsync(Guid companyId, string targetType, Guid targetId)
        {
            if (targetType.Equals("TrainingEvent", StringComparison.OrdinalIgnoreCase))
            {
                var trainingEvent = await _context.TrainingEvents
                    .FirstOrDefaultAsync(x => x.Id == targetId && x.CompanyId == companyId)
                    ?? throw new NotFoundException("Training event not found");

                return trainingEvent.Title;
            }

            if (targetType.Equals("Resource", StringComparison.OrdinalIgnoreCase))
            {
                var resource = await _context.Resources
                    .FirstOrDefaultAsync(x => x.Id == targetId && x.CompanyId == companyId)
                    ?? throw new NotFoundException("Resource not found");

                return resource.Title;
            }

            if (targetType.Equals("AppUser", StringComparison.OrdinalIgnoreCase))
            {
                var user = await _context.Users
                    .FirstOrDefaultAsync(x => x.Id == targetId && x.CompanyId == companyId && x.DeletedAt == null)
                    ?? throw new NotFoundException("User not found");

                return user.FullName;
            }

            throw new BadRequestException("Unsupported target type for escalation");
        }

        private async Task NotifySystemAdminsAsync(Guid companyId, ModerationEscalationReport report)
        {
            var systemAdminUserIds = await _context.UserRoles
                .Join(_context.Roles, ur => ur.RoleId, r => r.Id, (ur, r) => new { ur.UserId, r.Name })
                .Where(x => x.Name == AuthRoles.SystemAdmin)
                .Select(x => x.UserId)
                .Distinct()
                .ToListAsync();

            if (systemAdminUserIds.Count == 0)
                return;

            await _notificationService.SendToManyAsync(
                systemAdminUserIds,
                "HR_ESCALATION_REPORT",
                $"New HR escalation: {report.TargetLabel}",
                $"An HR team escalated {report.TargetType} for review. Reason: {report.Reason}",
                NotificationChannel.Push,
                "ModerationEscalationReport",
                report.Id);
        }

        private static HrModerationEscalationDto ToEscalationDto(ModerationEscalationReport report)
        {
            return new HrModerationEscalationDto
            {
                Id = report.Id,
                TargetId = report.TargetId,
                TargetType = report.TargetType,
                TargetLabel = report.TargetLabel,
                Reason = report.Reason,
                Severity = report.Severity,
                Status = report.Status,
                SourceContext = report.SourceContext,
                CreatedAt = report.CreatedAt
            };
        }
    }
}
