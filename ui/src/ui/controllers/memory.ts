import { callGateway } from "../gateway.js";
import { AppViewState } from "../app-view-state.ts";

export async function annealMemory(state: AppViewState) {
  try {
    const result = await callGateway<{ status: string, task?: string, note?: string }>({
      method: "memory.anneal",
      params: {},
    });

    if (result.status === "started" && result.task) {
      // Automatically send the task to the chat to be processed by Osmo
      // @ts-ignore
      state.chatMessage = "Execute the prepared Memory Annealing task. Here is the context:\n\n" + result.task;
      // @ts-ignore
      if (state.handleChatSend) {
         // @ts-ignore
         await state.handleChatSend();
      }
      alert("Memory Annealing process started in Chat. Osmo is now distilling your records.");
    } else {
      alert("Memory is already annealed or no new logs found.");
    }
  } catch (err) {
    console.error("Failed to start memory annealing:", err);
    alert("Error starting memory annealing. Check logs.");
  }
}
