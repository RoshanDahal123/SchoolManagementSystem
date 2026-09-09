# SchoolManagementSystem — Project README (Current State)

> Generated from a full code review of the uploaded `backend.zip` and `frontend.zip`.
> This reflects **what actually exists in the repo today**, not what was planned. Anything
> marked ❌ is not implemented yet, even if it's mentioned elsewhere as a future step.

---

## 1. Tech Stack (as implemented)

### Backend
| Concern | Implementation |
|---|---|
| Runtime | .NET 10, ASP.NET Core Web API |
| Architecture | Clean Architecture: `Domain → Application → Infrastructure → WebApi` |
| Database | **SQL Server** via EF Core (`UseSqlServer`) — *not PostgreSQL* |
| Auth | Custom JWT (access + refresh), httpOnly cookies, refresh rotation |
| Password hashing | Custom `IPasswordHasher` (BCrypt-based) |
| Email | `IEmailService` → `MailKitEmailService` (SMTP via MailKit) |
| Migrations | 4 applied: `InitialCreate`, `added refresh token model`, `AddStudent`, `AddAccountSetupTokenAndStudentUserLink` |

### Frontend
| Concern | Implementation |
|---|---|
| Framework | React 19 + TypeScript + Vite |
| State | Redux Toolkit + RTK Query (axios-based custom `baseQuery`) |
| Forms | react-hook-form + zod |
| Styling | Tailwind CSS v4 + shadcn/ui (`style: base-nova`, alias `ui → @/components/atoms`) |
| Routing | react-router v7/v8 (`BrowserRouter`) |
| Auth persistence | httpOnly cookies (no tokens in JS); axios interceptor does mutex-style silent refresh on 401 |

---

## 2. What's Actually Implemented

### Backend — Working Endpoints

| Endpoint | Method | Auth | Notes |
|---|---|---|---|
| `/api/auth/login` | POST | Anonymous | Sets `accessToken` + `refreshToken` httpOnly cookies |
| `/api/auth/refresh` | POST | Cookie (refresh) | Rotates refresh token atomically |
| `/api/auth/logout` | POST | Cookie | Revokes refresh token, clears cookies |
| `/api/auth/me` | GET | `[Authorize]` | Reads `email`/`role` from JWT claims, no DB hit |
| `/api/auth/activate` | POST | Anonymous | Consumes `AccountSetupToken`, activates portal account |
| `/api/students` | POST | `[Authorize]` (any role) | ⚠️ Not role-restricted |
| `/api/students/{id}` | GET | `[Authorize]` (any role) | |
| `/api/students` | GET | `[Authorize]` (any role) | No pagination/filtering — returns full list |
| `/api/students/{id}/invite` | POST | `[Authorize(Roles = "Admin")]` | Triggers portal invite email |

Domain entities that exist: `User`, `Student`, `RefreshToken`, `AccountSetupToken`.
Enums: `UserRole` (Admin/Teacher/Student), `Gender`.

An `AdminSeeder` hosted service seeds a default Admin user on startup.

### Backend — Not Implemented (despite being in the original scope)
- ❌ **Teacher** entity/repository/service/controller — nothing exists
- ❌ **Class / Section / Subject** entities — nothing exists
- ❌ **Attendance** entity — nothing exists
- ❌ Student `Update`, `Delete`, `Activate/Deactivate` — only `Create`, `GetById`, `GetAll`, `Invite`
- ❌ No pagination/search/filter on `GET /api/students`
- ❌ Self-registration (`/auth/register`) — only admin-created students exist
- ❌ Forgot password / OTP flow — designed conceptually, **not coded**
- ❌ Dashboard/KPI aggregation endpoint
- ❌ Role restriction is inconsistent: only the `invite` action is locked to `Admin`; `GetAll`/`Create`/`GetById` are open to any authenticated role

### Frontend — Working / Wired Up
- `axiosInstance` (`src/lib/axios.ts`) — httpOnly-cookie based, with a proper mutex/queue pattern for concurrent 401s triggering a single `/auth/refresh` call
- `baseApi` (`src/app/base-api.ts`) — RTK Query `createApi` wrapping the axios instance, tag types centralized in `app/tags/`
- `authApi` (`src/features/auth/auth-api.ts`) — `login`, `logout`, `getMe`, fully wired to real backend
- `auth-slice.ts` — holds `email`/`role`/`isAuthenticated` only (no tokens, correctly — tokens live in httpOnly cookies)
- `useAuth()` hook — selector hook exposing `isAdmin`
- `ProtectedRoute` — reads `useGetMeQuery()` directly (not derived Redux state — avoids the hard-refresh redirect bug), redirects non-Admins to `/login`
- `PublicOnlyRoute`, `AuthBootstrap`, `error-boundary.tsx`
- Routes today (`src/routes/index.tsx`): **only** `/login` and `/dashboard` are registered. `/dashboard` renders a static placeholder (`"Protected content — you're logged in."`)
- Login form, forgot-password form, reset-password form components exist **as UI only** (forgot/reset have no backend to call)
- shadcn primitives installed: `alert-dialog, badge, button, card, dialog, dropdown-menu, field, input-group, input-otp, input, label, pagination, select, separator, skeleton, sonner, table, textarea, tooltip`
- **Not installed yet:** `sidebar`, `avatar`, `sheet`, `breadcrumb`, `tabs`, `collapsible`

### Frontend — Present but Stubbed / Inconsistent (⚠️ important)
The `students`, `teachers`, `classes`, `subjects`, `exams`, `attendance`, `users`, `profile`, `dashboard` feature folders **already exist with files**, but on inspection:
- `student-api.ts`, `teacher-api.ts`, `dashboard-api.ts` etc. are **stub files that don't use the RTK Query pattern at all** — they call a non-existent `baseApi.get(...)` (plain object with axios-style methods), which is inconsistent with the real `authApi` pattern (`injectEndpoints`) and **will not compile/run** as-is.
- `dashboard-api.ts` is fully commented out.
- Pages like `students.tsx`, `teachers.tsx` are one-line placeholders (`<div>Students page</div>`).
- Components under `features/*/components/*.tsx` (tables, forms, dialogs) exist as filenames but should be assumed **empty/placeholder shells** until reviewed individually — do not assume they are production code.
- `paths.ts` only defines `login`, `forgotPassword`, `resetPassword`, `dashboard` — no `/admin/*` paths yet.

**Conclusion:** these folders were scaffolded (likely copied from the old reference project's file *names* for planning purposes) but contain no working code. They should be treated as a checklist of feature areas, not as a head start.

---

## 3. Known Issues / Technical Debt to Flag

1. **Folder/namespace mismatch (backend):** `CreateStudentRequest`, `StudentResponse` etc. live in the `DTOs/Auth/` folder but declare namespace `SchoolManagementSystem.Application.DTOs.Student`. Works today (namespace ≠ folder isn't a compile error), but will confuse anyone navigating by folder. Should be moved to `DTOs/Student/` for consistency.
2. **Inconsistent authorization on `StudentsController`:** only `Invite` is `Admin`-only; `Create`/`GetAll`/`GetById` are open to any authenticated role (including a future `Student`/`Teacher` login). Needs an explicit `[Authorize(Roles = "Admin")]` at the controller level (or on each admin-only action) before this goes further.
3. **No pagination on `GET /api/students`** — fine at low volumes, will not scale, and the frontend spec below assumes server-side pagination. This needs to be added before/alongside the Student list UI.
4. **Frontend stub files are broken, not placeholder-safe** — `studentsApi`/`teacherApi`/`dashboardApi` as currently written reference a `baseApi.get(...)` shape that doesn't exist on an RTK Query `createApi` instance. These need to be rewritten from scratch using the `authApi` pattern, not extended.
5. **`SameSite=Strict` cookies** — fine for `localhost` (same-site across ports), but will silently break auth the moment frontend and backend are deployed to different subdomains/domains. Flagged for later (already noted in project memory), not a blocker now.

---

## 4. What We're Building Next (this phase)

**Goal:** Build the Admin frontend shell + wire it to the backend functionality that already exists (Auth + Students), and scaffold the remaining modules (Teachers, Classes/Subjects, Attendance) as routed-but-honest "not available yet" pages so the navigation is complete without faking data.

### Scope for this phase
1. **`/admin/*` route namespace**
   - Move the authenticated app from `/dashboard` to `/admin/dashboard` (redirect `/admin` → `/admin/dashboard`)
   - All admin routes protected by the **existing** `ProtectedRoute` (reused, not rebuilt) — it already checks `role === "Admin"` via `useGetMeQuery()`
2. **AdminLayout** — shadcn `Sidebar` + reusable `Navbar.tsx`, wraps all `/admin/*` routes via a layout route
3. **Sidebar menu** (shadcn `Sidebar` primitives): Dashboard, Students, Teachers, Academic (Classes/Sections/Subjects), Assignments, Attendance. Settings intentionally excluded for now.
4. **Dashboard page** — KPI `Card`s (Total Students, Total Teachers, Total Classes, Today's Attendance %) + Recent Activity list. Since **no backend endpoint exists for this yet**, KPIs will be wired to a real `dashboardApi` with an explicit loading/empty state, calling a `/api/dashboard/summary` endpoint we'll add as a small backend step — not hardcoded fake numbers.
5. **Reusable `DataTable` component** (TanStack Table + shadcn `Table`) — one generic component consumed by both Students and Teachers lists, following the same "formApi"-style convention already used for `authApi`.
6. **Students module** — fully wired to the real backend: list (with pagination once added), create, view. Update/Deactivate UI can be built but disabled/hidden until the backend adds those endpoints (flagged, not silently faked).
7. **Teachers / Classes / Subjects / Attendance** — routed pages, sidebar entries, and empty-state UI ("Backend not implemented yet") so the shell is complete. No fake data, no mock services pretending to be real.

### Explicitly NOT in this phase
- Settings page
- Backend Teacher/Class/Subject/Attendance entities (separate backend slice, comes after this frontend shell)
- Forgot password (backend doesn't support it yet)

---

## 5. Roadmap (updated, reflects real state)

| Phase | Focus | Depends on |
|---|---|---|
| **A (this phase)** | Admin shell: layout, sidebar, navbar, `/admin/*` routing, DataTable, Dashboard KPIs (needs 1 small backend endpoint), Students module wired end-to-end | Existing Auth + Student backend |
| B | Backend: Student `Update`/`Deactivate`/pagination + `[Authorize(Roles="Admin")]` hardening | Phase A's Students UI needs |
| C | Backend: Teacher entity + CRUD, mirrored on Student pattern | — |
| D | Frontend: Teacher module wired (reuses DataTable/forms from Phase A) | Phase C |
| E | Backend: Class/Section/Subject entities + assignment endpoints | — |
| F | Frontend: Academic Structure module | Phase E |
| G | Backend: Attendance entity + marking/report endpoints | Phase E (needs Class/Section) |
| H | Frontend: Attendance module | Phase G |
| I | Forgot Password (backend OTP flow + frontend, per original spec) | — |
| J | Settings, tests, Docker, final review | — |

---

## 6. How to Use This With Kiro CLI

A separate, ready-to-paste implementation prompt for **Phase A** (admin shell + Students module) is provided in
[`KIRO_ADMIN_PANEL_PROMPT.md`](./KIRO_ADMIN_PANEL_PROMPT.md). It encodes the exact conventions found in this
codebase (RTK Query `injectEndpoints` pattern, `baseApi`/tag-types structure, `ProtectedRoute` reuse, shadcn
alias config, folder layout) so generated code matches what's already here instead of introducing a second style.
