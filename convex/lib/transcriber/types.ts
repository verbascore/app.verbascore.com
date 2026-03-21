import { v } from "convex/values";

export interface SonioxContext {
  general?: Array<{
    key: string;
    value: string;
  }>;
  text?: string;
  terms?: string[];
  translation_terms?: Array<{
    source: string;
    target: string;
  }>;
}

export interface SonioxTranscriptionOptions {
  model: string;
  language_hints?: string[];
  enable_language_identification: boolean;
  enable_speaker_diarization: boolean;
  context?: SonioxContext;
  client_reference_id: string;
  audio_url: string;
  file_id: string | null;
  webhook_url: string;
  webhook_auth_header_name: string;
  webhook_auth_header_value: string;
}

export interface SonioxRawToken {
  text: string;
  start_ms: number;
  end_ms: number;
  confidence: number;
  speaker?: string;
  language?: string;
}

export interface SonioxRawTranscript {
  id: string;
  text: string;
  tokens: SonioxRawToken[];
}

export interface TranscriptionStatement {
  text: string;
  start_ms: number;
  end_ms: number;
  confidence: number;
  speaker: string;
  language: string;
}
export const TranscriptionStatementSchema = {
  text: v.string(),
  start_ms: v.number(),
  end_ms: v.number(),
  confidence: v.number(),
  speaker: v.string(),
  language: v.string(),
};
