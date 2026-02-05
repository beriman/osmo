import { Type } from "@sinclair/typebox";
import fs from "node:fs/promises";
import path from "node:path";
import type { AnyAgentTool } from "./common.js";
import { createSubsystemLogger } from "../../logging/subsystem.js";

const log = createSubsystemLogger("tool/project-mapper");

export function createProjectMapperTool(options?: {
  workspaceDir?: string;
}): AnyAgentTool {
  return {
    label: "Project Mapper",
    name: "project_mapper",
    description: "Map out the project structure and create a PROJECT_MAP.md file. Helps in understanding large codebases.",
    parameters: Type.Object({
      root: Type.Optional(Type.String({ description: "Root directory to map", default: "." })),
      exclude: Type.Optional(Type.Array(Type.String(), { 
        description: "Directories to exclude", 
        default: ["node_modules", ".git", "dist", "vendor"] 
      }))
    }),
    execute: async (_toolCallId, args) => {
      const { root = ".", exclude = ["node_modules", ".git", "dist", "vendor"] } = args as any;
      const workspaceDir = options?.workspaceDir || process.cwd();
      const targetDir = path.resolve(workspaceDir, root);

      log.info(`Mapping project at: ${targetDir}`);

      const tree: string[] = ["# Project Map", ""];
      
      const buildTree = async (p: string, prefix: string = "") => {
        const stats = await fs.stat(p).catch(() => null);
        if (!stats || !stats.isDirectory()) return;

        const entries = await fs.readdir(p, { withFileTypes: true });
        const filtered = entries.filter(e => !exclude.includes(e.name));

        for (const entry of filtered) {
          const isLast = filtered.indexOf(entry) === filtered.length - 1;
          const marker = isLast ? "└── " : "├── ";
          const childPrefix = isLast ? "    " : "│   ";
          
          tree.push(`${prefix}${marker}${entry.name}${entry.isDirectory() ? "/" : ""}`);
          
          if (entry.isDirectory()) {
            await buildTree(path.join(p, entry.name), `${prefix}${childPrefix}`);
          }
        }
      };

      await buildTree(targetDir);
      
      const mapContent = tree.join("\n");
      const mapPath = path.join(targetDir, "PROJECT_MAP.md");
      await fs.writeFile(mapPath, mapContent);

      return {
        content: [{ type: "text", text: `Project mapped successfully. Created ${path.relative(workspaceDir, mapPath)}` }],
        details: { path: mapPath, entryCount: tree.length }
      };
    }
  };
}
