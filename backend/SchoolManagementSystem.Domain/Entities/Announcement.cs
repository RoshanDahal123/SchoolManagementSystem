using SchoolManagementSystem.Domain.Enums;
using SchoolManagementSystem.Domain.Exceptions;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Domain.Entities
{
    public class Announcement
    {
        public Guid Id { get; private set; }
        public string Title { get; private set; } = string.Empty;
        public string Body { get; private set; } = string.Empty;

        public AnnouncementTargetRole TargetRole { get; private set; }

        //No Navigation property the domain only needs to know who, 
        //not the full user graphs

        public Guid CreatedByUserId { get; private set; }
        public DateTimeOffset CreatedAtUtc { get; private set; }
       
        public DateTimeOffset? UpdatedAtUtc { get; private set; }

        private Announcement() { }//For EF core

        public static Announcement Create(
            string title,
            string body,
            AnnouncementTargetRole targetRole,
            Guid createdByUserId)
        {
            if (string.IsNullOrWhiteSpace(title))
            {
                throw new DomainException("Title cannot be null or empty.");
            }
            if (title.Trim().Length > 150)
            {
                throw new DomainException("Title cannot exceed 150 characters.");
            }

            if (string.IsNullOrWhiteSpace(body))
            {
                throw new DomainException("Body cannot be null or empty.");
            }
            if (body.Trim().Length > 2000)
            {
                throw new DomainException("Body cannot exceed 1000 characters.");
            }

            if (createdByUserId == Guid.Empty)
                throw new DomainException("CreatedByUserId cannot be empty.");

            return new Announcement
            {
                Id = Guid.NewGuid(),
                Title = title.Trim(),
                Body = body.Trim(),
                TargetRole = targetRole,
                CreatedByUserId = createdByUserId,
                CreatedAtUtc = DateTimeOffset.UtcNow
            };
        }


        public void Update(string title, string body, AnnouncementTargetRole targetRole)
        {
            if (string.IsNullOrWhiteSpace(title))
            {
                throw new DomainException("Title cannot be null or empty.");
            }
            if (title.Trim().Length > 150)
            {
                throw new DomainException("Title cannot exceed 150 characters.");
            }
            if (string.IsNullOrWhiteSpace(body))
            {
                throw new DomainException("Body cannot be null or empty.");
            }
            if (body.Trim().Length > 2000)
            {
                throw new DomainException("Body cannot exceed 1000 characters.");
            }
            Title = title.Trim();
            Body = body.Trim();
            TargetRole = targetRole;
            UpdatedAtUtc = DateTimeOffset.UtcNow;

        }
    } 


    }

