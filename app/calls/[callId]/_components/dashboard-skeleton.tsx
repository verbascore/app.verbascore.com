import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type DashboardSkeletonProps = {
  title: string;
  description?: string;
  isQueued: boolean;
  progress?: number;
  currentStep?: string;
};

export function DashboardSkeleton({
  title,
  description,
  isQueued,
  progress,
  currentStep,
}: DashboardSkeletonProps) {
  return (
    <div className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(360px,0.95fr)]">
      <section className="self-start rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-base font-semibold tracking-tight">Transcript</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Transcript entries will appear here once analysis finishes.
            </p>
          </div>
          <Badge variant="outline">
            {isQueued ? "Queued" : `${progress ?? 0}% complete`}
          </Badge>
        </div>

        <div className="mt-6 space-y-4">
          {[0, 1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className={cn(
                "rounded-[1.6rem] border p-5",
                item === 2
                  ? "border-amber-500/20 bg-amber-500/5"
                  : "border-white/5 bg-background/40",
              )}
            >
              <div className="flex items-start gap-4">
                <Skeleton className="size-12 rounded-full" />
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-5 w-28" />
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-[88%]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="space-y-6">
        <section className="self-start rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          <div className="space-y-4">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
              Analysis status
            </p>
            <p className="text-base font-semibold tracking-tight">{title}</p>
            <p className="text-sm leading-6 text-muted-foreground">
              {description ||
                "We are still transcribing and scoring the conversation."}
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{currentStep || "Preparing analysis"}</span>
                <span>{progress ?? 0}%</span>
              </div>
              <Progress
                value={progress ?? 6}
                className="h-3 rounded-full bg-muted/80"
              />
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          <Skeleton className="mx-auto h-5 w-28" />
          <div className="mt-6 flex justify-center">
            <Skeleton className="size-32 rounded-full" />
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          <Skeleton className="h-8 w-36" />
          <div className="mt-5 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-[92%]" />
            <Skeleton className="h-4 w-[86%]" />
            <Skeleton className="h-4 w-[90%]" />
          </div>
        </section>

        <section className="rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
          <Skeleton className="h-8 w-44" />
          <div className="mt-6 space-y-5">
            {[0, 1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="grid grid-cols-[140px_1fr_40px] items-center gap-4"
              >
                <Skeleton className="h-6 w-28" />
                <Skeleton className="h-3 w-full rounded-full" />
                <Skeleton className="h-6 w-10" />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
