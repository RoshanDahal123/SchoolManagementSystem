# Fix: Coursework Resubmission 500 Error

## Problem

When a student tried to resubmit an assignment, the server returned a `500 Internal Server Error`.

The root cause was `DbUpdateConcurrencyException: The database operation was expected to affect 1 row(s), but actually affected 0 row(s)` thrown from `CourseworkService.SubmitAsync`.

---

## Root Cause

The resubmit flow was using EF Core's change tracker to manage the old attachment rows. The tracker had stale state from the initial entity load, causing EF to issue conflicting `DELETE` or `UPDATE` statements against rows that had already been handled — resulting in 0 rows affected instead of the expected 1.

Multiple tracker-based fixes were attempted (RemoveRange, MarkModified, ClearTracking + reload) but all failed because EF's change tracker state is unpredictable when the same `DbContext` instance is shared across multiple repository calls within a single request.

---

## Fix

Introduced `ResubmitAsync` in `CourseworkSubmissionRepository` that bypasses the EF change tracker entirely using three direct SQL operations:

| Step | Operation | Method |
|------|-----------|--------|
| 1 | Delete old attachment rows | `ExecuteDeleteAsync` |
| 2 | Update submission scalar fields | `ExecuteUpdateAsync` |
| 3 | Insert new attachment rows | `AddRange` + `SaveChangesAsync` on a cleared tracker |

Since steps 1 and 2 use raw SQL (`WHERE Id = @id`), they always affect exactly the rows they target — no tracker state, no concurrency conflicts possible.

---

## Files Changed

| File | Change |
|------|--------|
| `Domain/Entities/CourseworkSubmission.cs` | `Resubmit()` now updates `SubmittedAtUtc` |
| `Application/Interfaces/ICourseWorkSubmissionRepository.cs` | Added `ResubmitAsync(...)` |
| `Infrastructure/SqlRepo/Repositories/CourseworkSubmissionRepository.cs` | Implemented `ResubmitAsync` with direct SQL |
| `Application/Services/CourseWorkService.cs` | `SubmitAsync` resubmit block calls `ResubmitAsync` instead of tracked EF operations |

---

## Additional Changes in This Session

| Feature | Description |
|---------|-------------|
| Real-time notifications (SignalR) | `NotificationHub`, `NotificationService`, `NotificationsController`, `INotificationService` |
| Notification bell (frontend) | `NotificationBell` component, RTK Query endpoints, SignalR connection hook |
| Announcement notifications | `AnnouncementService.CreateAsync` notifies target role on new announcement |
| Coursework notifications | New assignment → enrolled students notified, graded → student notified, submitted → teacher notified |
| Resubmit teacher notification | Teacher receives real-time notification when student resubmits |
