"use client";

import Link from "next/link";
import { ArrowUpRight, Loader2, Sparkles, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { CallRowData } from "./types";
import { formatDateTime, getCallStatus } from "./utils";

type CallsTableProps = {
  calls: CallRowData[] | undefined;
  hasCalls: boolean;
  analysisCallId: string | null;
  deletingCallId: string | null;
  onStartAnalysis: (callId: string) => void;
  onDeleteCall: (callId: string, callTitle: string) => void;
};

export function CallsTable({
  calls,
  hasCalls,
  analysisCallId,
  deletingCallId,
  onStartAnalysis,
  onDeleteCall,
}: CallsTableProps) {
  return (
    <section className="mt-6 rounded-3xl border bg-card shadow-sm">
      <div className="flex items-center justify-between gap-4 border-b px-6 py-5">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Library
          </p>
          <h3 className="mt-2 text-lg font-semibold tracking-tight">
            All recorded calls
          </h3>
        </div>
        {calls ? (
          <p className="text-sm text-muted-foreground">
            {calls.length} {calls.length === 1 ? "call" : "calls"}
          </p>
        ) : null}
      </div>

      {!calls ? (
        <div className="flex items-center gap-3 px-6 py-8 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading calls...
        </div>
      ) : !hasCalls ? (
        <div className="px-6 py-8 text-sm text-muted-foreground">
          No calls yet. Start by uploading a seller and client MP3 pair.
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow className="border-b">
              <TableHead className="pl-6">Call</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead className="w-[28%]">Description</TableHead>
              <TableHead className="pr-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {calls.map((call) => {
              const status = getCallStatus(call);
              const isAnalysisRunning =
                !!call.pendingAnalysis &&
                call.pendingAnalysis.status !== "failed" &&
                call.pendingAnalysis.status !== "completed";
              const isDeleting = deletingCallId === call._id;
              const canStartAnalysis =
                !call.analysis &&
                (!call.pendingAnalysis ||
                  call.pendingAnalysis.status === "failed");

              return (
                <TableRow key={call._id} className="hover:bg-muted/30">
                  <TableCell className="pl-6 align-top">
                    <div className="grid gap-1">
                      <Link
                        href={`/calls/${call._id}`}
                        className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight hover:text-primary"
                      >
                        {call.title}
                        <ArrowUpRight className="size-3.5" />
                      </Link>
                      <p className="text-xs text-muted-foreground">
                        {call._id}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="align-top text-sm text-muted-foreground">
                    {formatDateTime(call.createdAt)}
                  </TableCell>
                  <TableCell className="align-top">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </TableCell>
                  <TableCell className="align-top text-sm font-medium">
                    {call.analysis ? `${call.analysis.overallRating}/100` : "—"}
                  </TableCell>
                  <TableCell className="max-w-0 align-top whitespace-normal text-sm text-muted-foreground">
                    {call.description || "No description provided."}
                  </TableCell>
                  <TableCell className="pr-6 align-top">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/calls/${call._id}`}
                        className="inline-flex h-9 items-center justify-center rounded-lg border px-3 text-sm font-medium transition-colors hover:bg-muted"
                      >
                        Open
                      </Link>
                      <button
                        type="button"
                        onClick={() => onStartAnalysis(call._id)}
                        disabled={
                          !canStartAnalysis || analysisCallId === call._id
                        }
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {analysisCallId === call._id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Sparkles className="size-4" />
                        )}
                        Analyze
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteCall(call._id, call.title)}
                        disabled={isDeleting || isAnalysisRunning}
                        className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-destructive/30 px-3 text-sm font-medium text-destructive transition-colors hover:bg-destructive/5 disabled:cursor-not-allowed disabled:opacity-50"
                        title={
                          isAnalysisRunning
                            ? "Wait for analysis to finish before deleting this call."
                            : undefined
                        }
                      >
                        {isDeleting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4" />
                        )}
                        Delete
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </section>
  );
}
