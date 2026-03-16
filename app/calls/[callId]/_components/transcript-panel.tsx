import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

import { TranscriptEntry } from "./types";
import { formatTimestamp, getSpeakerInitials, getSpeakerLabel } from "./utils";

type TranscriptPanelProps = {
  transcriptEntries: TranscriptEntry[];
};

export function TranscriptPanel({ transcriptEntries }: TranscriptPanelProps) {
  return (
    <section className="min-h-[20rem] max-h-[54rem] self-start overflow-hidden rounded-[2rem] border border-white/10 bg-card/80 p-7 shadow-[0_20px_60px_rgba(0,0,0,0.18)]">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-base font-semibold tracking-tight">Transcript</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Every scored transcript snippet, ordered chronologically.
          </p>
        </div>
        <Badge variant="outline">{transcriptEntries.length} entries</Badge>
      </div>

      {transcriptEntries.length === 0 ? (
        <ScrollArea className="mt-6 pr-4">
          <div className="flex items-start justify-center self-start rounded-[1.6rem] border border-dashed border-white/10 bg-background/30 px-6 py-10 text-center">
            <div className="max-w-md self-start">
              <p className="text-base font-medium tracking-tight">
                No transcript entries available
              </p>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Analysis finished, but no transcript lines were saved for this
                call. Try rerunning analysis if you expected the conversation to
                appear here.
              </p>
            </div>
          </div>
        </ScrollArea>
      ) : (
        <ScrollArea className="mt-6 max-h-[calc(54rem-8rem)] pr-4">
          <div className="space-y-4">
            {transcriptEntries.map((entry, index) => (
              <article
                key={`${entry.channel}-${entry.startTimestampMs}-${index}`}
                className={cn(
                  "rounded-[1.6rem] border p-5 transition-colors",
                  entry.isObjection
                    ? "border-amber-500/30 bg-amber-500/8"
                    : entry.channel === "seller"
                      ? "border-cyan-400/10 bg-cyan-400/6"
                      : "border-white/6 bg-background/45",
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "flex size-12 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                      entry.channel === "seller"
                        ? "bg-cyan-400/14 text-cyan-300"
                        : "bg-muted text-foreground",
                    )}
                  >
                    {getSpeakerInitials(entry.channel)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-base font-medium tracking-tight">
                        {getSpeakerLabel(entry.channel)}
                      </p>
                      {entry.isObjection ? (
                        <Badge className="border-amber-500/40 bg-amber-500/12 text-amber-300">
                          Objection
                        </Badge>
                      ) : null}
                      <span className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                        {formatTimestamp(entry.startTimestampMs)}
                      </span>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-foreground/95">
                      {entry.text}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </ScrollArea>
      )}
    </section>
  );
}
