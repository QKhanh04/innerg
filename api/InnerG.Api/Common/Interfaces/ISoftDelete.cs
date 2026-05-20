using System;

namespace InnerG.Api.Common.Interfaces
{
    public interface ISoftDelete
    {
        DateTime? DeletedAt { get; set; }
    }
}
