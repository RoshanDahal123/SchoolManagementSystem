# School Management System — Complete Frontend Architecture & API Integration Guide

---

## Table of Contents

1. [Technology Stack](#1-technology-stack)
2. [Folder Structure](#2-folder-structure)
3. [Application Bootstrap & Auth Flow](#3-application-bootstrap--auth-flow)
4. [Routing Architecture](#4-routing-architecture)
5. [State Management](#5-state-management)
6. [API Layer — RTK Query](#6-api-layer--rtk-query)
7. [API Endpoint Integration Map](#7-api-endpoint-integration-map)
8. [Axios & Token Refresh](#8-axios--token-refresh)
9. [Component Architecture](#9-component-architecture)
10. [Forms](#10-forms)
11. [Frontend Performance](#11-frontend-performance)
12. [Custom Hooks](#12-custom-hooks)

---

## 1. Technology Stack

| Library | Version | Purpose |
|---------|---------|---------|
| React | 19 | UI framework |
| TypeScript | 5.x | Type safety |
| Vite | 6.x | Build tool & dev server |
| React Router | 7.x | Client-side routing |
| Redux Toolkit | 2.x | Global state |
| RTK Query | (included with RTK) | API calls & cache |
| Axios | 1.x | HTTP client (used by RTK Query base query) |
| React Hook Form | 7.x | Form state |
| Zod | 3.x | Schema validation |
| Tailwind CSS | 3.x | Utility-first styling |
| shadcn/ui components | custom | Accessible UI primitives |
| Sonner | 1.x | Toast notifications |
| Lucide React | 0.x | Icons |
| date-fns | 3.x | Date formatting |

---

## 2. Folder Structure

```
frontend/src/
├── app/
│   ├── base-api.ts          RTK Query base API (single createApi instance)
│   ├── store.ts             Redux store configuration
│   ├── root-reducer.ts      Combined reducer
│   └── tags/
│       ├── core.ts          Core cache tag types (Auth)
│       └── module.ts        All TAG_TYPES array (Auth, Student, Teacher,
│                            AcademicYear, GradeLevel, Section, Subject,
│                            ClassSubject, StudentEnrollment, Attendance,
│                            Announcement, Dashboard, Coursework,
│                            CourseworkSubmission, ProgressReport)
│
├── features/                Feature-based modules
│   ├── auth/                Login, activate account, auth slice
│   ├── students/            Student CRUD API + types
│   ├── teachers/            Teacher CRUD API + types
│   ├── academic/            GradeLevels, Sections, Subjects, ClassSubjects API
│   ├── academic-years/      Academic year API
│   ├── enrollment/          Enrollment API (enroll, transfer, promote)
│   ├── attendance/          Attendance API
│   ├── announcements/       Announcement API
│   ├── coursework/          Coursework API + components + types
│   ├── dashboard/           Dashboard API + types
│   └── users/               (stub, not fully implemented)
│
├── pages/
│   ├── admin/               AdminDashboard, Students, StudentDetails,
│   │                        Teachers, TeacherDetails, Academic,
│   │                        Attendance, Assignments, Announcements
│   ├── teacher/             TeacherDashboard, Coursework, CourseworkDetails
│   ├── student/             StudentDashboard, Coursework, ProgressReport
│   └── anonymous/           Login, ActivateAccount, ForgotPassword, ResetPassword
│
├── components/
│   ├── atoms/               Primitive UI: Button, Input, Dialog, Select,
│   │                        Table, Badge, Card, Tabs, Sidebar, Tooltip,
│   │                        Pagination, Field, Checkbox, Switch, Progress...
│   ├── molecules/           Composed: ConfirmDialog, EmptyState,
│   │                        PasswordInput, FileDropZone, UploadProgressBar
│   └── organisms/           Complex: DataTable, EntityListLayout,
│                            Navbar, NavUser
│
├── routes/
│   ├── index.tsx            Route definitions (AppRoutes)
│   ├── protected-routes.tsx ProtectedRoute component
│   ├── auth-bootstrap.tsx   AuthBootstrap wrapper
│   ├── paths.ts             Route path constants
│   ├── role-based-redirect.tsx  Redirects based on role
│   └── public-only-route.tsx    Prevents authenticated users from reaching login
│
├── hooks/
│   ├── use-auth.ts          Reads auth state from Redux
│   ├── use-paginated-search.ts  URL-synced pagination + search
│   ├── use-debounce.ts      Debounce hook
│   ├── use-mobile.ts        Media query hook
│   └── use-redux.ts         Typed useSelector/useDispatch
│
├── lib/
│   ├── axios.ts             Axios instance + 401 refresh interceptor
│   ├── upload-progress.ts   Upload progress store (useSyncExternalStore)
│   ├── api-error.ts         Error message extraction
│   ├── error-message.ts     Error message helper
│   └── validation/          Zod schemas per feature
│
├── layouts/
│   ├── portal-layout.tsx    Shared sidebar layout (admin/teacher/student)
│   ├── admin-layout.tsx     Admin variant
│   ├── teacher-layout.tsx   Teacher variant
│   └── student-layout.tsx   Student variant
│
└── config/
    └── nav-item.ts          Navigation items per role
```

---

## 3. Application Bootstrap & Auth Flow

### The Problem

When the app loads, React doesn't know if the user is authenticated. The JWT is in an HttpOnly cookie — JavaScript cannot read it. The only way to check is to call `GET /api/auth/me`.

### The Solution: `AuthBootstrap`

**File:** `routes/auth-bootstrap.tsx`

```
Browser loads React app
  ↓
ReactDOM renders <App /> → <AppRoutes /> → <BrowserRouter>
  ↓
<AuthBootstrap> wraps all routes and children
  ↓
useGetMeQuery() fires immediately
  ↓
GET /api/auth/me (cookie sent automatically)
  ↓
While pending: show "Loading…" spinner (blocks all routes from rendering)
  ↓
On success:
  dispatch(setCredentials({ email, role, teacherId, studentId }))
  → Redux auth state updated
  → hasResolvedOnce.current = true
  → children (routes) render
  ↓
On error:
  dispatch(clearCredentials())
  → Redux auth state cleared
  → children (routes) render
  → ProtectedRoute will redirect to login
```

**Why block rendering?** Without this, a ProtectedRoute would see `isLoading=true` and redirect to login before the auth check completes. The blocking spinner prevents a flash of the login page for authenticated users.

### `ProtectedRoute`

**File:** `routes/protected-routes.tsx`

```tsx
export function ProtectedRoute({ allowedRoles }: { allowedRoles: UserRole[] }) {
  const { data, isLoading, isError, isFetching } = useGetMeQuery();

  if (isLoading || (isFetching && isError)) return <Spinner />;
  if (isError || !data) return <Navigate to={PATHS.login} />;
  if (!allowedRoles.includes(data.role)) return <Navigate to={dashboardPathForRole(data.role)} />;
  return <Outlet />;
}
```

**Three cases:**
1. Loading → show spinner
2. Not authenticated → redirect to `/login`
3. Wrong role → redirect to that user's own dashboard

**Note:** Both `AuthBootstrap` and `ProtectedRoute` call `useGetMeQuery()`. RTK Query deduplicates — only one HTTP request fires (subsequent calls share the cached result).

### `PublicOnlyRoute`

**File:** `routes/public-only-route.tsx`

Prevents an already-authenticated user from accessing the login page. If authenticated, redirects to their dashboard.

### Role-Based Dashboard Paths

**File:** `routes/paths.ts`

```ts
export function dashboardPathForRole(role: UserRole): string {
  switch (role) {
    case "Admin": return PATHS.adminDashboard;
    case "Teacher": return PATHS.teacherDashboard;
    case "Student": return PATHS.studentDashboard;
  }
}
```

---

## 4. Routing Architecture

**File:** `routes/index.tsx`

Route structure:
```
/activate                     ActivateAccountPage   (public)
/login                        LoginPage             (public-only)

/admin                        AdminLayout
  /admin/dashboard            AdminDashboardPage
  /admin/students             StudentsPage
  /admin/students/:id         StudentDetailsPage
  /admin/teachers             TeachersPage
  /admin/teachers/:id         TeacherDetailsPage
  /admin/academic             AcademicPage
  /admin/assignments          AssignmentsPage (stub)
  /admin/attendance           AttendancePage  (stub)
  /admin/announcements        AnnouncementsPage

/teacher                      TeacherLayout
  /teacher/dashboard          TeacherDashboardPage
  /teacher/coursework         TeacherCourseworkPage
  /teacher/coursework/:id     TeacherCourseworkDetailsPage

/student                      StudentLayout
  /student/dashboard          StudentDashboardPage
  /student/coursework         StudentCourseworkPage
  /student/progress-report    StudentProgressReportPage

/                             RoleBasedRedirect
/dashboard                    RoleBasedRedirect
```

**Layouts use React Router `<Outlet />`** — the layout renders its sidebar/navbar and an `<Outlet>` where child routes render their page content.

---

## 5. State Management

### Redux Store

**File:** `app/store.ts`

```ts
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(baseApi.middleware),
});
```

**Root reducer** (`app/root-reducer.ts`):
- `auth` — auth slice (isAuthenticated, email, role, teacherId, studentId)
- `api` — RTK Query cache (all server state)

### Auth Slice

**File:** `features/auth/auth-slice.ts`

Manages client-side authentication state. This is NOT the source of truth for authentication (the JWT cookie is) — it's just the UI state derived from a successful `getMe` call.

| Action | Effect |
|--------|--------|
| `setCredentials({ email, role, teacherId, studentId })` | Sets isAuthenticated=true |
| `clearCredentials()` | Clears all auth state |

**Exports only actions, not selectors.** Selectors live in `hooks/use-auth.ts` to avoid circular imports.

### Server State vs Client State

This project correctly keeps all server data in RTK Query's cache — not in custom Redux slices.

**What's in Redux:**
- Auth state (isAuthenticated, role, email, teacherId, studentId)

**What's in RTK Query cache:**
- Students, Teachers, Academic years, Enrollments, Attendance, Announcements, Coursework

**What's in local component state (useState):**
- Dialog open/closed state
- Selected row for edit/delete
- Form input values (via React Hook Form)
- Search/filter values before debounce

**When Redux is needed:** Only for state that multiple components in different subtrees need simultaneously and that doesn't come from the server. In this project, only auth state qualifies.

**Common mistake:** Storing server data in a Redux slice with manual loading/error state instead of using RTK Query. RTK Query handles loading, error, caching, and invalidation automatically.

---

## 6. API Layer — RTK Query

### Base API

**File:** `app/base-api.ts`

Single `createApi` instance. All feature APIs use `baseApi.injectEndpoints()` to add their endpoints to the same API. This means they share:
- One RTK Query reducer (`api`)
- One middleware
- All tag types registered centrally

**Why a single API?** Multiple `createApi` instances each get their own cache and middleware. A single API allows cross-feature cache invalidation (e.g., creating an announcement can invalidate the Dashboard cache).

**Custom base query:** Uses Axios instead of `fetch` — enables the upload progress interceptor and the 401 refresh interceptor.

### Tag-Based Cache Invalidation

RTK Query uses tags to know when to refetch. Every query `providesTags` and every mutation `invalidatesTags`.

**Pattern for list + detail:**
```ts
// List query
providesTags: (result) =>
  result
    ? [...result.items.map(({ id }) => ({ type: "Student" as const, id })),
       { type: "Student", id: "LIST" }]
    : [{ type: "Student", id: "LIST" }]

// Create mutation
invalidatesTags: [{ type: "Student", id: "LIST" }]

// Update mutation
invalidatesTags: (_result, _error, { id }) => [
  { type: "Student", id },          // invalidate specific student detail
  { type: "Student", id: "LIST" },  // invalidate the list
]
```

This means:
- Creating a student refetches the list but not individual student detail pages
- Updating a student refetches both the list and that specific student's detail
- Deleting a student invalidates both

---

## 7. API Endpoint Integration Map

### Auth

**File:** `features/auth/auth-api.ts`

| Hook | Backend Endpoint | Used In |
|------|-----------------|---------|
| `useLoginMutation()` | POST /api/auth/login | `login.tsx`, `login-form.tsx` |
| `useLogoutMutation()` | POST /api/auth/logout | `nav-user.tsx` |
| `useGetMeQuery()` | GET /api/auth/me | `auth-bootstrap.tsx`, `protected-routes.tsx` |
| `useActivateAccountMutation()` | POST /api/auth/activate | `activate-account-page.tsx` |

**Cache behavior:** `getMe` provides the `"Auth"` tag. Login invalidates `"Auth"` (triggering a re-fetch of getMe). Logout clears credentials and resets the entire API state.

**Important logout flow:**
```ts
logout: builder.mutation({
  async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
    try { await queryFulfilled; }
    finally {
      dispatch(clearCredentials());       // clear auth slice
      dispatch(baseApi.util.resetApiState()); // clear ALL RTK Query cache
    }
  }
})
```

This ensures all cached data (students, teachers, etc.) is cleared when the user logs out — preventing data leaks between sessions.

---

### Students

**File:** `features/students/student-api.ts`

| Hook | Backend Endpoint | Used In |
|------|-----------------|---------|
| `useGetStudentsQuery({ page, search })` | GET /api/students | `StudentsPage` (admin) |
| `useGetStudentByIdQuery(id)` | GET /api/students/{id} | `StudentDetailsPage` |
| `useCreateStudentMutation()` | POST /api/students | `StudentsPage` dialog |
| `useUpdateStudentMutation()` | PUT /api/students/{id} | `StudentDetailsPage` |
| `useDeactivateStudentMutation()` | POST /api/students/{id}/deactivate | `StudentDetailsPage` |
| `useReactivateStudentMutation()` | POST /api/students/{id}/reactivate | `StudentDetailsPage` |
| `useInviteStudentMutation()` | POST /api/students/{id}/invite | `StudentsPage` |
| `useResendInviteMutation()` | POST /api/students/{id}/resend-invite | `StudentsPage` |

**Loading state:** `isLoading` is true on the first fetch. `isFetching` is true on subsequent fetches (e.g., pagination, search). The `EntityListLayout` shows skeleton loaders during `isLoading`.

**Error state:** `isError` = true when the request failed. `StudentsPage` shows "Failed to load students" in `emptyMessage`.

**Server-side pagination + search:** `useGetStudentsQuery({ page, search })` sends `?page=1&pageSize=10&search=...`. RTK Query caches each unique combination of arguments separately. Going from page 1 to page 2 is a new cache key, so it fetches page 2 separately (no client-side pagination).

---

### Teachers

**File:** `features/teachers/teacher-api.ts`

| Hook | Backend Endpoint | Used In |
|------|-----------------|---------|
| `useGetTeachersQuery({ page, search })` | GET /api/teachers | `TeachersPage` |
| `useGetTeacherByIdQuery(id)` | GET /api/teachers/{id} | `TeacherDetailsPage` |
| `useGetAllTeachersQuery()` | GET /api/teachers/all | `assign-teacher-dialog.tsx` |
| `useGetTeacherAssignmentsQuery(id)` | GET /api/teachers/{id}/assignments | `TeacherDetailsPage` |
| `useCreateTeacherMutation()` | POST /api/teachers | `TeachersPage` |
| `useUpdateTeacherMutation()` | PUT /api/teachers/{id} | `TeacherDetailsPage` |
| `useDeactivateTeacherMutation()` | POST /api/teachers/{id}/deactivate | `TeacherDetailsPage` |
| `useReactivateTeacherMutation()` | POST /api/teachers/{id}/reactivate | `TeacherDetailsPage` |
| `useInviteTeacherMutation()` | POST /api/teachers/{id}/invite | `TeachersPage` |
| `useResendTeacherInviteMutation()` | POST /api/teachers/{id}/resend-invite | `TeachersPage` |

**`getAllTeachers` (unpaged):** Used in the "Assign Teacher" dialog which needs to show all teachers in a dropdown. Paged data wouldn't work here — the user needs to see all at once.

---

### Academic

**File:** `features/academic/academic-api.ts`

| Hook | Backend Endpoint | Used In |
|------|-----------------|---------|
| `useGetGradeLevelsQuery()` | GET /api/grade-levels | `academic.tsx`, enrollment dialogs |
| `useCreateGradeLevelMutation()` | POST /api/grade-levels | `grade-level-dialog.tsx` |
| `useUpdateGradeLevelMutation()` | PUT /api/grade-levels/{id} | `grade-level-dialog.tsx` |
| `useDeleteGradeLevelMutation()` | DELETE /api/grade-levels/{id} | `grade-level-card.tsx` |
| `useGetSectionsQuery(gradeLevelId)` | GET /api/grade-levels/{id}/sections | `grade-structure-panel.tsx` |
| `useCreateSectionMutation()` | POST /api/grade-levels/{id}/sections | `section-dialog.tsx` |
| `useGetSubjectsQuery()` | GET /api/subjects | `subjects-panel.tsx`, assignment dialogs |
| `useCreateSubjectMutation()` | POST /api/subjects | `subject-dialog.tsx` |
| `useDeactivateSubjectMutation()` | POST /api/subjects/{id}/deactivate | `subject-row.tsx` |
| `useReactivateSubjectMutation()` | POST /api/subjects/{id}/reactivate | `subject-row.tsx` |
| `useGetClassSubjectsQuery({ gradeLevelId, yearId })` | GET /api/grade-levels/{id}/academic-years/{yearId}/subjects | `curriculum-panel.tsx` |
| `useAssignSubjectMutation()` | POST /api/grade-levels/{id}/academic-years/{yearId}/subjects | `assign-subject-dialog.tsx` |
| `useAssignTeacherMutation()` | POST /api/class-subjects/{id}/teacher | `assign-teacher-dialog.tsx` |
| `useRemoveTeacherMutation()` | DELETE /api/class-subjects/{id}/teacher | `curriculum-subject-row.tsx` |

---

### Academic Years

**File:** `features/academic-years/academic-year-api.ts`

| Hook | Backend Endpoint | Used In |
|------|-----------------|---------|
| `useGetAcademicYearsQuery()` | GET /api/academic-years | `academic.tsx` |
| `useGetActiveAcademicYearQuery()` | GET /api/academic-years/active | enrollment dialogs, attendance sheet |
| `useCreateAcademicYearMutation()` | POST /api/academic-years | `academic-year-dialog.tsx` |
| `useActivateAcademicYearMutation()` | POST /api/academic-years/{id}/activate | `academic-year-row.tsx` |
| `useDeleteAcademicYearMutation()` | DELETE /api/academic-years/{id} | `academic-year-row.tsx` |

---

### Enrollment

**File:** `features/enrollment/enrollment-api.ts`

| Hook | Backend Endpoint | Used In |
|------|-----------------|---------|
| `useGetEnrollmentHistoryQuery(studentId)` | GET /api/students/{id}/enrollments | `StudentDetailsPage` |
| `useEnrollStudentMutation()` | POST /api/students/{id}/enrollments | `enroll-student-dialog.tsx` |
| `useTransferStudentMutation()` | POST /api/enrollments/{id}/transfer | `transfer-student-dialog.tsx` |
| `usePromoteStudentMutation()` | POST /api/enrollments/{id}/promote | `promote-student-dialog.tsx` |
| `useChangeEnrollmentStatusMutation()` | PATCH /api/enrollments/{id}/status | `StudentDetailsPage` |
| `useGetSectionRosterQuery({ sectionId, academicYearId })` | GET /api/sections/{sectionId}/academic-years/{yearId}/enrollments | `section-roster-panel.tsx`, `attendance-marking-sheet.tsx` |

---

### Attendance

**File:** `features/attendance/attendance-api.ts`

| Hook | Backend Endpoint | Used In |
|------|-----------------|---------|
| `useGetRosterAttendanceQuery({ sectionId, academicYearId, date })` | GET /api/sections/{sectionId}/academic-years/{yearId}/attendance | `attendance-marking-sheet.tsx` |
| `useMarkAttendanceMutation()` | POST /api/sections/{sectionId}/academic-years/{yearId}/attendance | `attendance-marking-sheet.tsx` |
| `useGetStudentAttendanceQuery({ studentId, from?, to? })` | GET /api/students/{studentId}/attendance | `StudentDetailsPage`, student dashboard |
| `useGetStudentAttendanceSummaryQuery({ studentId, from?, to? })` | GET /api/students/{studentId}/attendance/summary | `StudentDetailsPage`, student dashboard |

**Cache keys:** Attendance is cached per `${sectionId}-${academicYearId}-${date}`. Marking attendance for a specific date invalidates that exact cache entry, triggering a re-fetch for that date.

---

### Announcements

**File:** `features/announcements/announcement-api.ts`

| Hook | Backend Endpoint | Used In |
|------|-----------------|---------|
| `useGetAnnouncementsQuery()` | GET /api/announcements | `announcement.tsx` (admin) |
| `useCreateAnnouncementMutation()` | POST /api/announcements | `announcement.tsx` |
| `useUpdateAnnouncementMutation()` | PUT /api/announcements/{id} | `announcement.tsx` |
| `useDeleteAnnouncementMutation()` | DELETE /api/announcements/{id} | `announcement.tsx` |
| `useGetAnnouncementFeedQuery()` | GET /api/announcements/feed | Admin/Teacher/Student dashboards |

**Cross-feature invalidation:** `createAnnouncement`, `updateAnnouncement`, `deleteAnnouncement` all invalidate the `"Dashboard"` tag — so the dashboard's recent activity re-fetches when announcements change.

---

### Coursework

**File:** `features/coursework/coursework-api.ts`

| Hook | Backend Endpoint | Used In |
|------|-----------------|---------|
| `useGetTeachingCourseworkQuery()` | GET /api/coursework/teaching | `teacher-coursework-panel.tsx` |
| `useGetCourseworkByIdQuery(id)` | GET /api/coursework/{id} | `coursework-details` page |
| `useCreateCourseworkMutation()` | POST /api/coursework | `coursework-form-dialog.tsx` |
| `useUpdateCourseworkMutation()` | PUT /api/coursework/{id} | `coursework-form-dialog.tsx` |
| `useDeleteCourseworkMutation()` | DELETE /api/coursework/{id} | `teacher-coursework-panel.tsx` |
| `useAddCourseworkAttachmentsMutation()` | POST /api/coursework/{id}/attachments | `attachment-list.tsx` |
| `useRemoveCourseworkAttachmentMutation()` | DELETE /api/coursework/{id}/attachments/{attachmentId} | `attachment-list.tsx` |
| `useGetSubmissionBoardQuery(courseworkId)` | GET /api/coursework/{id}/submissions | `submission-board.tsx` |
| `useGradeSubmissionMutation()` | POST /api/coursework/submissions/{submissionId}/grade | `grade-submission-dialog.tsx` |
| `useGetMyCourseworkQuery()` | GET /api/coursework/mine | `student-coursework-list.tsx` |
| `useSubmitCourseworkMutation()` | POST /api/coursework/{id}/submissions | `submit-work-dialog.tsx` |
| `useGetProgressReportQuery({ studentId })` | GET /api/coursework/progress-report/{studentId} | `progress-report-panel.tsx` |

**File uploads:** `createCoursework` and `submitCoursework` use multipart/form-data. RTK Query wraps the Axios base query which has an upload progress interceptor. The `uploadId` prop is passed in the query, enabling progress bars via `useUploadProgress`.

---

## 8. Axios & Token Refresh

**File:** `lib/axios.ts`

### Configuration

```ts
export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,  // CRITICAL: sends cookies with every request
});
```

`withCredentials: true` makes the browser include HttpOnly cookies in every request. Without this, the `accessToken` and `refreshToken` cookies would never be sent.

### Upload Progress Interceptor (Request)

If a request has `uploadId` and the data is `FormData`, the interceptor:
1. Initialises the upload progress store for that `uploadId`
2. Attaches `onUploadProgress` to the Axios config
3. Progress updates are published to `uploadProgressStore` (a `useSyncExternalStore`-compatible store)

### 401 Refresh Interceptor (Response)

When any API call returns 401:

```
Request gets 401 (access token expired)
  ↓
Is isRefreshing already true? (another refresh in progress)
  → YES: Push to failedQueue, wait for refresh to complete, then retry
  → NO: Start refresh
      ↓
      originalRequest._retry = true
      isRefreshing = true
      ↓
      POST /api/auth/refresh
      (browser sends refreshToken cookie automatically)
      ↓
      Server validates refresh token, sets new accessToken cookie
      ↓
      processQueue() — resolve all waiting requests
      → All waiting requests retry with new cookie
      ↓
      isRefreshing = false
```

**Why the queue?** Without it, 5 simultaneous 401s would trigger 5 refresh calls. This is a mutex pattern — only one refresh runs at a time.

**Edge case:** The refresh endpoint itself is excluded from the interceptor: `if (originalRequest.url?.includes("/auth/refresh")) return Promise.reject(error)`. Without this, a failed refresh would trigger another refresh, causing infinite recursion.

---

## 9. Component Architecture

### Atomic Design

The project follows atomic design:
- **atoms/** — smallest indivisible UI components (Button, Input, Badge)
- **molecules/** — atoms combined into functional units (ConfirmDialog, FileDropZone)
- **organisms/** — complex components with logic (DataTable, EntityListLayout)
- **pages/** — full page components
- **features/** — domain-specific components living alongside their API files

### `EntityListLayout` — Most Reused Organism

**File:** `components/organisms/entity-list-layout.tsx`

Used in: `StudentsPage`, `TeachersPage`, `AnnouncementsPage`, and likely others.

Renders:
- Page heading + description
- Search input (debounced)
- Primary action button (e.g., "Add Student")
- DataTable with columns, loading skeleton, empty state
- Pagination controls

This is a good example of component extraction — the pattern of "search + table + pagination" is identical across multiple admin pages. Extracting it avoids repeating 150+ lines of JSX.

### `DataTable`

**File:** `components/organisms/data-table.tsx`

A generic table component accepting:
- `columns: ColumnDef[]` — column definitions (accessor, header, cell renderer)
- `data: T[]` — row data
- `isLoading: boolean` — shows skeleton rows

Does NOT implement its own pagination — pagination is handled by `EntityListLayout` at the page level.

### `ConfirmDialog`

**File:** `components/molecules/confirm-dialog.tsx`

A reusable confirmation dialog accepting title, description, onConfirm. Used for destructive actions across multiple pages.

### `EmptyState`

**File:** `components/molecules/empty-state.tsx`

A reusable empty state component with message and optional description.

### Feature Components

Feature-specific components live inside `features/*/components/`. They are NOT reused across features — they contain domain-specific logic. Examples:

- `features/enrollment/components/enroll-student-dialog.tsx` — form + mutation for enrolling
- `features/attendance/components/attendance-marking-sheet.tsx` — full attendance marking UI
- `features/coursework/components/submission-board.tsx` — submission list with grading
- `features/coursework/components/teacher-coursework-panel.tsx` — teacher's coursework list

### Large Page Analysis

**`StudentDetailsPage`** (`pages/admin/student-details.tsx` — 24,844 bytes)

This is the largest page file. Current responsibilities:
- Fetch student by ID
- Fetch enrollment history
- Fetch attendance records
- Fetch attendance summary
- Fetch coursework progress report
- Handle activate/deactivate
- Handle enroll/transfer/promote dialogs
- Handle update student form

**Problems:** Too many responsibilities in one component. The 6+ data fetches, 4+ dialogs, and form management make it difficult to read and test.

**Proposed split:**
```
StudentDetailsPage
├── StudentProfileCard           (name, status, activate/deactivate, edit)
├── StudentEnrollmentSection
│   ├── EnrollmentHistoryTable
│   ├── EnrollStudentDialog
│   ├── TransferStudentDialog
│   └── PromoteStudentDialog
├── StudentAttendanceSummaryCard (summary numbers)
├── StudentAttendanceTable       (detailed records)
└── StudentProgressReportSection (coursework progress)
```

**`TeacherDetailsPage`** (`pages/admin/teacher-details.tsx` — 18,981 bytes)

Similarly large. Handles profile, assignments, subject specializations, invite, deactivate.

---

## 10. Forms

### Stack

- **React Hook Form** — manages form state, handles submission, tracks dirty/touched state
- **Zod** — defines validation schema
- **zodResolver** — connects Zod schema to React Hook Form

### Pattern (from `StudentsPage`)

```tsx
const schema = z.object({
  firstName: z.string().min(1, "Required"),
  lastName:  z.string().min(1, "Required"),
  dateOfBirth: z.string().min(1, "Required"),
  gender: z.enum(["Male", "Female", "Other"]),
  enrollmentNumber: z.string().min(1, "Required"),
});

const { register, handleSubmit, formState: { errors }, reset } = useForm({
  resolver: zodResolver(schema),
});

const onSubmit = async (data: CreateStudentFormData) => {
  try {
    await createStudent(data).unwrap();
    toast.success("Student created");
    setDialogOpen(false);
    reset();
  } catch {
    toast.error("Failed to create student");
  }
};

// In JSX:
<form onSubmit={handleSubmit(onSubmit)}>
  <Input {...register("firstName")} />
  {errors.firstName && <FieldError>{errors.firstName.message}</FieldError>}
</form>
```

**Why React Hook Form?** Standard `useState` for each field causes a re-render on every keystroke across the whole component. React Hook Form uses uncontrolled inputs (refs) and only re-renders when validation state changes — much better performance.

**Why Zod?** Type-safe validation. The schema both validates AND infers the TypeScript type (`z.infer<typeof schema>`), so you get one source of truth.

### Validation Schemas

**File:** `lib/validation/`

```
auth.ts           — login form, activate account form
student.ts        — create student form
teacher.ts        — create/update teacher form
academic-year.ts  — create/update academic year
subjectSchema.ts  — create/update subject
announcement.ts   — create/update announcement
coursework.ts     — create/update coursework
```

### Forms with `Select` (shadcn/ui)

`<Select>` is not a native HTML input, so it can't use `{...register()}`. Instead, it uses `watch()` + `setValue()`:

```tsx
<Select
  value={watch("gender")}
  onValueChange={(value) => setValue("gender", value)}
>
```

This is a slight inconsistency — some fields use `register` (native inputs) and others use `watch/setValue` (custom components). A cleaner approach is React Hook Form's `<Controller>` component:

```tsx
<Controller
  name="gender"
  control={control}
  render={({ field }) => (
    <Select value={field.value} onValueChange={field.onChange}>
```

---

## 11. Frontend Performance

### RTK Query Caching

RTK Query caches every query result. Navigating away from StudentsPage and back does NOT re-fetch students — it shows cached data immediately and optionally re-fetches in the background (`refetchOnFocus`).

**Cache lifetime:** 60 seconds (RTK Query default `keepUnusedDataFor`). After 60 seconds of no subscribers, the cache entry is cleared.

**`setupListeners(store.dispatch)`** in `store.ts` enables:
- `refetchOnFocus` — re-fetches when the browser tab regains focus
- `refetchOnReconnect` — re-fetches when the network reconnects

### `usePaginatedSearch` — URL-Synced State

**File:** `hooks/use-paginated-search.ts`

Search and pagination state is synced with the URL query params. This means:
- Refreshing the page preserves the current search/page
- Browser back/forward work correctly
- Users can share URLs with pre-applied filters

### `useDebounce`

**File:** `hooks/use-debounce.ts`

Search input changes are debounced before being applied to the URL and triggering an API call. Without debounce, every keystroke triggers a new API request.

### Upload Progress

**File:** `lib/upload-progress.ts`

Uses `useSyncExternalStore` — the React 18 API for subscribing to external mutable stores. The Axios interceptor writes to the store on upload progress events, and components subscribe to re-render when progress changes.

This avoids putting upload progress in Redux (which would cause too many re-renders) or in local state (which doesn't survive between components).

### Potential Issues

**1. No loading skeleton on initial page load**

`AuthBootstrap` shows "Loading…" text, not a proper skeleton UI. The first render is a plain text string.

**2. Large admin pages re-render frequently**

`StudentDetailsPage` has 6+ `useQuery` hooks. Each query state change triggers a re-render. Consider memoizing expensive computations.

**3. `getAllTeachers` is unpaged**

`GET /api/teachers/all` loads ALL teachers into memory. If there are thousands of teachers, this dropdown will be slow. A better approach would be a server-side searchable select.

**4. No optimistic updates**

None of the mutations use optimistic updates. This means there's a visible delay between clicking "Deactivate Student" and the UI updating. At this scale it's acceptable.

**5. Stub pages not removed**

`AssignmentsPage`, `AttendancePage` (admin), `ForgotPasswordPage`, `ResetPasswordPage` are stubs (empty or placeholder components). They're in the route tree, potentially confusing users.

---

## 12. Custom Hooks

### `useAuth`

**File:** `hooks/use-auth.ts`

```ts
export const useAuth = () => {
  const auth = useAppSelector(state => state.auth);
  return {
    ...auth,
    isAdmin: auth.role === "Admin",
    isTeacher: auth.role === "Teacher",
    isStudent: auth.role === "Student",
  };
};
```

Used throughout components to check role and conditionally render admin-only actions.

### `usePaginatedSearch`

**File:** `hooks/use-paginated-search.ts`

Manages:
- `searchInput` — the current value of the search box (not yet debounced)
- `searchQuery` — the debounced value sent to the API
- `page` — current page number, synced with URL
- `handleSearchChange` — resets page to 1 when search changes
- `handlePageChange` — updates page in URL

### `useDebounce`

**File:** `hooks/use-debounce.ts`

Standard debounce hook using `useEffect` + `setTimeout`. Returns a debounced value.

### `useUploadProgress`

**File:** `features/coursework/hooks/use-upload-progress.ts`

Reads upload progress from the `uploadProgressStore` for a given `uploadId`. Used by `UploadProgressBar` components to show real-time upload percentage.

### `useRedux`

**File:** `hooks/use-redux.ts`

Typed versions of `useDispatch` and `useSelector`:
```ts
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
```

These are recommended by RTK to avoid having to cast types on every use.
