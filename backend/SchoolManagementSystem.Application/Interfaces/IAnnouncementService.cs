using SchoolManagementSystem.Application.DTOs.Announcement;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Interfaces
{
    public  interface IAnnouncementService
    {
        Task<List<AnnouncementResponse>> GetAllAsync(CancellationToken ct = default);
        Task<AnnouncementResponse> GetByIdAsync(Guid id, CancellationToken ct = default);
        
        Task<AnnouncementResponse> CreateAsync(CreateAnnouncementRequest request,Guid id, CancellationToken ct = default);

        Task<AnnouncementResponse> UpdateAsync(Guid id, UpdateAnnouncementRequest request, CancellationToken ct = default);

        Task DeleteAsync(Guid id, CancellationToken ct = default);

        Task<List<AnnouncementResponse>> GetFeedAsync(string userRole, CancellationToken ct = default);
    }
}
