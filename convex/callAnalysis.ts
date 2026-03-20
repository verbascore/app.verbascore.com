"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";
import {
  createTranscription,
  getTranscriptionOptions,
} from "./lib/transcriber/transcriber";
import { TranscriptionStatement } from "./lib/transcriber/types";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

export async function transcribeAudio(
  audioUrl: string,
  clientReferenceId: string,
): Promise<string> {
  const options = getTranscriptionOptions(audioUrl, clientReferenceId);
  const transcriptionId = await createTranscription(options);

  if (!transcriptionId)
    throw new Error(`Failed to start transcription for ${clientReferenceId}`);

  console.log("Transcription created", transcriptionId);
  return transcriptionId;
}

export const processCallAnalysis = internalAction({
  args: {
    callId: v.id("calls"),
    pendingAnalysisId: v.id("pending_analysis"),
    teamId: v.id("teams"),
    ownerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.runMutation(internal.calls.updatePendingAnalysis, {
        pendingAnalysisId: args.pendingAnalysisId,
        status: "processing",
        progress: 10,
        currentStep: "Loading call session",
      });

      const call = await ctx.runQuery(internal.calls.getCallForProcessing, {
        callId: args.callId,
        teamId: args.teamId,
        ownerUserId: args.ownerUserId,
      });

      if (!call.sellerAudioUrl || !call.clientAudioUrl) {
        throw new Error("Audio files are no longer available");
      }

      await ctx.runMutation(internal.calls.updatePendingAnalysis, {
        pendingAnalysisId: args.pendingAnalysisId,
        progress: 25,
        currentStep: "Sending sales representative session",
      });

      await transcribeAudio(
        call.sellerAudioUrl,
        `${args.ownerUserId}:${args.teamId}:${args.callId}:seller`,
      );

      await ctx.runMutation(internal.calls.updatePendingAnalysis, {
        pendingAnalysisId: args.pendingAnalysisId,
        progress: 40,
        currentStep: "Sending client session",
      });

      await transcribeAudio(
        call.clientAudioUrl,
        `${args.ownerUserId}:${args.teamId}:${args.callId}:client`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown analysis error";
      await ctx.runMutation(internal.calls.updatePendingAnalysis, {
        pendingAnalysisId: args.pendingAnalysisId,
        status: "failed",
        progress: 100,
        currentStep: "Analysis failed",
        errorMessage: message,
      });
    }
  },
});

function buildPrompt(args: {
  title: string;
  description?: string;
  sellerTranscript: TranscriptionStatement[];
  clientTranscript: TranscriptionStatement[];
}) {
  const formatSegments = (transcript: TranscriptionStatement[]) =>
    transcript.map((s) => ({
      text: s.text,
      start_ms: s.start_ms,
      end_ms: s.end_ms,
    }));

  const getFullText = (transcript: TranscriptionStatement[]) =>
    transcript.map((s) => s.text).join(" ");

  return [
    "Analyze this sales call and return strict JSON only.",
    `Call title: ${args.title}`,
    `Call description: ${args.description ?? "N/A"}`,
    `Seller transcript:\n${getFullText(args.sellerTranscript)}`,
    `Client transcript:\n${getFullText(args.clientTranscript)}`,
    `Seller sentences:\n${JSON.stringify(formatSegments(args.sellerTranscript))}`,
    `Client sentences:\n${JSON.stringify(formatSegments(args.clientTranscript))}`,
    "Return an aiSummary string, numeric scores from 0 to 100 for quickness, introduction, knowledge, hospitality, callToAction, overallRating, and transcriptEntries.",
    "Each transcript entry must include channel ('seller' or 'client'), text, startTimestampMs, optional endTimestampMs, rating from 0 to 100, and isObjection boolean.",
  ].join("\n\n");
}

export const runAiAnalysis = internalAction({
  args: {
    callId: v.id("calls"),
    pendingAnalysisId: v.id("pending_analysis"),
    teamId: v.id("teams"),
    ownerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      const call = await ctx.runQuery(internal.calls.getCallForProcessing, {
        callId: args.callId,
        teamId: args.teamId,
        ownerUserId: args.ownerUserId,
      });

      const pendingAnalysis = await ctx.runQuery(
        internal.calls.getPendingAnalysisTranscripts,
        {
          pendingAnalysisId: args.pendingAnalysisId,
        },
      );

      if (
        !pendingAnalysis ||
        !pendingAnalysis.sellerTranscriptRaw ||
        !pendingAnalysis.clientTranscriptRaw
      ) {
        throw new Error("Missing transcripts in pending analysis record.");
      }

      const sellerTranscript = pendingAnalysis.sellerTranscriptRaw;
      const clientTranscript = pendingAnalysis.clientTranscriptRaw;

      const analysisResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4.1-mini",
            messages: [
              {
                role: "system",
                content:
                  "You analyze sales calls and return only valid JSON matching the requested schema.",
              },
              {
                role: "user",
                content: buildPrompt({
                  title: call.title,
                  description: call.description,
                  sellerTranscript,
                  clientTranscript,
                }),
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "call_analysis",
                strict: true,
                schema: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    aiSummary: { type: "string" },
                    quickness: { type: "number" },
                    introduction: { type: "number" },
                    knowledge: { type: "number" },
                    hospitality: { type: "number" },
                    callToAction: { type: "number" },
                    overallRating: { type: "number" },
                    transcriptEntries: {
                      type: "array",
                      items: {
                        type: "object",
                        additionalProperties: false,
                        properties: {
                          channel: {
                            type: "string",
                            enum: ["seller", "client"],
                          },
                          text: { type: "string" },
                          startTimestampMs: { type: "number" },
                          endTimestampMs: { type: ["number", "null"] },
                          rating: { type: "number" },
                          isObjection: { type: "boolean" },
                        },
                        required: [
                          "channel",
                          "text",
                          "startTimestampMs",
                          "endTimestampMs",
                          "rating",
                          "isObjection",
                        ],
                      },
                    },
                  },
                  required: [
                    "aiSummary",
                    "quickness",
                    "introduction",
                    "knowledge",
                    "hospitality",
                    "callToAction",
                    "overallRating",
                    "transcriptEntries",
                  ],
                },
              },
            },
          }),
        },
      );

      if (!analysisResponse.ok) {
        throw new Error(await analysisResponse.text());
      }

      const analysisJson = (await analysisResponse.json()) as {
        choices?: Array<{
          message?: {
            content?: string | null;
          };
        }>;
      };

      const rawContent = analysisJson.choices?.[0]?.message?.content;

      if (!rawContent) {
        throw new Error("OpenAI returned an empty analysis");
      }

      const parsed = JSON.parse(rawContent) as {
        aiSummary: string;
        quickness: number;
        introduction: number;
        knowledge: number;
        hospitality: number;
        callToAction: number;
        overallRating: number;
        transcriptEntries: Array<{
          channel: "seller" | "client";
          text: string;
          startTimestampMs: number;
          endTimestampMs?: number | null;
          rating: number;
          isObjection: boolean;
        }>;
      };

      await ctx.runMutation(internal.calls.completeAnalysis, {
        pendingAnalysisId: args.pendingAnalysisId,
        callId: args.callId,
        aiSummary: parsed.aiSummary,
        quickness: parsed.quickness,
        introduction: parsed.introduction,
        knowledge: parsed.knowledge,
        hospitality: parsed.hospitality,
        callToAction: parsed.callToAction,
        overallRating: parsed.overallRating,
        transcriptEntries: parsed.transcriptEntries.map((entry) => ({
          channel: entry.channel,
          text: entry.text,
          startTimestampMs: entry.startTimestampMs,
          endTimestampMs: entry.endTimestampMs ?? undefined,
          rating: entry.rating,
          isObjection: entry.isObjection,
        })),
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown analysis error";

      await ctx.runMutation(internal.calls.updatePendingAnalysis, {
        pendingAnalysisId: args.pendingAnalysisId,
        status: "failed",
        progress: 100,
        currentStep: "Analysis failed",
        errorMessage: message,
      });
    }
  },
});
