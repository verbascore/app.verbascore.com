"use client";

import { ReactNode, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { CheckCircle2, Link2, Loader2, XCircle } from "lucide-react";

import { api } from "@/convex/_generated/api";
import { AppShell } from "@/components/app-shell";

export default function InvitationPage() {
  const router = useRouter();
  const params = useParams<{ token: string }>();
  const token =
    typeof params.token === "string" ? params.token : params.token?.[0];
  const invitationData = useQuery(
    api.teams.getInvitationDetails,
    token ? { token } : "skip",
  );
  const acceptInvitation = useMutation(api.teams.acceptInvitation);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAccept() {
    if (!token) {
      return;
    }

    try {
      setIsAccepting(true);
      setError(null);
      await acceptInvitation({ token });
      router.push("/");
    } catch (acceptError) {
      setError(
        acceptError instanceof Error
          ? acceptError.message
          : "Failed to accept invitation.",
      );
      setIsAccepting(false);
    }
  }

  return (
    <AppShell activeHref="/" title="Invitation">
      <div className="mx-auto max-w-3xl">
        {!token || invitationData === undefined ? (
          <section className="rounded-[2rem] border bg-card/90 p-8 text-sm text-muted-foreground shadow-sm">
            <div className="flex items-center gap-3">
              <Loader2 className="size-4 animate-spin" />
              Loading invitation...
            </div>
          </section>
        ) : !invitationData ? (
          <StateCard
            icon={<XCircle className="size-5 text-destructive" />}
            title="Invitation not found"
            description="This invitation link is invalid or the team no longer exists."
          />
        ) : (
          <section className="rounded-[2rem] border bg-card/90 p-8 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Link2 className="size-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                  Team Invitation
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                  Join {invitationData.team.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  This invitation is reserved for{" "}
                  <span className="font-medium text-foreground">
                    {invitationData.invitation.email}
                  </span>
                  . Accepting it will add your account to the team as a seller
                  and switch your active workspace.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] border bg-background/70 p-5">
              <p className="text-sm leading-6 text-muted-foreground">
                {invitationData.team.description}
              </p>
            </div>

            {error ? (
              <div className="mt-6 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            {!invitationData.emailMatches ? (
              <StateCard
                icon={<XCircle className="size-5 text-destructive" />}
                title="Wrong account"
                description={`Sign in with ${invitationData.invitation.email} to accept this invitation.`}
                compact
              />
            ) : invitationData.invitation.status !== "pending" ? (
              <StateCard
                icon={<XCircle className="size-5 text-destructive" />}
                title="Invitation inactive"
                description={`This invitation has already been ${invitationData.invitation.status}.`}
                compact
              />
            ) : invitationData.alreadyMember ? (
              <StateCard
                icon={<CheckCircle2 className="size-5 text-primary" />}
                title="Already a member"
                description="Your account is already part of this team. You can switch to it from the sidebar."
                compact
              />
            ) : (
              <button
                type="button"
                disabled={isAccepting}
                onClick={handleAccept}
                className="mt-6 inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isAccepting ? "Joining..." : "Accept invitation"}
              </button>
            )}
          </section>
        )}
      </div>
    </AppShell>
  );
}

function StateCard({
  icon,
  title,
  description,
  compact = false,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  compact?: boolean;
}) {
  return (
    <section
      className={`${
        compact ? "mt-6" : ""
      } rounded-[1.5rem] border bg-background/70 p-5`}
    >
      <div className="flex items-start gap-3">
        {icon}
        <div>
          <h3 className="text-base font-semibold tracking-tight">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            {description}
          </p>
        </div>
      </div>
    </section>
  );
}
