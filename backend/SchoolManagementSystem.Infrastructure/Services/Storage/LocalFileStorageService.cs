using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using SchoolManagementSystem.Application.DTOs.Storage;
using SchoolManagementSystem.Application.Interfaces;
using SchoolManagementSystem.Domain.Exceptions;

namespace SchoolManagementSystem.Infrastructure.Services.Storage
{
    public sealed class LocalFileStorageService:IFileStorageService
    {
        private readonly FileStorageSettings _settings;
        private readonly string _rootPath;
        public LocalFileStorageService(IOptions<FileStorageSettings> options, IHostEnvironment environment)
        {
            _settings = options.Value;

            _rootPath = Path.IsPathRooted(_settings.RootPath)
                ? _settings.RootPath
                : Path.Combine(environment.ContentRootPath, _settings.RootPath);

            Directory.CreateDirectory(_rootPath);

        }

        public async Task<StoredFile> SaveAsync(FileUpload file, string folder, CancellationToken ct = default)
        {
            Validate(file);

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
            var safeFolder = SanitiseFolder(folder);

            var relativePath = Path.Combine(safeFolder, $"{Guid.NewGuid():N}{extension}");
            var absolutePath = Path.Combine(_rootPath, relativePath);

            Directory.CreateDirectory(Path.GetDirectoryName(absolutePath)!);

            await using (var destination = new FileStream(
                absolutePath, FileMode.CreateNew, FileAccess.Write, FileShare.None, bufferSize: 81920, useAsync: true))
            {
                await file.Content.CopyToAsync(destination, ct);
            }


            // Always store forward slashes so a path written on Windows still resolves on Linux.
            return new StoredFile(
                relativePath.Replace(Path.DirectorySeparatorChar, '/'),
                Path.GetFileName(file.FileName),
                file.ContentType,
                file.Length);
        }

        public Task<Stream> OpenReadAsync(string storedPath, CancellationToken ct = default)
        {
            var absolutePath = ResolveAndGuard(storedPath);

            if (!File.Exists(absolutePath))
                throw new DomainException("That file is no longer available.");

            Stream stream = new FileStream(
                absolutePath, FileMode.Open, FileAccess.Read, FileShare.Read, bufferSize: 81920, useAsync: true);

            return Task.FromResult(stream);
        }

        public void Delete(string storedPath)
        {
            try
            {
                var absolutePath = ResolveAndGuard(storedPath);
                if (File.Exists(absolutePath))
                    File.Delete(absolutePath);
            }
            catch (DomainException)
            {
                // A bad path in the database is not worth failing the caller's request over —
                // the row is being removed either way.
            }

        }
        private void Validate(FileUpload file)
        {
            if (file.Length <= 0)
                throw new DomainException($"\"{file.FileName}\" is empty.");

            if (file.Length > _settings.MaxFileSizeBytes)
            {
                var limitMb = _settings.MaxFileSizeBytes / (1024d * 1024d);
                throw new DomainException($"\"{file.FileName}\" is larger than the {limitMb:0.#} MB limit.");
            }

            var extension = Path.GetExtension(file.FileName).ToLowerInvariant();

            if (string.IsNullOrWhiteSpace(extension) ||
                !_settings.AllowedExtensions.Contains(extension, StringComparer.OrdinalIgnoreCase))
            {
                throw new DomainException(
                    $"\"{file.FileName}\" is not an accepted file type. Allowed: {string.Join(", ", _settings.AllowedExtensions)}.");
            }

            // Checked as well as the extension, so a renamed .exe is caught by the browser-reported
            // type too. Neither check is a content sniff — both are cheap sanity checks.
            if (!_settings.AllowedContentTypes.Contains(file.ContentType, StringComparer.OrdinalIgnoreCase))
                throw new DomainException($"\"{file.FileName}\" has an unexpected content type ({file.ContentType}).");
        }
        private static string SanitiseFolder(string folder)
        {
            var segments = folder
                .Split('/', '\\', StringSplitOptions.RemoveEmptyEntries)
                .Select(segment => string.Concat(segment.Where(c => char.IsLetterOrDigit(c) || c is '-' or '_')))
                .Where(segment => segment.Length > 0)
                .ToArray();

            return segments.Length == 0 ? "misc" : Path.Combine(segments);
        }
        private string ResolveAndGuard(string storedPath)
        {
            if (string.IsNullOrWhiteSpace(storedPath))
                throw new DomainException("Invalid file path.");

            var fullRoot = Path.GetFullPath(_rootPath);
            var candidate = Path.GetFullPath(Path.Combine(fullRoot, storedPath));

            if (!candidate.StartsWith(fullRoot, StringComparison.OrdinalIgnoreCase))
                throw new DomainException("Invalid file path.");

            return candidate;
        }


    }
    }
