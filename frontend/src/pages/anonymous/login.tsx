import heroIllustration from "../../assets/hero.svg";
import { LoginForm } from "../../features/auth/components/login-form";
import { Bell, BookOpen, CalendarCheck, GraduationCapIcon } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="grid min-h-screen w-full lg:grid-cols-2">
      {/* Left column: Hero panel (hidden below lg breakpoint) */}
      <div className="relative hidden lg:flex flex-col justify-between bg-sidebar text-sidebar-foreground p-10 xl:p-14 overflow-hidden border-r border-sidebar-border">
        {/* Subtle decorative glow accents */}
        <div className="pointer-events-none absolute -top-32 -left-32 size-80 rounded-full bg-sidebar-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-32 size-80 rounded-full bg-sidebar-accent/25 blur-3xl" />

        {/* Top: Brand mark */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex aspect-square size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground shadow-xs">
            <GraduationCapIcon className="size-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-sidebar-foreground">
            School MS
          </span>
        </div>

        {/* Middle: SVG Illustration with generous whitespace */}
        <div className="relative z-10 my-auto flex flex-col items-center justify-center py-6">
          <img
            src={heroIllustration}
            alt="School Management System Illustration"
            className="max-h-72 xl:max-h-80 w-auto object-contain"
          />
        </div>

        {/* Bottom: Value proposition & feature bullets */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-2">
            <p className="text-lg xl:text-xl font-medium tracking-tight text-sidebar-foreground/95 leading-snug max-w-lg">
              One place for attendance, coursework, and results — for admins, teachers, and students.
            </p>
          </div>

          <div className="grid gap-3 pt-1">
            <div className="flex items-center gap-3 text-sm text-sidebar-foreground/90">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
                <CalendarCheck className="size-4" />
              </div>
              <span>
                <strong>Attendance</strong> tracking & daily leave management
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm text-sidebar-foreground/90">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
                <BookOpen className="size-4" />
              </div>
              <span>
                <strong>Coursework</strong>, assignments & term results
              </span>
            </div>

            <div className="flex items-center gap-3 text-sm text-sidebar-foreground/90">
              <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-primary/15 text-sidebar-primary">
                <Bell className="size-4" />
              </div>
              <span>
                <strong>Announcements</strong> & campus communications
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Right column: Form panel */}
      <div className="flex min-h-screen w-full flex-col items-center justify-center p-6 sm:p-10 lg:p-12 bg-background">
        {/* Mobile-only app branding mark (collapses below lg) */}
        <div className="mb-8 flex items-center gap-2.5 lg:hidden">
          <div className="flex aspect-square size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
            <GraduationCapIcon className="size-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-foreground">
            School MS
          </span>
        </div>

        <div className="w-full max-w-md">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}