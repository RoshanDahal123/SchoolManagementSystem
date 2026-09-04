import { BrowserRouter, Route, Routes } from "react-router";
import LoginPage from "../pages/anonymous/login";
import DashboardPage from "../pages/secure/dashboard";
import { AuthBootstrap } from "./auth-bootstrap";
import { PATHS } from "./paths";
import { ProtectedRoute } from "./protected-routes";
import { PublicOnlyRoute } from "./public-only-route";

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthBootstrap>
        <Routes>
         <Route element={<PublicOnlyRoute />}>
    <Route path={PATHS.login} element={<LoginPage />} />
  </Route>

          <Route element={<ProtectedRoute />}>
            <Route path={PATHS.dashboard} element={<DashboardPage />} />
          </Route>
        </Routes>
      </AuthBootstrap>
    </BrowserRouter>
  );
}
