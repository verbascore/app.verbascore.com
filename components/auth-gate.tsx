"use client";

import { ReactNode } from "react";
import Image from "next/image";
import { SignInButton } from "@clerk/nextjs";
import { Authenticated, AuthLoading, Unauthenticated } from "convex/react";

export function AuthGate({ children }: { children: ReactNode }) {
  return (
    <>
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
            <h1 className="mt-5 text-lg font-semibold tracking-tight">
              Checking your session
            </h1>
            <p className="mt-2 text-base text-muted-foreground">
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
            <h1 className="mt-2 text-lg font-semibold tracking-tight">
              Sign in to access the Verbascore dashboard
            </h1>
            <p className="mt-3 text-base text-muted-foreground">
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

      <Authenticated>{children}</Authenticated>
    </>
  );
}
