// public-only-route.tsx
import { Navigate, Outlet } from "react-router";

import { useAuth } from "@/hooks/use-auth";
import { PATHS } from "./paths";

export function PublicOnlyRoute() {
  const isAuthenticated= useAuth();

  if (isAuthenticated) {
    return <Navigate to={PATHS.dashboard} replace />;
  }

  return <Outlet />;
}