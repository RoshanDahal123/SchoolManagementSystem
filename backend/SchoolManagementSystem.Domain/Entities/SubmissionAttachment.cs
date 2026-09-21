using System;
using System.Collections.Generic;
using System.Text;
using SchoolManagementSystem.Domain.Exceptions;
namespace SchoolManagementSystem.Domain.Entities
{
    public  class SubmissionAttachment
    {
        public Guid Id { get; private set; }
        public Guid SubmissionId { get; private set; }
        public string FileName { get; private set; } = string.Empty;
        public string StoredPath { get; private set; } = string.Empty;
        public string ContentType { get; private set; } = string.Empty;

        public long FileSizeBytes { get; private set; }
        public DateTimeOffset UploadedAtUtc { get; private set; }

        public CourseworkSubmission Submission { get; private set; } = null!;

        private SubmissionAttachment() { } // EF Core

        public static SubmissionAttachment Create(
            Guid submissionId,
            string fileName,
            string storedPath,
            string contentType,
            long fileSizeBytes)
        {
            if (submissionId == Guid.Empty)
                throw new DomainException("Submission is required.");

            if (string.IsNullOrWhiteSpace(fileName))
                throw new DomainException("File name is required.");

            if (string.IsNullOrWhiteSpace(storedPath))
                throw new DomainException("Stored path is required.");

            if (string.IsNullOrWhiteSpace(contentType))
                throw new DomainException("Content type is required.");

            if (fileSizeBytes < 0)
                throw new DomainException("File size cannot be negative.");

            return new SubmissionAttachment
            {
                Id = Guid.NewGuid(),
                SubmissionId = submissionId,
                FileName = fileName.Trim(),
                StoredPath = storedPath.Trim(),
                ContentType = contentType.Trim(),
                FileSizeBytes = fileSizeBytes,
                UploadedAtUtc = DateTimeOffset.UtcNow
            };
        }


    }
}
