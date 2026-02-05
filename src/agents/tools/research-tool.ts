import { Type } from "@sinclair/typebox";
import fs from "node:fs/promises";
import path from "node:path";
import type { AnyAgentTool } from "./common.js";
import { createSubsystemLogger } from "../../logging/subsystem.js";

const log = createSubsystemLogger("tool/researcher");

export function createResearcherTool(options?: {
  workspaceDir?: string;
}): AnyAgentTool {
  return {
    label: "Researcher",
    name: "researcher",
    description: "Synthesize information from multiple files or sources. Like NotebookLM, it can summarize a collection of documents.",
    parameters: Type.Object({
      query: Type.String({ description: "What you want to find or summarize from the documents" }),
      paths: Type.Optional(Type.Array(Type.String(), { 
        description: "Specific files or directories to research. Defaults to workspace root." 
      })),
      depth: Type.Optional(Type.Number({ description: "Recursion depth for directories", default: 1 }))
    }),
    execute: async (_toolCallId, args) => {
      const { query, paths = ["."], depth = 1 } = args as any;
      const workspaceDir = options?.workspaceDir || process.cwd();
      
      const filesToProcess: string[] = [];
      
      const collectFiles = async (p: string, currentDepth: number) => {
        if (currentDepth > depth) return;
        const fullPath = path.resolve(workspaceDir, p);
        const stats = await fs.stat(fullPath).catch(() => null);
        if (!stats) return;

        if (stats.isFile()) {
          if (isSupportedFile(fullPath)) {
            filesToProcess.push(fullPath);
          }
        } else if (stats.isDirectory()) {
          const entries = await fs.readdir(fullPath);
          for (const entry of entries) {
            await collectFiles(path.join(p, entry), currentDepth + 1);
          }
        }
      };

      for (const p of paths) {
        await collectFiles(p, 0);
      }

      if (filesToProcess.length === 0) {
        return { content: [{ type: "text", text: "No supported documents found in the specified paths." }] };
      }

      log.info(`Researching ${filesToProcess.length} files for: ${query}`);

      const contents: string[] = [];
      for (const file of filesToProcess.slice(0, 20)) { // Limit to 20 files for now
        const text = await fs.readFile(file, "utf8").catch(() => "");
        if (text) {
          contents.push(`--- Source: ${path.relative(workspaceDir, file)} ---\n${text.slice(0, 5000)}`);
        }
      }

      const combinedContent = contents.join("\n\n");
      
      // We return the content so the agent can synthesize it. 
      // In a real NotebookLM, there might be a separate "synthesis" model call here.
      // But since the agent itself is the "brain", we just provide the data.
      
      return {
        content: [
          { type: "text", text: `Found ${filesToProcess.length} relevant documents. Here is the distilled content for your analysis:\n\n${combinedContent}` }
        ],
        details: { query, fileCount: filesToProcess.length, files: filesToProcess.map(f => path.relative(workspaceDir, f)) }
      };
    }
  };
}

function isSupportedFile(file: string): boolean {
  const ext = path.extname(file).toLowerCase();
  return [".md", ".txt", ".js", ".ts", ".py", ".pdf", ".html"].includes(ext);
}
