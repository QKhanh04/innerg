using System;

namespace InnerG.Api.Common.Interfaces
{
    public interface IMultiTenant
    {
        Guid CompanyId { get; set; }
    }
}
