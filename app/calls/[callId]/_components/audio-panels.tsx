import { PlayCircle } from "lucide-react";

type AudioPanelsProps = {
  sellerAudioUrl: string | null;
  clientAudioUrl: string | null;
};

function AudioPanel({
  label,
  audioUrl,
}: {
  label: string;
  audioUrl: string | null;
}) {
  return (
    <div className="rounded-[1.6rem] border border-white/8 bg-background/30 p-4 backdrop-blur">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium">{label}</p>
        {audioUrl ? (
          <PlayCircle className="size-4 text-muted-foreground" />
        ) : null}
      </div>
      {audioUrl ? (
        <audio className="mt-3 w-full" controls src={audioUrl} />
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Audio unavailable.</p>
      )}
    </div>
  );
}

export function AudioPanels({
  sellerAudioUrl,
  clientAudioUrl,
}: AudioPanelsProps) {
  return (
    <div className="mt-6 grid gap-4 md:grid-cols-2">
      <AudioPanel label="Seller channel" audioUrl={sellerAudioUrl} />
      <AudioPanel label="Client channel" audioUrl={clientAudioUrl} />
    </div>
  );
}
