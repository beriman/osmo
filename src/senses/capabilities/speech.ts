import { textToSpeech } from "../../tts/tts.js";
import { OpenClawConfig } from "../../config/config.js";

/**
 * Speech Capability
 * Enables Osmo to generate vocal output.
 */
export class SpeechCapability {
  /**
   * Speak the given text using the configured TTS provider.
   */
  public async speak(text: string, cfg: OpenClawConfig, channel?: string): Promise<string | undefined> {
    const result = await textToSpeech({
      text,
      cfg,
      channel,
    });

    if (result.success && result.audioPath) {
      return result.audioPath;
    }
    throw new Error(`Osmo Speech Error: ${result.error}`);
  }
}
