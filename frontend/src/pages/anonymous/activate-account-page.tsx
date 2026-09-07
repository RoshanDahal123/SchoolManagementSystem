import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { useNavigate, useSearchParams } from "react-router"
import { toast } from "sonner"

import { Button } from "@/components/atoms/button"
import { Field, FieldError, FieldLabel } from "@/components/atoms/field"
import { Input } from "@/components/atoms/input"
import { useActivateAccountMutation } from "@/features/auth/auth-api"
import {
    activateAccountSchema,
    type ActivateAccountFormData,
} from "@/lib/validation/auth"
import { PATHS } from "@/routes/paths"

export default function ActivateAccountPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get("token")

  const [activateAccount, { isLoading }] = useActivateAccountMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ActivateAccountFormData>({
    resolver: zodResolver(activateAccountSchema),
  })

  const onSubmit = async (data: ActivateAccountFormData) => {
    if (!token) {
      toast.error("Invalid activation link")
      return
    }

    try {
      await activateAccount({
        token,
        newPassword: data.password,
      }).unwrap()

      toast.success("Account activated successfully! You can now login.")
      navigate(PATHS.login)
    } catch (error: any) {
      const message =
        error?.data?.detail ||
        error?.data?.title ||
        error?.data?.message ||
        "Failed to activate account"
      toast.error(message)
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold">Invalid Link</h1>
          <p className="text-muted-foreground">
            This activation link is invalid or has expired.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 px-4">
      <div className="w-full max-w-md space-y-6 rounded-lg border bg-background p-8 shadow-sm">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            Set Your Password
          </h1>
          <p className="text-muted-foreground text-sm">
            Create a password to activate your student account
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Field>
            <FieldLabel>New Password</FieldLabel>
            <Input
              type="password"
              placeholder="Enter new password"
              {...register("password")}
            />
            {errors.password && (
              <FieldError>{errors.password.message}</FieldError>
            )}
          </Field>

          <Field>
            <FieldLabel>Confirm Password</FieldLabel>
            <Input
              type="password"
              placeholder="Confirm your password"
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <FieldError>{errors.confirmPassword.message}</FieldError>
            )}
          </Field>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Activating..." : "Activate Account"}
          </Button>
        </form>
      </div>
    </div>
  )
}