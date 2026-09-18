import { BrowserRouter, Navigate, Route, Routes } from "react-router";

import { AdminLayout } from "@/layouts/admin-layout";
import { StudentLayout } from "@/layouts/student-layout";
import { TeacherLayout } from "@/layouts/teacher-layout";
import AnnouncementsPage from "@/pages/admin/announcement";
import StudentDashboardPage from "@/pages/student/dashboard";
import TeacherDashboardPage from "@/pages/teacher/dashboard";
import AcademicPage from "../pages/admin/academic";
import AssignmentsPage from "../pages/admin/assignments";
import AttendancePage from "../pages/admin/attendance";
import AdminDashboardPage from "../pages/admin/dashboard";
import StudentDetailsPage from "../pages/admin/student-details";
import StudentsPage from "../pages/admin/students";
import TeacherDetailsPage from "../pages/admin/teacher-details";
import TeachersPage from "../pages/admin/teachers";
import ActivateAccountPage from "../pages/anonymous/activate-account-page";
import LoginPage from "../pages/anonymous/login";
import { AuthBootstrap } from "./auth-bootstrap";
import { PATHS } from "./paths";
import { ProtectedRoute } from "./protected-routes";
import { PublicOnlyRoute } from "./public-only-route";
import { RoleBasedRedirect } from "./role-based-redirect";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
          <Route path={PATHS.activate} element={<ActivateAccountPage />} />

          <Route element={<PublicOnlyRoute />}>
            <Route path={PATHS.login} element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route path={PATHS.admin} element={<AdminLayout />}>
              <Route index element={<Navigate to={PATHS.adminDashboard} replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="students/:id" element={<StudentDetailsPage />} />
              <Route path="teachers" element={<TeachersPage />} />
              <Route path="teachers/:id" element={<TeacherDetailsPage />} />
              <Route path="academic" element={<AcademicPage />} />
              <Route path="assignments" element={<AssignmentsPage />} />
              <Route path="attendance" element={<AttendancePage />} />
              <Route path="announcements" element={<AnnouncementsPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Teacher"]} />}>
            <Route path={PATHS.teacher} element={<TeacherLayout />}>
              <Route index element={<Navigate to={PATHS.teacherDashboard} replace />} />
              <Route path="dashboard" element={<TeacherDashboardPage />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Student"]} />}>
            <Route path={PATHS.student} element={<StudentLayout />}>
              <Route index element={<Navigate to={PATHS.studentDashboard} replace />} />
              <Route path="dashboard" element={<StudentDashboardPage />} />
            </Route>
          </Route>

          <Route path={PATHS.dashboard} element={<RoleBasedRedirect />} />
          <Route path="/" element={<RoleBasedRedirect />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  );
}