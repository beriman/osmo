import { callGateway } from "../gateway.js";
import { AppViewState } from "../app-view-state.ts";

export async function loadProjects(state: AppViewState) {
  try {
    const result = await callGateway<{ projects: any[] }>({
      method: "projects.list",
      params: {},
    });
    // @ts-ignore
    state.projects = result.projects;
  } catch (err) {
    console.error("Failed to load projects:", err);
  }
}

export async function addProject(state: AppViewState, name: string, description: string, mcpCommand?: string) {
  try {
    await callGateway({
      method: "projects.add",
      params: { name, description },
    });

    if (mcpCommand) {
       // Register MCP server to config
       // This is a simplified version - in production we'd use config.patch
       await callGateway({
         method: "config.patch",
         params: {
           patch: {
             tools: {
               mcp: {
                 servers: [
                   {
                     name: name.toLowerCase().replace(/\s+/g, '_'),
                     command: mcpCommand.split(' ')[0],
                     args: mcpCommand.split(' ').slice(1)
                   }
                 ]
               }
             }
           }
         }
       });
    }

    await loadProjects(state);
    
    // Osmo: Automatically trigger a chat message to handle the subagent creation logic.
    // This is the "automatic" part - we let Osmo's brain handle the spawning.
    if ((state as any).handleChatSend) {
       (state as any).chatMessage = `/spawn task="Project ${name}: ${description}. Please manage this project as its dedicated sub-agent. Focus on its specific goals and update the project registry if needed." label="${name}"`;
       await (state as any).handleChatSend();
    }
  } catch (err) {
    console.error("Failed to add project:", err);
  }
}

export async function removeProject(state: AppViewState, id: string) {
  try {
    await callGateway({
      method: "projects.remove",
      params: { id },
    });
    await loadProjects(state);
  } catch (err) {
    console.error("Failed to remove project:", err);
  }
}
