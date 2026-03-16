"use node";

import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

function requireEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  return value;
}

async function transcribeAudio(audioUrl: string, filename: string) {
  const audioResponse = await fetch(audioUrl);

  if (!audioResponse.ok) {
    throw new Error(`Failed to fetch ${filename} audio`);
  }

  const audioBlob = await audioResponse.blob();
  const formData = new FormData();
  formData.append("model", "gpt-4o-mini-transcribe");
  formData.append("response_format", "json");
  formData.append(
    "file",
    new File([audioBlob], filename, { type: "audio/mpeg" }),
  );

  const transcriptionResponse = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${requireEnv("OPENAI_API_KEY")}`,
      },
      body: formData,
    },
  );

  if (!transcriptionResponse.ok) {
    throw new Error(await transcriptionResponse.text());
  }

  return (await transcriptionResponse.json()) as {
    text?: string;
    segments?: Array<{
      start?: number;
      end?: number;
      text?: string;
    }>;
  };
}

function buildPrompt(args: {
  title: string;
  description?: string;
  sellerTranscript: {
    text?: string;
    segments?: Array<{ start?: number; end?: number; text?: string }>;
  };
  clientTranscript: {
    text?: string;
    segments?: Array<{ start?: number; end?: number; text?: string }>;
  };
}) {
  return [
    "Analyze this sales call and return strict JSON only.",
    `Call title: ${args.title}`,
    `Call description: ${args.description ?? "N/A"}`,
    `Seller transcript:\n${args.sellerTranscript.text ?? ""}`,
    `Client transcript:\n${args.clientTranscript.text ?? ""}`,
    `Seller segments:\n${JSON.stringify(args.sellerTranscript.segments ?? [])}`,
    `Client segments:\n${JSON.stringify(args.clientTranscript.segments ?? [])}`,
    "Return an aiSummary string, numeric scores from 0 to 100 for quickness, introduction, knowledge, hospitality, callToAction, overallRating, and transcriptEntries.",
    "Each transcript entry must include channel ('seller' or 'client'), text, startTimestampMs, optional endTimestampMs, rating from 0 to 100, and isObjection boolean.",
  ].join("\n\n");
}

export const processCallAnalysis = internalAction({
  args: {
    callId: v.id("calls"),
    pendingAnalysisId: v.id("pending_analysis"),
    ownerUserId: v.string(),
  },
  handler: async (ctx, args) => {
    try {
      await ctx.runMutation(internal.calls.updatePendingAnalysis, {
        pendingAnalysisId: args.pendingAnalysisId,
        status: "processing",
        progress: 10,
        currentStep: "Loading call audio",
      });

      const call = await ctx.runQuery(internal.calls.getCallForProcessing, {
        callId: args.callId,
        ownerUserId: args.ownerUserId,
      });

      if (!call.sellerAudioUrl || !call.clientAudioUrl) {
        throw new Error("Audio files are no longer available");
      }

      await ctx.runMutation(internal.calls.updatePendingAnalysis, {
        pendingAnalysisId: args.pendingAnalysisId,
        progress: 25,
        currentStep: "Transcribing seller audio",
      });

      const sellerTranscript = await transcribeAudio(
        call.sellerAudioUrl,
        "seller.mp3",
      );

      await ctx.runMutation(internal.calls.updatePendingAnalysis, {
        pendingAnalysisId: args.pendingAnalysisId,
        progress: 50,
        currentStep: "Transcribing client audio",
      });

      const clientTranscript = await transcribeAudio(
        call.clientAudioUrl,
        "client.mp3",
      );

      await ctx.runMutation(internal.calls.updatePendingAnalysis, {
        pendingAnalysisId: args.pendingAnalysisId,
        progress: 75,
        currentStep: "Generating AI analysis",
      });

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
