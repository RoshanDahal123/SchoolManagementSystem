import * as React from "react";
import { useGetMeQuery } from "../features/auth/auth-api";
import {
  clearCredentials,
  setCredentials,
} from "../features/auth/auth-slice";
import { useAppDispatch } from "../hooks/use-redux";

export function AuthBootstrap({
  children,
}: {
  children: React.ReactNode;
}) {
  const dispatch = useAppDispatch();

  const {
    data,
    isSuccess,
    isError
  } = useGetMeQuery();

  React.useEffect(() => {
    if (isSuccess && data) {
      dispatch(
        setCredentials({
          email: data.email,
          role: data.role,
        })
      );
    }

    if (isError) {
      dispatch(clearCredentials());
    }
  }, [data, isSuccess, isError, dispatch]);

  // Auth check hasn't finished yet
  if (!isSuccess && !isError) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <span className="text-sm text-muted-foreground">
          Loading…
        </span>
      </div>
    );
  }

  return <>{children}</>;
}