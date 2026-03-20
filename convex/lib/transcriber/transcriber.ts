import {
  WEBHOOK_AUTH_HEADER_NAME,
  WEBHOOK_AUTH_HEADER_VALUE,
  WEBHOOK_URL,
  SONIOX_API_BASE_URL,
  SONIOX_API_KEY,
} from "./constants";
import {
  SonioxTranscriptionOptions,
  SonioxRawToken,
  TranscriptionStatement,
  SonioxRawTranscript,
} from "./types";

export function getTranscriptionOptions(
  audioUrl: string,
  clientReferenceId: string,
): SonioxTranscriptionOptions {
  return {
    model: "stt-async-v4",
    language_hints: ["ro", "en"],
    enable_language_identification: true,
    enable_speaker_diarization: true,
    // context: {
    //   general: [
    //     {
    //       key: "",
    //       value: "",
    //     },
    //   ],
    //   text: "",
    //   terms: [],
    //   translation_terms: [{ source: "", target: "" }],
    // },
    client_reference_id: clientReferenceId,
    audio_url: audioUrl,
    file_id: null,

    webhook_url: `${WEBHOOK_URL}?client_reference_id=${clientReferenceId}`,
    webhook_auth_header_name: WEBHOOK_AUTH_HEADER_NAME,
    webhook_auth_header_value: WEBHOOK_AUTH_HEADER_VALUE,
  };
}

export async function createTranscription(
  options: SonioxTranscriptionOptions,
): Promise<string | null> {
  const response: Response = await fetch(
    `${SONIOX_API_BASE_URL}/v1/transcriptions`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SONIOX_API_KEY}`,
      },
      body: JSON.stringify(options),
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to create transcription for: ${options.client_reference_id} | Status code: ${response.status} | Body: ${await response.text()}`,
    );
  }

  const responseData = await response.json();
  return responseData.id;
}

export async function getTranscription(
  transcriptionId: string,
): Promise<SonioxRawTranscript> {
  const response: Response = await fetch(
    `${SONIOX_API_BASE_URL}/v1/transcriptions/${transcriptionId}/transcript`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${SONIOX_API_KEY}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to get transcription ${transcriptionId} | Status code: ${response.status} | Body: ${await response.text()}`,
    );
  }

  return response.json();
}

export async function deleteTranscription(transcriptionId: string) {
  const response = await fetch(
    `${SONIOX_API_BASE_URL}/v1/transcriptions/${transcriptionId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${SONIOX_API_KEY}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(
      `Failed to delete transcription ${transcriptionId} | Status code: ${response.status} | Body: ${await response.text()}`,
    );
  }
}

export function rawTokensToStatements(
  tokens: SonioxRawToken[],
): TranscriptionStatement[] {
  const statements: TranscriptionStatement[] = [];
  if (!tokens || tokens.length === 0) return statements;

  let currentText = "";
  let startMs = 0;
  let endMs = 0;
  let confSum = 0;
  let tokenCount = 0;
  let currentSpeaker = "";
  let currentLanguage = "";

  const sentenceDelimiterRegex = /[.!?]/;

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const text = token.text;

    if (!text) continue;

    // Initialize state if we are starting a new statement
    if (tokenCount === 0) {
      startMs = token.start_ms;
      currentSpeaker = token.speaker!;
      currentLanguage = token.language!;
    }

    currentText += text;
    endMs = token.end_ms;
    confSum += token.confidence;
    tokenCount++;

    // Did the sentence end?
    if (sentenceDelimiterRegex.test(text)) {
      statements.push({
        text: currentText.trim(),
        start_ms: startMs,
        end_ms: endMs,
        confidence: Number((confSum / tokenCount).toFixed(2)),
        speaker: currentSpeaker,
        language: currentLanguage,
      });

      // Reset state for the next statement
      currentText = "";
      confSum = 0;
      tokenCount = 0;
    }
  }

  // Final flush for any remaining text that didn't end in punctuation
  if (tokenCount > 0 && currentText.trim() !== "") {
    statements.push({
      text: currentText.trim(),
      start_ms: startMs,
      end_ms: endMs,
      confidence: Number((confSum / tokenCount).toFixed(2)),
      speaker: currentSpeaker,
      language: currentLanguage,
    });
  }

  return statements;
}
