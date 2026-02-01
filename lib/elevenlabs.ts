import { getElevenLabsApiKey } from './config';

// ============================================================================
// Types
// ============================================================================

export interface ElevenLabsClient {
  apiKey: string;
  baseUrl: string;
}

export interface SpeechOptions {
  voiceId?: string;
  language?: 'en' | 'es' | 'zh' | 'fr' | 'de';
  stability?: number;
  similarityBoost?: number;
}

export interface AudioResult {
  audioUrl: string;
  duration: number;
  format: 'mp3';
}

// ============================================================================
// Voice Configuration
// ============================================================================

// Map language codes to appropriate ElevenLabs voice IDs
const VOICE_MAP: Record<string, string> = {
  en: '21m00Tcm4TlvDq8ikWAM', // Rachel - warm, clear English
  es: 'AZnzlk1XvdvUeBnXmlld', // Spanish voice
  zh: 'g5CIjZEefAph4nQFvHAz', // Chinese voice
  fr: 'XrExE9yKIg1WjnnlVkGX', // French voice
  de: 'Yko7PKHZNXotIFUBG7I9', // German voice
};

const DEFAULT_VOICE_ID = VOICE_MAP['en'];
const MODEL_ID = 'eleven_flash_v2_5'; // Low latency model
const MAX_TEXT_LENGTH = 5000;

// ============================================================================
// Client Creation
// ============================================================================

/**
 * Create an ElevenLabs client for text-to-speech
 */
export function createElevenLabsClient(apiKey?: string): ElevenLabsClient {
  const key = apiKey || getElevenLabsApiKey();

  return {
    apiKey: key,
    baseUrl: 'https://api.elevenlabs.io/v1',
  };
}

// ============================================================================
// Duration Estimation
// ============================================================================

/**
 * Estimate audio duration from text length
 * Average speaking rate: ~150 words per minute
 */
function estimateDuration(text: string): number {
  const wordCount = text.split(/\s+/).length;
  const minutesDuration = wordCount / 150;
  return Math.round(minutesDuration * 60); // Convert to seconds
}

// ============================================================================
// Text Processing
// ============================================================================

/**
 * Split long text into chunks for processing
 */
function splitTextIntoChunks(text: string, maxLength: number = MAX_TEXT_LENGTH): string[] {
  if (text.length <= maxLength) {
    return [text];
  }

  const chunks: string[] = [];
  const sentences = text.split(/(?<=[.!?])\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > maxLength) {
      if (currentChunk) {
        chunks.push(currentChunk.trim());
      }
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

// ============================================================================
// Speech Synthesis
// ============================================================================

/**
 * Synthesize speech from text using ElevenLabs API
 */
export async function synthesizeSpeech(
  client: ElevenLabsClient,
  text: string,
  options: SpeechOptions = {}
): Promise<AudioResult> {
  const {
    voiceId,
    language = 'en',
    stability = 0.5,
    similarityBoost = 0.75,
  } = options;

  // Select voice based on language if not explicitly provided
  const selectedVoiceId = voiceId || VOICE_MAP[language] || DEFAULT_VOICE_ID;

  // Handle long text
  const chunks = splitTextIntoChunks(text);

  if (chunks.length === 1) {
    return synthesizeChunk(client, chunks[0], selectedVoiceId, stability, similarityBoost);
  }

  // For multiple chunks, synthesize and combine
  const audioBlobs: Blob[] = [];
  let totalDuration = 0;

  for (const chunk of chunks) {
    const result = await synthesizeChunk(
      client,
      chunk,
      selectedVoiceId,
      stability,
      similarityBoost
    );

    const response = await fetch(result.audioUrl);
    const blob = await response.blob();
    audioBlobs.push(blob);
    totalDuration += result.duration;
  }

  // Combine audio blobs
  const combinedBlob = new Blob(audioBlobs, { type: 'audio/mpeg' });
  const audioUrl = URL.createObjectURL(combinedBlob);

  return {
    audioUrl,
    duration: totalDuration,
    format: 'mp3',
  };
}

/**
 * Synthesize a single chunk of text
 */
async function synthesizeChunk(
  client: ElevenLabsClient,
  text: string,
  voiceId: string,
  stability: number,
  similarityBoost: number
): Promise<AudioResult> {
  const url = `${client.baseUrl}/text-to-speech/${voiceId}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': client.apiKey,
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
        },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));

      if (response.status === 401) {
        throw new Error('Invalid ElevenLabs API key');
      }
      if (response.status === 429) {
        throw new Error('ElevenLabs rate limit exceeded. Character quota may be depleted.');
      }
      if (response.status === 400) {
        throw new Error('Text is too long or contains invalid characters');
      }

      throw new Error(
        `ElevenLabs API error: ${response.statusText} - ${JSON.stringify(errorData)}`
      );
    }

    // Get audio blob and create URL
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);

    return {
      audioUrl,
      duration: estimateDuration(text),
      format: 'mp3',
    };
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to synthesize speech');
  }
}

// ============================================================================
// Voice Management
// ============================================================================

/**
 * Get available voices for a language
 */
export function getVoiceForLanguage(language: string): string {
  return VOICE_MAP[language] || DEFAULT_VOICE_ID;
}

/**
 * List supported languages
 */
export function getSupportedLanguages(): string[] {
  return Object.keys(VOICE_MAP);
}

// ============================================================================
// Audio URL Management
// ============================================================================

/**
 * Revoke a blob URL to free memory
 */
export function revokeAudioUrl(url: string): void {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

// ============================================================================
// Stream Support (for future use)
// ============================================================================

/**
 * Synthesize speech with streaming (returns ReadableStream)
 */
export async function synthesizeSpeechStream(
  client: ElevenLabsClient,
  text: string,
  options: SpeechOptions = {}
): Promise<ReadableStream<Uint8Array> | null> {
  const { voiceId, language = 'en', stability = 0.5, similarityBoost = 0.75 } = options;

  const selectedVoiceId = voiceId || VOICE_MAP[language] || DEFAULT_VOICE_ID;
  const url = `${client.baseUrl}/text-to-speech/${selectedVoiceId}/stream`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'xi-api-key': client.apiKey,
    },
    body: JSON.stringify({
      text,
      model_id: MODEL_ID,
      voice_settings: {
        stability,
        similarity_boost: similarityBoost,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Stream synthesis failed: ${response.statusText}`);
  }

  return response.body;
}
