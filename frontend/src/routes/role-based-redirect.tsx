import { useGetMeQuery } from "@/features/auth/auth-api";
import { Navigate } from "react-router";
import { PATHS, dashboardPathForRole } from "./paths";

export function RoleBasedRedirect() {
  const { data, isLoading, isError } = useGetMeQuery();

  if (isLoading) return null; // AuthBootstrap already shows a loader during initial resolution

  if (isError || !data) {
    return <Navigate to={PATHS.login} replace />;
  }

  return <Navigate to={dashboardPathForRole(data.role)} replace />;
}