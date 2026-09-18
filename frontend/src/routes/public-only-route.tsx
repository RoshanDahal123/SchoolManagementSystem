import { useGetMeQuery } from "@/features/auth/auth-api";
import { Navigate, Outlet } from "react-router";
import { dashboardPathForRole } from "./paths";

export function PublicOnlyRoute() {
  const { data, isSuccess } = useGetMeQuery();

  if (isSuccess && data) {
    return <Navigate to={dashboardPathForRole(data.role)} replace />;
  }

  return <Outlet />;
}