import { Type } from "@sinclair/typebox";
import fs from "node:fs/promises";
import path from "node:path";
import { MemoryAnnealer } from "../../projects/memory-annealer.js";
import type { AnyAgentTool } from "./common.js";
import { jsonResult } from "./common.js";
import { callGateway } from "../../gateway/call.js";
import { crypto } from "node:crypto";

/**
 * Memory Anneal Tool
 * Allows the agent to automatically trigger the distillation of daily logs 
 * into long-term strategic memory.
 */
export function createMemoryAnnealTool(): AnyAgentTool {
  return {
    label: "Memory",
    name: "memory_anneal",
    description: "Automatically distill recent raw logs and daily notes into the long-term MEMORY.md file. This reduces entropy and identifies strategic synergies between projects.",
    parameters: Type.Object({
      dryRun: Type.Optional(Type.Boolean({ description: "If true, only returns the distillation task without executing." }))
    }),
    execute: async (_toolCallId, args) => {
      const { dryRun = false } = args as any;
      const workspaceRoot = process.cwd();
      const annealer = new MemoryAnnealer(workspaceRoot);
      const taskText = await annealer.anneal();

      if (!taskText) {
        return jsonResult({ status: "skipped", reason: "No new logs found to process." });
      }

      if (dryRun) {
        return jsonResult({ status: "dry_run", task: taskText });
      }

      // Proactive part: Spawn a sub-agent to handle the complex distillation
      // This ensures the main session stays clean and the work happens in the background.
      try {
        const childSessionKey = `agent:main:subagent:anneal-${Date.now()}`;
        
        await callGateway({
          method: "agent",
          params: {
            message: taskText,
            sessionKey: childSessionKey,
            label: "Memory Annealing",
            deliver: false, // Background work
            thinking: "high" // Use high thinking for strategic distillation
          }
        });

        return jsonResult({ 
          status: "automatic_process_started", 
          detail: "A high-thinking sub-agent has been spawned to distill logs and update MEMORY.md." 
        });
      } catch (err) {
        return jsonResult({ status: "error", error: String(err) });
      }
    },
  };
}
