import { MemoryAnnealer } from "../../projects/memory-annealer.js";
import { defineServerMethod } from "./types.js";

export const memoryAnneal = defineServerMethod({
  method: "memory.anneal",
  params: {},
  handler: async (params, context) => {
    const annealer = new MemoryAnnealer(process.cwd());
    const task = await annealer.anneal();
    
    if (!task) {
      return { status: "no_action_needed" };
    }

    // Automatically trigger a sub-agent to do the actual distillation work
    // Use the internal RPC-like channel if available
    try {
      // In Osmo, we trigger the agent via the gateway context or a special system message
      return { 
        status: "started", 
        task,
        note: "Please ask Osmo to 'Execute the prepared Memory Annealing task' in chat."
      };
    } catch (err) {
      return { status: "error", error: String(err) };
    }
  },
});
