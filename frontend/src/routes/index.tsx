



import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import { AdminLayout } from "../layouts/admin-layout";
import AcademicPage from "../pages/admin/academic";
import AssignmentsPage from "../pages/admin/assignments";
import AttendancePage from "../pages/admin/attendance";
import AdminDashboardPage from "../pages/admin/dashboard";
import StudentDetailsPage from "../pages/admin/student-details";
import StudentsPage from "../pages/admin/students";
import TeachersPage from "../pages/admin/teachers";
import LoginPage from "../pages/anonymous/login";
import { AuthBootstrap } from "./auth-bootstrap";
import { PATHS } from "./paths";
import { ProtectedRoute } from "./protected-routes";
import { PublicOnlyRoute } from "./public-only-route";
import {ActivateAccountPage} from "../pages/anonymous/activate-account";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
            <Route path ={PATHS.activate} element={<ActivateAccountPage />} />
          <Route element={<PublicOnlyRoute />}>
            <Route path={PATHS.login} element={<LoginPage />} />
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route path={PATHS.admin} element={<AdminLayout />}>
              <Route index element={<Navigate to={PATHS.adminDashboard} replace />} />
              <Route path="dashboard" element={<AdminDashboardPage />} />
              <Route path="students" element={<StudentsPage />} />
              <Route path="students/:id" element={<StudentDetailsPage />} />
              <Route path="teachers" element={<TeachersPage />} />
              <Route path="academic" element={<AcademicPage />} />
              <Route path="assignments" element={<AssignmentsPage />} />
              <Route path="attendance" element={<AttendancePage />} />
            </Route>
            
            {/* Redirect old dashboard to new admin dashboard */}
            <Route path={PATHS.dashboard} element={<Navigate to={PATHS.adminDashboard} replace />} />
          </Route>

          {/* Redirect root to admin */}
          <Route path="/" element={<Navigate to={PATHS.admin} replace />} />
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  );
}
