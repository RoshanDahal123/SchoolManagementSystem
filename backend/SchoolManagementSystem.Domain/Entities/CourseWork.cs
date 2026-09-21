using SchoolManagementSystem.Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Domain.Entities
{
    public class CourseWork
    {
        public const int MaxTitleLength = 200;
        public const int MaxInstructionsLength = 4000;

        private readonly List<CourseworkAttachment> _attachments = new();
        public Guid Id { get; private set; }
        public Guid ClassSubjectId { get; private set; }
        public Guid TeacherId { get; private set; }

        public string Title { get; private set; } = string.Empty;
        //text only assignments live here. Null wwhen the work is file 
        public string Instructions { get; private set; } = string.Empty;

        public DateTimeOffset DueAtUtc { get; private set; }
        public decimal MaxMarks { get; private set; }
        public bool AllowLateSubmission { get; private set; }
        public DateTimeOffset CreatedAtUtc { get; private set; }
        public DateTimeOffset? UpdatedAtUtc { get; private set; }


        //navigation- ef core only

        public ClassSubject ClassSubject { get; private set; } = null!;

        public Teacher Teacher { get; private set; } = null!;

        public IReadOnlyCollection<CourseworkAttachment> Attachments => _attachments;

        public static CourseWork   Create(
            Guid classSubjectId,
            Guid teacherId,
            string title,
            string? instructions,
            DateTimeOffset dueAtUtc,
            decimal maxMarks,
            bool allowLateSubmission= true
            )
        {
            if (classSubjectId == Guid.Empty)
                throw new DomainException("ClassSubjectId cannot be empty.");
            if(teacherId ==Guid.Empty)
                throw new DomainException("TeacherId cannot be empty.");

            ValidateTitle(title);
            ValidateInstructions(instructions);
            ValidateMaxMarks(maxMarks);

            if (dueAtUtc <= DateTimeOffset.UtcNow)
                throw new DomainException("The submission deadline must be in the future.");

            return new CourseWork
            {
                Id = Guid.NewGuid(),
                ClassSubjectId = classSubjectId,
                TeacherId = teacherId,
                Title = title.Trim(),
                Instructions = string.IsNullOrWhiteSpace(instructions) ? null : instructions.Trim(),
                DueAtUtc = dueAtUtc,
                MaxMarks = maxMarks,
                AllowLateSubmission = allowLateSubmission,
                CreatedAtUtc = DateTimeOffset.UtcNow
            };
        }
        public void Update(
        string title,
        string? instructions,
        DateTimeOffset dueAtUtc,
        decimal maxMarks,
        bool allowLateSubmission)
        {
            ValidateTitle(title);
            ValidateInstructions(instructions);
            ValidateMaxMarks(maxMarks);

            // Note: no "must be in the future" check on update. A teacher legitimately needs to
            // correct a deadline that has already slipped past.

            Title = title.Trim();
            Instructions= string.IsNullOrWhiteSpace(instructions) ? null : instructions.Trim();
            DueAtUtc = dueAtUtc;
            MaxMarks = maxMarks;
            AllowLateSubmission = allowLateSubmission;
            UpdatedAtUtc = DateTimeOffset.UtcNow;
        }


        public void AddAttachment(CourseworkAttachment attachment) {
            ArgumentNullException.ThrowIfNull(attachment);
            _attachments.Add(attachment);
            UpdatedAtUtc = DateTimeOffset.UtcNow;
        }

        public CourseworkAttachment RemoveAttachment(Guid attachmentId)
        {
            var attachment = _attachments.Find(a => a.Id == attachmentId);
            if (attachment is null)
                throw new DomainException("Attachment not found.");
            if (_attachments.Count == 1 && string.IsNullOrWhiteSpace(Instructions))
                throw new DomainException(
                    "Coursework must keep either written instructions or at least one attachment.");

            _attachments.Remove(attachment);
            UpdatedAtUtc = DateTimeOffset.UtcNow;
            return attachment;
        }

        public void EnsureHasContent()
        {
            if (string.IsNullOrWhiteSpace(Instructions) && _attachments.Count == 0)
                throw new DomainException(
                    "Add written instructions or attach at least one file before posting this coursework.");
        }
        public bool IsPastDue(DateTimeOffset asOf) => asOf > DueAtUtc;
        private static void ValidateTitle(string title)
        {
            if (string.IsNullOrWhiteSpace(title))
                throw new DomainException("Title cannot be empty.");
            if (title.Length > MaxTitleLength)
                throw new DomainException($"Title cannot exceed {MaxTitleLength} characters.");
        }
        private static void ValidateInstructions(string? instructions)
        {
            if (instructions is not null && instructions.Trim().Length > MaxInstructionsLength)
                throw new DomainException($"Instructions must be {MaxInstructionsLength} characters or fewer.");
        }

        private static void ValidateMaxMarks(decimal maxMarks)
        {
            if (maxMarks <= 0)
                throw new DomainException("Total marks must be greater than zero.");

            if (maxMarks > 1000)
                throw new DomainException("Total marks must be 1000 or fewer.");
        }


    }
}
