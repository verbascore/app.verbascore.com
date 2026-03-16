"use client";

import Image from "next/image";
import Link from "next/link";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";
import {
  BarChart3,
  Bell,
  LayoutDashboard,
  Library,
  MessageSquareQuote,
  PhoneCall,
} from "lucide-react";
import { SignInButton, UserButton } from "@clerk/nextjs";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const navigationItems = [
  {
    title: "Dashboard",
    href: "#dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Sales Calls",
    href: "#sales-calls",
    icon: PhoneCall,
  },
  {
    title: "Analytics",
    href: "#analytics",
    icon: BarChart3,
  },
  {
    title: "Feedback",
    href: "#feedback",
    icon: MessageSquareQuote,
  },
  {
    title: "Notifications",
    href: "#notifications",
    icon: Bell,
  },
  {
    title: "Materials",
    href: "#materials",
    icon: Library,
  },
] as const;

export default function Page() {
  return (
    <TooltipProvider>
      <AuthLoading>
        <div className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(34,197,246,0.14),_transparent_24%),linear-gradient(180deg,_transparent,_rgba(15,23,42,0.03))] p-6">
          <div className="w-full max-w-md rounded-3xl border bg-card/90 p-8 text-center shadow-sm backdrop-blur">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sidebar-accent/70 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              <Image
                src="/verbascore-mark.png"
                alt="Verbascore"
                width={56}
                height={56}
                className="h-10 w-10 object-contain"
                priority
              />
            </div>
            <h1 className="mt-5 text-2xl font-semibold tracking-tight">
              Checking your session
            </h1>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Connecting Clerk and Convex before loading your workspace.
            </p>
          </div>
        </div>
      </AuthLoading>

      <Unauthenticated>
        <div className="flex min-h-svh items-center justify-center bg-[radial-gradient(circle_at_top_left,_rgba(34,197,246,0.14),_transparent_24%),linear-gradient(180deg,_transparent,_rgba(15,23,42,0.03))] p-6">
          <div className="w-full max-w-md rounded-3xl border bg-card/90 p-8 text-center shadow-sm backdrop-blur">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-sidebar-accent/70 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
              <Image
                src="/verbascore-mark.png"
                alt="Verbascore"
                width={56}
                height={56}
                className="h-10 w-10 object-contain"
                priority
              />
            </div>
            <p className="mt-5 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Secure Access
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">
              Sign in to access the Verbascore dashboard
            </h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Authenticate with Clerk before entering the revenue command
              center.
            </p>
            <SignInButton mode="modal">
              <button className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">
                Authenticate to continue
              </button>
            </SignInButton>
          </div>
        </div>
      </Unauthenticated>

      <Authenticated>
        <SidebarProvider>
          <Sidebar collapsible="icon">
            <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
              <Link
                href="#dashboard"
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-sidebar-accent"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent/70 shadow-sm ring-1 ring-black/5 dark:ring-white/10">
                  <Image
                    src="/verbascore-mark.png"
                    alt="Verbascore"
                    width={40}
                    height={40}
                    className="h-7 w-7 object-contain"
                    priority
                  />
                </div>
                <div className="grid flex-1 text-left group-data-[collapsible=icon]:hidden">
                  <span className="text-sm font-semibold tracking-tight">
                    Verbascore
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Revenue command center
                  </span>
                </div>
              </Link>
            </SidebarHeader>

            <SidebarContent className="px-2 py-4">
              <SidebarGroup>
                <SidebarGroupLabel className="px-3 text-[11px] font-semibold tracking-[0.18em] text-sidebar-foreground/55">
                  NAVIGATION
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item, index) => {
                      const Icon = item.icon;

                      return (
                        <SidebarMenuItem key={item.title}>
                          <SidebarMenuButton
                            asChild
                            tooltip={item.title}
                            isActive={index === 0}
                            className="h-10 rounded-xl px-3 text-sm"
                          >
                            <Link href={item.href}>
                              <Icon />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarRail />
          </Sidebar>

          <SidebarInset>
            <div className="flex min-h-svh flex-col">
              <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
                <div className="flex items-center gap-3">
                  <SidebarTrigger className="md:hidden" />
                  <div>
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                      Verbascore
                    </p>
                    <h1 className="text-lg font-semibold tracking-tight">
                      Dashboard
                    </h1>
                  </div>
                </div>
                <UserButton />
              </header>

              <main className="flex-1 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,246,0.14),_transparent_24%),linear-gradient(180deg,_transparent,_rgba(15,23,42,0.03))] px-4 py-6 md:px-6">
                <section
                  id="dashboard"
                  className="rounded-3xl border bg-card/90 p-6 shadow-sm backdrop-blur"
                >
                  <p className="text-sm text-muted-foreground">
                    Clerk authentication and Convex are now connected.
                  </p>
                  <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                    Turn every conversation into measurable revenue.
                  </h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                    This dashboard is only visible after the user signs in,
                    using the Convex + Clerk flow from the official integration
                    guide.
                  </p>
                </section>

                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {navigationItems.slice(1).map((item) => (
                    <section
                      key={item.title}
                      id={item.href.slice(1)}
                      className="rounded-2xl border bg-card p-5 shadow-sm"
                    >
                      <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">
                        {item.title}
                      </p>
                      <h3 className="mt-2 text-lg font-semibold tracking-tight">
                        {item.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Placeholder section for the {item.title.toLowerCase()}{" "}
                        view.
                      </p>
                    </section>
                  ))}
                </div>
              </main>
            </div>
          </SidebarInset>
        </SidebarProvider>
      </Authenticated>
    </TooltipProvider>
  );
}
