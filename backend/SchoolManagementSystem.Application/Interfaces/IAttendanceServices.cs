using SchoolManagementSystem.Application.DTOs.Attendance;
using System;
using System.Collections.Generic;
using System.Text;

namespace SchoolManagementSystem.Application.Interfaces
{
    public interface IAttendanceService 
    {
        Task<List<RosterAttendanceResponse>> MarkAttendanceAsync(Guid sectionId, Guid academicYearId, MarkAttendanceRequest request, Guid markedByUserId, CancellationToken ct = default);
        Task<List<RosterAttendanceResponse>> GetRosterAttendanceAsync(Guid sectionId, Guid academicYearId, DateOnly date, CancellationToken ct = default);

        Task<List<StudentAttendanceRecordResponse>> GetStudentAttendanceAsync(Guid studentId, DateOnly? from, DateOnly? to, CancellationToken ct = default);

        Task<AttendanceSummaryResponse> GetStudentSummaryAsync(Guid studentId, DateOnly? from, DateOnly? to, CancellationToken ct = default);
       
    }

}   
