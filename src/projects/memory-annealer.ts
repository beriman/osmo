import fs from "node:fs";
import path from "node:path";
import { logInfo } from "../logger.js";

/**
 * Osmo Memory Annealer
 * Consolidates daily logs into MEMORY.md and identifies strategic synergies.
 */
export class MemoryAnnealer {
  private workspaceRoot: string;
  private memoryDir: string;
  private longTermMemoryPath: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
    this.memoryDir = path.join(workspaceRoot, "memory");
    this.longTermMemoryPath = path.join(workspaceRoot, "MEMORY.md");
  }

  async anneal() {
    logInfo("Starting Memory Self-Annealing process...");
    
    // 1. Collect recent raw logs
    const logs = this.collectRecentLogs();
    if (logs.length === 0) {
      logInfo("No new logs found to anneal.");
      return;
    }

    // 2. Read current MEMORY.md
    const currentMemory = this.readLongTermMemory();

    // 3. Prepare for "Deep Distillation"
    // In a real run, Osmo would use an LLM call to process this.
    // For the framework, we'll set up the prompt structure for the sub-agent.
    
    const annealingTask = `
Analyze the following raw logs and current long-term memory. 
Goal: "Self-Annealing" (Entropy Reduction).
1. Distill new key events, decisions, and business context from logs.
2. Remove redundant or outdated info from long-term memory.
3. IDENTIFY STRATEGIC SYNERGIES: Connect dots between BIM/Digital Construction and Artisan Perfumery (e.g., systemization, niche marketing, data-driven decisions).
4. Update MEMORY.md with a clean, high-density structure.

RAW LOGS:
${logs.join("\n---\n")}

CURRENT MEMORY:
${currentMemory}
    `;

    logInfo("Memory Annealing task prepared for LLM processing.");
    return annealingTask;
  }

  private collectRecentLogs(): string[] {
    if (!fs.existsSync(this.memoryDir)) return [];
    
    const files = fs.readdirSync(this.memoryDir)
      .filter(f => f.endsWith(".md"))
      .sort()
      .slice(-3); // Get last 3 days
      
    return files.map(f => fs.readFileSync(path.join(this.memoryDir, f), "utf-8"));
  }

  private readLongTermMemory(): string {
    if (!fs.existsSync(this.longTermMemoryPath)) return "";
    return fs.readFileSync(this.longTermMemoryPath, "utf-8");
  }
}
