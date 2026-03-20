import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { httpAction } from "./_generated/server";
import { getRequiredEnv } from "./lib/transcriber/constants";
import {
  deleteTranscription,
  getTranscription,
  rawTokensToStatements,
} from "./lib/transcriber/transcriber";

export const sonioxWebhook = httpAction(async (ctx, request) => {
  const authHeader = request.headers.get("x-soniox-auth");
  const expectedSecret = getRequiredEnv("SONIOX_AUTH_HEADER_VALUE");

  if (authHeader !== expectedSecret) {
    console.error("Soniox Webhook did not provide a valid secret value.");
    return new Response("", { status: 200 });
  }

  let transcriptionId = "";
  try {
    const body = await request.json();
    const status = body.status;
    transcriptionId = body.id;

    if (status !== "completed") {
      console.error(
        `Soniox Webhook didn't complete the transcription process for transcription ${transcriptionId}`,
      );
      return new Response("", { status: 200 });
    }

    const url = new URL(request.url);
    const clientReferenceId: string = url.searchParams.get(
      "client_reference_id",
    )!;

    const [ownerUserId, teamId, callId, channel] = clientReferenceId.split(":");
    if (channel !== "seller" && channel !== "client") {
      console.error(
        `Invalid client reference id received: ${clientReferenceId}`,
      );
      return new Response("", { status: 200 });
    }

    const rawTranscript = await getTranscription(transcriptionId);
    const sentenceTokens = rawTokensToStatements(rawTranscript.tokens);

    await ctx.runMutation(internal.calls.saveSonioxTranscript, {
      ownerUserId: ownerUserId,
      teamId: teamId as Id<"teams">,
      callId: callId as Id<"calls">,
      channel: channel,
      sentenceTokens: sentenceTokens,
    });

    // Cleanup
    await deleteTranscription(transcriptionId);
    return new Response("", { status: 200 });
  } catch (error) {
    console.error("Webhook Fatal Error", error);
    if (transcriptionId.length !== 0) {
      try {
        await deleteTranscription(transcriptionId);
      } catch (cleanupError) {
        // TODO, maybe store them in DB and retry at a fixed time
        console.error(
          `Webhook Fatal Error -> Cleanup failed, delete manually: ${transcriptionId}`,
          cleanupError,
        );
      }
    }
    return new Response("", { status: 200 });
  }
});
