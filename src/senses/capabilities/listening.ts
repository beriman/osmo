import { transcribeGeminiAudio } from "../../media-understanding/providers/google/audio.js";

/**
 * Listening Capability
 * Enables Osmo to transcribe and understand audio input.
 */
export class ListeningCapability {
  /**
   * Listen to an audio buffer and return the transcription.
   */
  public async listen(buffer: Buffer, apiKey: string, mime?: string): Promise<string> {
    const result = await transcribeGeminiAudio({
      buffer,
      apiKey,
      mime,
      prompt: "Transcribe the audio precisely for Osmo.",
      timeoutMs: 30000,
    });

    return result.text;
  }
}
