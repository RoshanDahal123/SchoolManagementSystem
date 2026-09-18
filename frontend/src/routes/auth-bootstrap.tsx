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
    const hasResolvedOnce = React.useRef(false);
  if (isSuccess || isError) {
    hasResolvedOnce.current = true;
  }

  React.useEffect(() => {
    if (isSuccess && data) {
      dispatch(
        setCredentials({
          email: data.email,
          role: data.role,
          teacherId:data.teacherId,
          studentId:data.studentId
        })
      );
    }

    if (isError) {
      dispatch(clearCredentials());
    }
  }, [data, isSuccess, isError, dispatch]);

  // Auth check hasn't finished yet
  if (!hasResolvedOnce.current) {
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