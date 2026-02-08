import { Type } from "@sinclair/typebox";
import type { OpenClawConfig } from "../../config/config.js";
import type { GatewayMessageChannel } from "../../utils/message-channel.js";
import type { AnyAgentTool } from "./common.js";
import { loadConfig } from "../../config/config.js";
import { textToSpeech } from "../../tts/tts.js";
import { readStringParam } from "./common.js";
import { enqueueSystemEvent } from "../../infra/system-events.js";

const SpeakToolSchema = Type.Object({
  text: Type.String({ description: "The message to speak out loud." }),
  voiceId: Type.Optional(Type.String({ description: "Optional ElevenLabs Voice ID override." })),
  empathy: Type.Optional(Type.Boolean({ description: "If true, adds more emotional weight to the tone (best effort)." }))
});

/**
 * Osmo Speak Tool
 * A high-level tool for Osmo to communicate via voice.
 */
export function createOsmoSpeakTool(opts?: {
  config?: OpenClawConfig;
  agentChannel?: GatewayMessageChannel;
  sessionKey?: string;
}): AnyAgentTool {
  return {
    label: "Speak",
    name: "osmo_speak",
    description: "Speak a message out loud to the user. Use this for important announcements, storytelling, or when a verbal response is more appropriate than text.",
    parameters: SpeakToolSchema,
    execute: async (_toolCallId, args) => {
      const params = args as any;
      const text = params.text;
      const cfg = opts?.config ?? loadConfig();
      
      // Inject some "soul" if empathy is requested
      let textToSynth = text;
      if (params.empathy) {
        textToSynth = `[expressive] ${text}`;
      }

      const result = await textToSpeech({
        text: textToSynth,
        cfg,
        channel: opts?.agentChannel,
      });

      if (result.success && result.audioPath) {
        const sessionKey = opts?.sessionKey;
        if (sessionKey) {
           // Post a system event so the UI/Channel knows there's a voice message
           enqueueSystemEvent(`Osmo is speaking: "${text}"`, { sessionKey });
        }

        return {
          content: [
            { type: "text", text: `[[audio_as_voice]]\nMEDIA:${result.audioPath}` }
          ],
          details: { audioPath: result.audioPath, provider: result.provider }
        };
      }

      return {
        content: [{ type: "text", text: `(Failed to speak: ${result.error})` }],
        details: { error: result.error }
      };
    }
  };
}
