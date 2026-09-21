using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Infrastructure.Services.Storage
{
    public sealed class FileStorageSettings
    {
        public string RootPath { get; set; } = "Storage";
        public long MaxFileSizeBytes { get; set; } = 10 * 1024 * 1024; // Default to 10 MB
        public string[] AllowedExtensions { get; set; } = { ".png", ".jpg", ".jpeg", ".pdf" };

        public string[] AllowedContentTypes { get; set; } =
            { "image/png", "image/jpeg", "image/jpg", "application/pdf" };
    }
}

