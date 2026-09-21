using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Text;
namespace SchoolManagementSystem.Domain.Entities

{
    public class CourseworkSubmission
    {
        public const int MaxNoteLength = 2000;
        public const int MaxFeedbackLength = 2000;
        private readonly List<SubmissionAttachment> _attachments = new();


        public Guid Id { get; private set; }
        public Guid CourseworkId { get; private set; }
        public Guid StudentId { get; private set; }
        public string? Note { get; private set; }

        public DateTimeOffset SubmittedAtUtc { get; private set; }
        public bool IsLate { get; private set; }
        public SubmissionStatus Status { get; private set; }
        public decimal? Marks { get; private set; }
        public string? Feedback { get; private set; }
        public Guid? GradedByTeacherId { get; private set; }
        public DateTimeOffset? GradedAtUtc { get; private set; }
        public DateTimeOffset? UpdatedAtUtc { get; private set; }


        public CourseWork CourseWork { get; private set; } = null!;
        public Student Student { get; private set; } = null!;

        public IReadOnlyCollection<SubmissionAttachment> Attachments => _attachments;

        private CourseworkSubmission() { } // EF Core

        public static CourseworkSubmission Create(Guid courseworkId, Guid studentId, string? note, bool isLate)
        {
            if (courseworkId == Guid.Empty)
                throw new DomainException("Coursework is required.");

            if (studentId == Guid.Empty)
                throw new DomainException("Student is required.");

            ValidateNote(note);

            return new CourseworkSubmission
            {
                Id = Guid.NewGuid(),
                CourseworkId = courseworkId,
                StudentId = studentId,
                Note = string.IsNullOrWhiteSpace(note) ? null : note.Trim(),
                SubmittedAtUtc = DateTimeOffset.UtcNow,
                IsLate = isLate,
                Status = SubmissionStatus.Submitted
            };
        }


        public void Resubmit(string? note, bool isLate)
        {
            ValidateNote(note);
            Note= string.IsNullOrWhiteSpace(note) ? null : note.Trim();
            IsLate = isLate;
            Status = SubmissionStatus.Submitted;
            Marks = null;
            Feedback = null;
            GradedByTeacherId = null;
            GradedAtUtc = null;
            UpdatedAtUtc = DateTimeOffset.UtcNow;
        }

        public void Grade(decimal marks, string? feedback, Guid gradedByTeacherId, decimal maxMarks)
        {
            if (marks < 0)
                throw new DomainException("Marks cannot be negative.");
            if (gradedByTeacherId == Guid.Empty)
                throw new DomainException("Teacher is required.");
            if(marks>maxMarks)
                throw new DomainException($"Marks cannot exceed the total of {maxMarks} for this coursework.");

            if (feedback is not null && feedback.Trim().Length > MaxFeedbackLength)
                throw new DomainException($"Feedback must be {MaxFeedbackLength} characters or fewer.");
            
            Marks = marks;
            Feedback = string.IsNullOrWhiteSpace(feedback) ? null : feedback.Trim();
            GradedByTeacherId =gradedByTeacherId;
            GradedAtUtc = DateTimeOffset.UtcNow;
            Status = SubmissionStatus.Graded;
            UpdatedAtUtc = DateTimeOffset.UtcNow;
        }


        public void AddAttachment(SubmissionAttachment attachment)
        {
            ArgumentNullException.ThrowIfNull(attachment, nameof(attachment));
            _attachments.Add(attachment);
        }
        private static void  ValidateNote(string? note)
        {
            if(note is not null && note.Trim().Length> MaxNoteLength)
                throw new DomainException($"Note cannot exceed {MaxNoteLength} characters.");
        }
        public void EnsureHasContent()
        {
            if (_attachments.Count == 0 && string.IsNullOrWhiteSpace(Note))
                throw new DomainException("Attach at least one file, or write a note, before submitting.");
        }
        public List<SubmissionAttachment> ClearAttachments()
        {
            var removed = _attachments.ToList();
            _attachments.Clear();


            return removed;
        }

    }


}
