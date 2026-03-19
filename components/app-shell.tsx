"use client";

import { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import {
  BarChart3,
  Bell,
  LayoutDashboard,
  Library,
  MessageSquareQuote,
  Phone,
  PhoneCall,
  Rows3,
  Users2,
} from "lucide-react";

import { TeamSidebarSwitcher } from "@/components/team-sidebar-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
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

const baseNavigationItems = [
  {
    title: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    title: "CRM",
    href: "/crm",
    icon: Rows3,
  },
  {
    title: "Sales Calls",
    href: "/calls",
    icon: PhoneCall,
  },
  {
    title: "Analytics",
    href: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Feedback",
    href: "/feedback",
    icon: MessageSquareQuote,
  },
  {
    title: "Notifications",
    href: "/notifications",
    icon: Bell,
  },
  {
    title: "Team",
    href: "/team",
    icon: Users2,
  },
  {
    title: "Materials",
    href: "/materials",
    icon: Library,
  },
] as const;

export function AppShell({
  title,
  activeHref,
  children,
  headerActions,
  workspaceTitle,
  workspaceRole,
}: {
  title: string;
  activeHref: string;
  children: ReactNode;
  headerActions?: ReactNode;
  workspaceTitle?: string;
  workspaceRole?: "owner" | "seller";
}) {
  return (
    <TooltipProvider>
      <SidebarProvider>
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-sidebar-border px-4 py-5">
            <Link
              href="/"
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
                  {workspaceTitle || "Revenue command center"}
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
                  {(workspaceRole === "seller"
                    ? [
                        baseNavigationItems[0],
                        baseNavigationItems[1],
                        {
                          title: "Phone",
                          href: "/phone",
                          icon: Phone,
                        },
                        ...baseNavigationItems.slice(2),
                      ]
                    : baseNavigationItems
                  ).map((item) => {
                    const Icon = item.icon;

                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton
                          asChild
                          tooltip={item.title}
                          isActive={item.href === activeHref}
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

          <SidebarFooter className="border-t border-sidebar-border p-3">
            <TeamSidebarSwitcher />
          </SidebarFooter>

          <SidebarRail />
        </Sidebar>

        <SidebarInset>
          <div className="flex min-h-svh flex-col">
            <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-3 border-b bg-background/80 px-4 backdrop-blur md:px-6">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="md:hidden" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    {workspaceTitle || "Verbascore"}
                  </p>
                  <h1 className="text-lg font-semibold tracking-tight">
                    {title}
                  </h1>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {workspaceRole ? (
                  <span className="hidden rounded-full border px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground sm:inline-flex">
                    {workspaceRole}
                  </span>
                ) : null}
                {headerActions}
                <UserButton />
              </div>
            </header>

            <main className="flex-1 bg-[radial-gradient(circle_at_top_left,_rgba(34,197,246,0.14),_transparent_24%),linear-gradient(180deg,_transparent,_rgba(15,23,42,0.03))] px-4 py-6 md:px-6">
              {children}
            </main>
          </div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
