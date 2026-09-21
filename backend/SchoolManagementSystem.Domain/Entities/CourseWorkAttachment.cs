using SchoolManagementSystem.Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Diagnostics.Eventing.Reader;
using System.Text;

namespace SchoolManagementSystem.Domain.Entities;

public class CourseworkAttachment
{
    public Guid Id { get; private set; }
    public Guid CourseworkId { get; private set; }
    public string FileName { get; private set; } = string.Empty;
    public string StoredPath { get; private set; } = string.Empty;
    public string ContentType { get; private set; } = string.Empty;
    public long FileSizeBytes { get; private set; }
    public DateTimeOffset UploadedAtUtc
    {
        get; private set;
    }
    //navigation- ef core only
    public CourseWork CourseWork { get; private set; } = null!;

    private CourseworkAttachment() { }
   
    public static CourseworkAttachment Create(
    Guid courseworkId,
    string fileName,
    string storedPath,
    string contentType,
    long fileSizeBytes)
    {
        if (string.IsNullOrWhiteSpace(fileName))
            throw new DomainException("File name is required.");

        if (string.IsNullOrWhiteSpace(storedPath))
            throw new DomainException("Stored path is required.");

        if (fileSizeBytes <= 0)
            throw new DomainException("An empty file cannot be attached.");

        return new CourseworkAttachment
        {
            Id = Guid.NewGuid(),
            CourseworkId = courseworkId,
            FileName = fileName.Trim(),
            StoredPath = storedPath,
            ContentType = string.IsNullOrWhiteSpace(contentType) ? "application/octet-stream" : contentType,
            FileSizeBytes = fileSizeBytes,
            UploadedAtUtc = DateTimeOffset.UtcNow
        };
    }


}

