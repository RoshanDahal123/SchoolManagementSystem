import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useGetMeQuery } from "../features/auth/auth-api";
import { dashboardPathForRole, PATHS } from "./paths";
import type { UserRole } from "@/features/auth/@types";

  interface ProtectedRouteProps {
  allowedRoles: UserRole[];
}
export function ProtectedRoute({allowedRoles}:ProtectedRouteProps) {
  const location = useLocation();
  const { data, isLoading, isError ,isFetching} = useGetMeQuery();

  if (isLoading || (isFetching && isError)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || !data ){
    return <Navigate to={PATHS.login} state={{ from: location }} replace />;
  }
 if (!allowedRoles.includes(data.role)) {
    return <Navigate to={dashboardPathForRole(data.role)} replace />;
  }
  return <Outlet />;
}