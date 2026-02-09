import { Type } from "@sinclair/typebox";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { AnyAgentTool } from "./common.js";
import { resolveApiKeyForProvider } from "../model-auth.js";
import { createSubsystemLogger } from "../../logging/subsystem.js";

const log = createSubsystemLogger("tool/gemini-generate-image");

export function createGeminiGenerateImageTool(options?: {
  agentDir?: string;
  sandboxRoot?: string;
}): AnyAgentTool {
  return {
    label: "Imagine",
    name: "imagine",
    description: "Generate an image from a text description. Use this to create visual assets, illustrations, or concepts. Be descriptive.",
    parameters: Type.Object({
      prompt: Type.String({ description: "Detailed description of the image to generate" }),
      aspectRatio: Type.Optional(Type.String({
        description: "Aspect ratio (e.g., '1:1', '4:3', '16:9')",
        default: "1:1"
      })),
      negativePrompt: Type.Optional(Type.String({
        description: "What to exclude from the image"
      })),
      count: Type.Optional(Type.Number({
        description: "Number of images to generate (1-4)",
        default: 1
      }))
    }),
    execute: async (_toolCallId, args) => {
      const { prompt, aspectRatio = "1:1", negativePrompt, count = 1 } = args as any;
      const agentDir = options?.agentDir;

      // Resolve API key for Google Antigravity or Generative AI
      const auth = await resolveApiKeyForProvider({
        provider: "google-antigravity", // Prefer the user's specified provider
        agentDir,
      }).catch(() => resolveApiKeyForProvider({
        provider: "google",
        agentDir,
      }));

      if (!auth.apiKey) {
        throw new Error("Google API key not found. Please configure google-antigravity or GEMINI_API_KEY.");
      }

      const isAntigravity = auth.source.includes("google-antigravity") || auth.profileId?.startsWith("google-antigravity");
      
      let token = auth.apiKey;
      let projectId = "rising-fact-p41fc"; // Default fallback
      
      if (isAntigravity) {
        try {
          const parsed = JSON.parse(auth.apiKey);
          token = parsed.token;
          projectId = parsed.projectId || projectId;
        } catch {
          // Not JSON, use as is
        }
      }
      
      const region = "us-central1"; // Default for Vertex AI
      const modelId = "imagen-3.0-generate-001";
      
      log.info(`Generating image with prompt: ${prompt} (isAntigravity: ${isAntigravity}, mode: ${auth.mode})`);

      const useOAuth = auth.mode === "oauth" || auth.mode === "token";
      
      // Select endpoint based on provider
      let url = "";
      if (isAntigravity && useOAuth) {
        // Vertex AI endpoint for Google Cloud / Antigravity
        url = `https://${region}-aiplatform.googleapis.com/v1/projects/${projectId}/locations/${region}/publishers/google/models/${modelId}:predict`;
      } else {
        // AI Studio endpoint
        url = useOAuth
          ? `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predict`
          : `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:predict?key=${token}`;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (useOAuth) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Payload structure differs slightly between AI Studio and Vertex AI
      const payload = isAntigravity 
        ? {
            instances: [{ prompt }],
            parameters: {
              sampleCount: Math.min(Math.max(count, 1), 4),
              aspectRatio: aspectRatio.replace(":", "_"), // Vertex uses 1_1 format
              negativePrompt
            }
          }
        : {
            instances: [{ prompt }],
            parameters: {
              sampleCount: Math.min(Math.max(count, 1), 4),
              aspectRatio,
              negativePrompt
            }
          };

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Gemini image generation failed: ${error}`);
      }

      const result = await response.json() as any;
      const images = result.predictions || [];

      if (images.length === 0) {
        throw new Error("No images generated.");
      }

      const outputFiles: string[] = [];
      const sandboxRoot = options?.sandboxRoot || process.cwd();
      const mediaDir = path.join(sandboxRoot, "media", "generated");
      await fs.mkdir(mediaDir, { recursive: true });

      for (const img of images) {
        const base64 = img.bytesBase64Encoded;
        if (!base64) continue;

        const filename = `${randomUUID()}.png`;
        const filePath = path.join(mediaDir, filename);
        await fs.writeFile(filePath, Buffer.from(base64, "base64"));
        outputFiles.push(path.join("media", "generated", filename));
      }

      return {
        content: [
          { type: "text", text: `Generated ${outputFiles.length} image(s).` },
          ...outputFiles.map(file => ({ type: "image", url: file }))
        ],
        details: { prompt, model: modelId, files: outputFiles }
      };
    }
  };
}
