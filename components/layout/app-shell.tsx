import {
  CalendarDaysIcon,
  LayoutDashboardIcon,
  ShieldIcon,
  UserIcon,
} from "lucide-react";
import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";
import type { CurrentUser } from "@/lib/auth/session";
import { cn } from "@/lib/utils";

function navLinkClassName() {
  return cn(
    "inline-flex h-8 items-center justify-center gap-2 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
    "[&_svg]:size-4 [&_svg]:opacity-80",
  );
}

export function AppShell({
  children,
  user,
}: {
  children: React.ReactNode;
  user: CurrentUser;
}) {
  return (
    <div className="min-h-svh bg-background">
      <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-4 px-4">
          <Link
            className="text-lg font-semibold tracking-normal text-foreground"
            href="/dashboard"
          >
            LIMA
          </Link>
          <nav className="flex min-w-0 items-center gap-1">
            <Link className={navLinkClassName()} href="/dashboard">
              <LayoutDashboardIcon />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link className={navLinkClassName()} href="/hackathons">
              <CalendarDaysIcon />
              <span className="hidden sm:inline">Hackatones</span>
            </Link>
            {user.roles.includes("admin") ? (
              <Link className={navLinkClassName()} href="/admin">
                <ShieldIcon />
                <span className="hidden sm:inline">Admin</span>
              </Link>
            ) : null}
            <Link className={navLinkClassName()} href={`/profile/${user.id}`}>
              <UserIcon />
              <span className="hidden sm:inline">Perfil</span>
            </Link>
            <SignOutButton />
          </nav>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
