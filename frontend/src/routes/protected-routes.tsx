import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router";
import { useGetMeQuery } from "../features/auth/auth-api";
import { PATHS } from "./paths";

export function ProtectedRoute() {
  const location = useLocation();
  const { data, isLoading, isError ,isFetching} = useGetMeQuery();

  if (isLoading || (isFetching && isError)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (isError || data?.role !== "Admin") {
    return <Navigate to={PATHS.login} state={{ from: location }} replace />;
  }

  return <Outlet />;
}