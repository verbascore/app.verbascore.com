import { Progress } from "@/components/ui/progress";

import { CallAnalysis } from "./types";

function ScoreRing({ value }: { value: number }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-[2rem] border border-emerald-500/20 bg-[radial-gradient(circle_at_top,_rgba(132,204,22,0.18),_transparent_52%),linear-gradient(180deg,rgba(132,204,22,0.10),rgba(132,204,22,0.03))] px-8 py-10">
      <p className="text-sm font-medium text-muted-foreground">Overall Score</p>
      <div className="flex h-32 w-32 items-center justify-center rounded-full border border-emerald-500/35 bg-emerald-500/10 text-lg font-semibold tracking-tight text-lime-400 shadow-[inset_0_0_40px_rgba(132,204,22,0.12)]">
        {value}
      </div>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="grid grid-cols-[minmax(0,140px)_1fr_auto] items-center gap-4">
      <p className="text-base font-medium tracking-tight">{label}</p>
      <div className="rounded-full bg-muted/70 p-1">
        <Progress value={value} className="h-3 rounded-full bg-muted/80" />
      </div>
      <p className="w-11 text-right text-base font-semibold tracking-tight text-lime-400">
        {value}
      </p>
    </div>
  );
}

export function AnalysisSidebar({ analysis }: { analysis: CallAnalysis }) {
  return (
    <div className="h-full space-y-6">
      <section className="rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <ScoreRing value={analysis.overallRating} />
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <p className="text-base font-semibold tracking-tight">AI Summary</p>
        <p className="mt-4 text-base text-muted-foreground">
          {analysis.aiSummary}
        </p>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
        <p className="text-base font-semibold tracking-tight">
          Criteria Breakdown
        </p>
        <div className="mt-6 space-y-5">
          <MetricRow label="Quickness" value={analysis.quickness} />
          <MetricRow label="Introduction" value={analysis.introduction} />
          <MetricRow label="Knowledge" value={analysis.knowledge} />
          <MetricRow label="Hospitality" value={analysis.hospitality} />
          <MetricRow label="Call to Action" value={analysis.callToAction} />
        </div>
      </section>
    </div>
  );
}
