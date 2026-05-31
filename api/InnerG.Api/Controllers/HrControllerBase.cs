using System;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;

namespace InnerG.Api.Controllers
{
    public abstract class HrControllerBase : ControllerBase
    {
        protected Guid GetCurrentUserId()
        {
            var id = User.FindFirstValue(ClaimTypes.NameIdentifier);
            return string.IsNullOrEmpty(id) ? Guid.Empty : Guid.Parse(id);
        }

        protected Guid GetCurrentCompanyId()
        {
            var companyIdValue = User.FindFirstValue("company_id") ?? User.FindFirstValue("CompanyId");
            return string.IsNullOrEmpty(companyIdValue) ? Guid.Empty : Guid.Parse(companyIdValue);
        }
    }
}
