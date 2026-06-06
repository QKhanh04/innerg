using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using InnerG.Api.Models;
using InnerG.Api.DTOs.Mentor;
using InnerG.Api.Services.Interfaces;
using System.Security.Claims;

namespace InnerG.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = AuthRoles.Mentor)]
    public class MentorController : ControllerBase
    {
        private readonly IMentorService _mentorService;

        public MentorController(IMentorService mentorService)
        {
            _mentorService = mentorService;
        }

        private Guid GetCurrentUserId()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (Guid.TryParse(userIdString, out Guid userId))
            {
                return userId;
            }
            throw new UnauthorizedAccessException("User ID not found in token.");
        }

        [HttpGet("dashboard/stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                var stats = await _mentorService.GetDashboardStatsAsync(GetCurrentUserId());
                return Ok(stats);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("availability")]
        public async Task<IActionResult> GetAvailability()
        {
            try
            {
                var availability = await _mentorService.GetAvailabilityAsync(GetCurrentUserId());
                return Ok(availability);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("availability")]
        public async Task<IActionResult> UpdateAvailability([FromBody] AvailabilityUpdateRequest request)
        {
            try
            {
                await _mentorService.UpdateAvailabilityAsync(GetCurrentUserId(), request);
                return Ok(new { message = "Availability updated successfully." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("classes")]
        public async Task<IActionResult> GetHostedClasses()
        {
            try
            {
                var classes = await _mentorService.GetHostedClassesAsync(GetCurrentUserId());
                return Ok(classes);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("enrollments/pending")]
        public async Task<IActionResult> GetPendingEnrollments()
        {
            try
            {
                var enrollments = await _mentorService.GetPendingEnrollmentsAsync(GetCurrentUserId());
                return Ok(enrollments);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("enrollments/{id}/approve")]
        public async Task<IActionResult> ApproveEnrollment(Guid id)
        {
            try
            {
                var success = await _mentorService.ProcessEnrollmentAsync(GetCurrentUserId(), id, isApproved: true);
                if (success)
                    return Ok(new { message = "Enrollment approved successfully." });
                
                return BadRequest(new { message = "Failed to approve enrollment." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("enrollments/{id}/reject")]
        public async Task<IActionResult> RejectEnrollment(Guid id)
        {
            try
            {
                var success = await _mentorService.ProcessEnrollmentAsync(GetCurrentUserId(), id, isApproved: false);
                if (success)
                    return Ok(new { message = "Enrollment rejected successfully." });
                
                return BadRequest(new { message = "Failed to reject enrollment." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("sessions/{id}/roll-call")]
        public async Task<IActionResult> SubmitRollCall(Guid id, [FromBody] RollCallRequest request)
        {
            try
            {
                var success = await _mentorService.SubmitRollCallAsync(GetCurrentUserId(), id, request);
                if (success)
                    return Ok(new { message = "Roll call submitted successfully." });
                
                return BadRequest(new { message = "Failed to submit roll call." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("classes")]
        public async Task<IActionResult> CreateClass([FromBody] CreateClassRequest request)
        {
            try
            {
                var eventId = await _mentorService.CreateClassAsync(GetCurrentUserId(), request);
                return Ok(new { message = "Class created successfully.", id = eventId });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPut("classes/{id:guid}")]
        public async Task<IActionResult> UpdateClass(Guid id, [FromBody] CreateClassRequest request)
        {
            try
            {
                var success = await _mentorService.UpdateClassAsync(GetCurrentUserId(), id, request);
                if (success)
                    return Ok(new { message = "Class updated successfully." });

                return NotFound(new { message = "Class not found or not in draft/pending status." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpPost("classes/{id:guid}/cancel")]
        public async Task<IActionResult> CancelClass(Guid id)
        {
            try
            {
                var success = await _mentorService.CancelClassAsync(GetCurrentUserId(), id);
                if (success)
                    return Ok(new { message = "Class cancelled successfully." });

                return NotFound(new { message = "Class not found or cannot be cancelled." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }
    }
}
