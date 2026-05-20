using System;
using System.Collections;
using System.Threading.Tasks;
using InnerG.Api.Data;
using InnerG.Api.Repositories.Interfaces;

namespace InnerG.Api.Repositories.Implementations
{
    public class UnitOfWork : IUnitOfWork
    {
        private readonly AppDbContext _context;
        private Hashtable? _repositories;

        public IUserRepository Users { get; }

        public UnitOfWork(AppDbContext context, IUserRepository users)
        {
            _context = context;
            Users = users;
        }

        public IGenericRepository<T> Repository<T>() where T : class
        {
            _repositories ??= new Hashtable();

            var type = typeof(T).Name;

            if (!_repositories.ContainsKey(type))
            {
                var repositoryType = typeof(GenericRepository<>);
                var repositoryInstance = Activator.CreateInstance(repositoryType.MakeGenericType(typeof(T)), _context);

                _repositories.Add(type, repositoryInstance);
            }

            return (IGenericRepository<T>)_repositories[type]!;
        }

        public async Task<int> CommitAsync()
        {
            return await _context.SaveChangesAsync();
        }

        public void Dispose()
        {
            _context.Dispose();
            GC.SuppressFinalize(this);
        }
    }
}
