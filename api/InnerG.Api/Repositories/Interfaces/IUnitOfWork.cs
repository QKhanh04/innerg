using System;
using System.Threading.Tasks;

namespace InnerG.Api.Repositories.Interfaces
{
    public interface IUnitOfWork : IDisposable
    {
        IUserRepository Users { get; }
        
        IGenericRepository<T> Repository<T>() where T : class;
        
        Task<int> CommitAsync();
    }
}
