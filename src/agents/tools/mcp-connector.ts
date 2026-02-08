import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { AnyAgentTool } from "../pi-tools.types.js";
import { logInfo, logWarn } from "../../logger.js";

export type McpServerConfig = {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
};

export class McpConnector {
  private clients: Map<string, Client> = new Map();
  private toolRegistry: Map<string, AnyAgentTool[]> = new Map();

  getRegisteredTools(serverName: string): AnyAgentTool[] {
    return this.toolRegistry.get(serverName) ?? [];
  }

  async connectServer(config: McpServerConfig): Promise<AnyAgentTool[]> {
    try {
      const transport = new StdioClientTransport({
        command: config.command,
        args: config.args,
        env: { ...process.env, ...config.env },
      });

      const client = new Client(
        {
          name: "osmo-client",
          version: "1.0.0",
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      await client.connect(transport);
      this.clients.set(config.name, client);
      logInfo(`Connected to MCP server: ${config.name}`);

      const { tools } = await client.listTools();
      const translatedTools = tools.map((tool) => this.translateTool(config.name, client, tool));
      this.toolRegistry.set(config.name, translatedTools);
      return translatedTools;
    } catch (err) {
      logWarn(`Failed to connect to MCP server ${config.name}: ${err}`);
      return [];
    }
  }

  private translateTool(serverName: string, client: Client, mcpTool: any): AnyAgentTool {
    return {
      name: `${serverName}_${mcpTool.name}`,
      label: mcpTool.name,
      description: mcpTool.description || "",
      parameters: mcpTool.inputSchema,
      execute: async (_toolCallId, args) => {
        try {
          const result = await client.callTool({
            name: mcpTool.name,
            arguments: args as any,
          });
          return {
            content: (result.content as any[]).map((c) => ({
              type: "text",
              text: c.text || JSON.stringify(c),
            })),
          };
        } catch (err) {
          throw new Error(`MCP tool execution failed: ${err}`);
        }
      },
    };
  }

  async disconnectAll() {
    for (const [name, client] of this.clients) {
      try {
        await client.close();
      } catch (err) {
        // ignore
      }
    }
    this.clients.clear();
  }
}

export const mcpConnector = new McpConnector();
