# Kiro CLI Prompt — Admin Panel Shell + Students Module (Phase A)

Paste this whole prompt into Kiro CLI, run from the `frontend/` root of the SchoolManagementSystem repo.

---

## Context (read first, do not skip)

This is an existing React 19 + TypeScript + Vite project using Redux Toolkit + RTK Query, react-router,
Tailwind v4, and shadcn/ui. **Match existing conventions exactly — do not introduce a new pattern where an
existing one already works.**

Ground truth conventions already in the repo:

- **RTK Query pattern**: every feature API is built with `baseApi.injectEndpoints(...)`, imported from
  `src/app/base-api.ts`. See `src/features/auth/auth-api.ts` as the canonical example. Do **not** write axios
  calls directly in components, and do **not** use plain object wrappers like `{ getAll: () => baseApi.get(...) }`
  — that pattern exists in some stub files (`student-api.ts`, `teacher-api.ts`, `dashboard-api.ts`) and is
  **broken** (does not compile against RTK Query's `createApi`). Replace those stub files entirely.
- **Tag types**: centralized in `src/app/tags/`. `core.ts` holds cross-cutting tags (`CORE_TAGS`), `module.ts`
  assembles all feature tags into `TAG_TYPES` consumed by `baseApi`. When adding a new feature API with its own
  tag (e.g. `"Student"`, `"Teacher"`, `"Dashboard"`), create `src/features/<feature>/tags.ts` exporting that
  feature's tag array, then import + spread it into `src/app/tags/module.ts` alongside `CORE_TAGS`. Do not hardcode
  tag strings inline in `injectEndpoints` beyond referencing the exported constants.
- **Auth/session**: cookies are httpOnly; never store tokens in Redux or localStorage. `useAuth()`
  (`src/hooks/use-auth.ts`) exposes `{ email, role, isAuthenticated, isAdmin }` from `auth-slice.ts`.
- **Route protection**: `src/routes/protected-routes.tsx` — `ProtectedRoute` already calls `useGetMeQuery()`
  and redirects to `PATHS.login` unless `data?.role === "Admin"`. **Reuse this component as-is.** Do not create
  a second protected-route/role-check mechanism.
- **Paths**: `src/routes/paths.ts` exports a single `PATHS` const object. Extend it — don't scatter literal
  route strings through components.
- **shadcn config** (`components.json`): alias `ui → @/components/atoms`, style `base-nova`, icon library
  `lucide`. Generated shadcn components must land in `src/components/atoms/`, matching what's already there
  (`button.tsx`, `card.tsx`, `dialog.tsx`, `table.tsx`, etc.) — do not create a competing `src/components/ui/`
  folder (one stray `components/ui/button.tsx` already exists from an earlier mistake; ignore/remove it, don't
  extend it).
- **Feature folder shape**: `src/features/<feature>/{@types.ts, <feature>-api.ts, tags.ts, components/}`. Pages
  that consume features live in `src/pages/secure/<feature>.tsx` (soon to move under an `/admin` layout).
- **Forms**: react-hook-form + zod, resolvers via `@hookform/resolvers`. Validation schemas live in
  `src/lib/validation/`.

---

## Backend reality check (do not build UI for endpoints that don't exist)

Confirmed available endpoints today:
- `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/me`,
  `POST /api/auth/activate`
- `POST /api/students`, `GET /api/students/{id}`, `GET /api/students` (no pagination params supported yet),
  `POST /api/students/{id}/invite` (Admin-only)

**Not available:** Student update/delete/deactivate, any Teacher/Class/Subject/Attendance endpoint, any
dashboard summary endpoint. Build the UI for these areas as honest empty/"not available yet" states — do not
mock fake data or pretend an endpoint exists.

---

## Task 1 — Install missing shadcn components

Add: `sidebar`, `avatar`, `sheet`, `breadcrumb`, `tabs`, `collapsible`, `skeleton` (skeleton already exists —
skip). Install via the project's existing shadcn CLI config so they land in `src/components/atoms/` per
`components.json`.

## Task 2 — Extend `PATHS`

Add to `src/routes/paths.ts`:
```
admin: "/admin",
adminDashboard: "/admin/dashboard",
adminStudents: "/admin/students",
adminStudentDetails: (id: string) => `/admin/students/${id}`,
adminTeachers: "/admin/teachers",
adminAcademic: "/admin/academic",
adminAssignments: "/admin/assignments",
adminAttendance: "/admin/attendance",
```
Keep the existing `login`, `forgotPassword`, `resetPassword` entries. Remove or redirect the old top-level
`dashboard: "/dashboard"` path to `/admin/dashboard`.

## Task 3 — AdminLayout (sidebar + navbar shell)

Create `src/layouts/admin-layout.tsx`:
- Uses shadcn `SidebarProvider` / `Sidebar` / `SidebarInset` pattern.
- Sidebar menu items, in this exact order: **Dashboard, Students, Teachers, Academic (Classes/Subjects),
  Assignments, Attendance**. No Settings item for now.
- Each item highlights active state based on current route (`useLocation` + `PATHS`).
- Renders `<Outlet />` for nested routes inside `SidebarInset`.

Create `src/components/organisms/navbar.tsx` (reusable, not admin-specific — keep it generic so it could be
reused for a future Teacher/Student portal shell):
- Left: `SidebarTrigger` (mobile collapse) + optional breadcrumb.
- Right: user `avatar`/initials + email from `useAuth()`, `DropdownMenu` with "Logout" calling the existing
  `useLogoutMutation()` from `authApi`.

## Task 4 — Wire routing

Update `src/routes/index.tsx`:
- Add a layout route: `<Route element={<ProtectedRoute />}><Route path={PATHS.admin} element={<AdminLayout />}>`
  with nested children for dashboard/students/teachers/academic/assignments/attendance.
- `PATHS.admin` index route redirects to `PATHS.adminDashboard`.
- Reuse `ProtectedRoute` exactly as it is today — do not modify its role-check logic, just move what it wraps.

## Task 5 — Reusable `DataTable`

Create `src/components/organisms/data-table.tsx` using `@tanstack/react-table` (add as a new dependency —
not currently installed) on top of the existing shadcn `table.tsx` primitives. Requirements:
- Generic component: `<DataTable columns={...} data={...} isLoading={...} pagination={...} onPaginationChange={...} />`
- Column defs passed in per-feature (Students today, Teachers later — do not hardcode student fields into this
  component).
- Built-in: loading skeleton rows (reuse `skeleton.tsx`), empty state, and a footer using shadcn `pagination.tsx`.
- Since the backend doesn't support server-side pagination yet, support **client-side pagination** now with a
  prop shape that can switch to server-side later without a rewrite (i.e., don't hardcode "slice the array
  in the component" as the only mode).

## Task 6 — Dashboard module

`src/features/dashboard/tags.ts` → `["Dashboard"] as const`, wired into `app/tags/module.ts`.

Rewrite `src/features/dashboard/dashboard-api.ts` from scratch (delete the commented-out stub) using
`baseApi.injectEndpoints`:
```ts
getSummary: builder.query<DashboardSummary, void>({
  query: () => ({ url: "/dashboard/summary" }),
  providesTags: ["Dashboard"],
}),
```
Define `DashboardSummary` in `src/features/dashboard/@types.ts` with `totalStudents`, `totalTeachers`,
`totalClasses`, `todayAttendancePercentage`, `recentActivity: RecentActivityItem[]`.

**This endpoint does not exist on the backend yet.** Do one of:
(a) build the UI against the query and show a clear "backend endpoint not implemented" empty/error state, or
(b) flag it back to the user as a required small backend step before this page can show real numbers.
Do not fabricate mock numbers that look real.

`src/pages/secure/dashboard.tsx` (or move to `src/pages/admin/dashboard.tsx` — match whichever the layout
route resolves to): 4 KPI `Card`s in a responsive grid + a "Recent Activity" list card below.

## Task 7 — Students module (fully wired, real backend)

Delete and rewrite `src/features/students/student-api.ts` following the `authApi` pattern exactly:
- `getAll: builder.query<StudentResponse[], void>` → `GET /students`
- `getById: builder.query<StudentResponse, string>` → `GET /students/{id}`
- `create: builder.mutation<StudentResponse, CreateStudentRequest>` → `POST /students`, invalidates the
  `Student` list tag
- `invite: builder.mutation<StudentResponse, { id: string; email: string }>` → `POST /students/{id}/invite`,
  `Admin`-only on the backend, so guard the button UI on `useAuth().isAdmin` too (defense in depth, not a
  substitute for the backend check)

Match backend DTO shapes exactly (`src/features/students/@types.ts`):
```ts
export interface StudentResponse {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // DateOnly serializes as "YYYY-MM-DD"
  gender: "Male" | "Female" | "Other";
  enrollmentNumber: string;
  createdAtUtc: string;
}
export interface CreateStudentRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other";
  enrollmentNumber: string;
}
```

`src/lib/validation/student.ts` — zod schema matching `CreateStudentRequest`, mirroring the domain rules
already enforced server-side (`Student.Create`: non-empty first/last name, non-empty enrollment number, DOB
must be in the past). Client-side validation should not be laxer than the backend's domain rules.

Pages (under the new `/admin/students` route):
- **List** (`admin/students`): `DataTable` with columns Name, Enrollment #, DOB, Gender, Created; row click →
  details route; "Add Student" button → dialog/form using `create` mutation.
- **Details** (`admin/students/:id`): `getById` query, shows profile fields. Since Update/Deactivate don't
  exist on the backend, show those actions as disabled with a tooltip ("not available yet") rather than
  omitting them silently — keeps the UI honest about scope without hiding the eventual shape.
- Reuse the existing `student-form.tsx`/`student-table.tsx`/`student-details.tsx` filenames if the components
  are genuinely reusable after review; otherwise rewrite them — do not assume they already work.

## Task 8 — Teachers / Academic / Assignments / Attendance (shell only)

For each: sidebar entry + route + a page component that renders a shadcn `Card` with an icon and the message
"This module isn't connected to a backend yet — coming in a later phase." Do not create API files, mock data,
or fake tables for these yet. This keeps the shell navigable without pretending functionality exists.

---

## Explicit constraints

- Do not touch backend code in this task — frontend only.
- Do not implement Settings.
- Do not implement Forgot Password UI wiring (the form components already exist as UI-only; leave them as-is,
  don't connect them to a nonexistent backend endpoint).
- Do not fabricate data for Dashboard/Teachers/Academic/Attendance — empty/disabled states only.
- Keep every new feature's RTK Query file in the `injectEndpoints` style used by `auth-api.ts`. If you find
  yourself writing `baseApi.get(...)`, stop — that's the broken stub pattern being replaced, not extended.
- One logical unit of work per commit, conventional commit prefixes (`feat:`, `refactor:`, `chore:`), matching
  the existing project's git hygiene expectations.

## Definition of done for this phase

- [ ] `npm run build` succeeds with no TypeScript errors
- [ ] Logging in as Admin lands on `/admin/dashboard` (not `/dashboard`)
- [ ] Sidebar shows all 6 items, current route highlighted, collapses on mobile
- [ ] Navbar shows the logged-in admin's email and a working Logout
- [ ] Students list loads real data from `GET /api/students`, paginated client-side
- [ ] Creating a student via the dialog calls `POST /api/students` and the list updates via tag invalidation
  (no manual refetch)
- [ ] Student details page loads via `GET /api/students/{id}`
- [ ] Teachers/Academic/Assignments/Attendance are reachable from the sidebar and clearly marked as not yet
  implemented
- [ ] Dashboard page either shows real KPI data or a clear "backend not implemented" state — never fake numbers
- [ ] Navigating directly to `/admin/students` as a non-Admin (or logged-out) redirects to `/login`, via the
  existing unmodified `ProtectedRoute`
