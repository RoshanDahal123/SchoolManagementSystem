import { zodResolver } from "@hookform/resolvers/zod";
import { LogIn, Mail } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  useLocation,
  useNavigate,
  type Location
} from "react-router";

import { Button } from "../../../components/atoms/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../../../components/atoms/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "../../../components/atoms/field";
import { Input } from "../../../components/atoms/input";
import { PasswordInput } from "../../../components/molecules/password-input";

import { useAppDispatch } from "../../../hooks/use-redux";
import { getErrorStatus } from "../../../lib/api-error";
import {
  loginSchema,
  type LoginFormValues,
} from "../../../lib/validation/auth";

import { useLoginMutation } from "../auth-api";
import { setCredentials } from "../auth-slice";

export function LoginForm() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [
    login,
    {
      isLoading,
      isSuccess,
      isError,
      data,
      error,
    },
  ] = useLoginMutation();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // -----------------------------
  // Submit
  // -----------------------------

  async function onSubmit(values: LoginFormValues) {
    await login(values);
  }

  // -----------------------------
  // Login success
  // -----------------------------

  useEffect(() => {
    if (!isSuccess || !data) {
      return;
    }

    dispatch(
      setCredentials({
        email: data.email,
        role: data.role,
      }),
    );

    const from = (
      location.state as { from?: Location } | null
    )?.from;

    const redirectPath = from
      ? `${from.pathname}${from.search}${from.hash}`
      : "/dashboard";

    navigate(redirectPath,{
    replace: true
    });
  }, [
    isSuccess,
    data,
    dispatch,
    navigate,
    location.state,
  ]);

  // -----------------------------
  // API error
  // -----------------------------

  const formError = isError
    ? getErrorStatus(error) === 400
      ? "Incorrect email or password."
      : "Something went wrong. Please try again."
    : null;

  return (
    <Card className="w-full sm:max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          Admin Login
        </CardTitle>

        <CardDescription>
          Sign in to manage the school system.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form
          id="login-form"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FieldGroup>
            {/* Email */}

            <Controller
              name="email"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel
                    htmlFor="login-email"
                    className="flex items-center gap-1.5"
                  >
                    <Mail className="size-4 text-muted-foreground" />
                    Email
                  </FieldLabel>

                  <Input
                    {...field}
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    placeholder="admin@example.com"
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && (
                    <FieldError
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />

            {/* Password */}

            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="login-password">
                    Password
                  </FieldLabel>

                  <PasswordInput
                    {...field}
                    id="login-password"
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    aria-invalid={fieldState.invalid}
                  />

                  {fieldState.invalid && (
                    <FieldError
                      errors={[fieldState.error]}
                    />
                  )}
                </Field>
              )}
            />

            {/* API error */}

            {formError && (
              <p
                role="alert"
                className="text-center text-sm text-destructive"
              >
                {formError}
              </p>
            )}
          </FieldGroup>
        </form>
      </CardContent>

      <CardFooter className="flex-col gap-4">
        <Button
          type="submit"
          form="login-form"
          className="w-full gap-2"
          disabled={isLoading}
        >
          <LogIn className="size-4" />

          {isLoading ? "Signing in..." : "Sign in"}
        </Button>

      </CardFooter>
    </Card>
  );
}