using SchoolManagementSystem.Application.DTOs.Storage;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Interfaces
{
    public interface IFileStorageService
    {
        Task<StoredFile> SaveAsync(FileUpload file, string folder, CancellationToken ct = default);
        Task<Stream> OpenReadAsync(string storedPath, CancellationToken ct = default);
        void Delete(string storedPath);
    }

}
