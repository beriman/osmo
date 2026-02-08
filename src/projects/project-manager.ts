import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { resolveStateDir } from "../config/paths.js";
import { logInfo } from "../logger.js";

export type Project = {
  id: string;
  name: string;
  description: string;
  subagentId?: string;
  createdAt: number;
};

export class ProjectManager {
  private static instance: ProjectManager;
  private projectsPath: string;

  private constructor() {
    const stateDir = resolveStateDir(process.env);
    this.projectsPath = path.join(stateDir, "osmo-projects.json");
  }

  public static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  public listProjects(): Project[] {
    if (!fs.existsSync(this.projectsPath)) {
      return [];
    }
    try {
      const data = fs.readFileSync(this.projectsPath, "utf-8");
      return JSON.parse(data);
    } catch (err) {
      logInfo(`Failed to read projects: ${err}`);
      return [];
    }
  }

  public addProject(name: string, description: string): Project {
    const projects = this.listProjects();
    const newProject: Project = {
      id: crypto.randomUUID(),
      name,
      description,
      createdAt: Date.now(),
    };
    projects.push(newProject);
    this.saveProjects(projects);
    this.updateMemory(projects);
    return newProject;
  }

  public removeProject(id: string): boolean {
    const projects = this.listProjects();
    const filtered = projects.filter(p => p.id !== id);
    if (filtered.length === projects.length) {
      return false;
    }
    this.saveProjects(filtered);
    this.updateMemory(filtered);
    return true;
  }

  private saveProjects(projects: Project[]) {
    fs.writeFileSync(this.projectsPath, JSON.stringify(projects, null, 2));
  }

  private updateMemory(projects: Project[]) {
    // Osmo: Use the main workspace MEMORY.md
    const memoryPath = path.join(process.cwd(), "MEMORY.md");
    if (!fs.existsSync(memoryPath)) {
      logInfo(`MEMORY.md not found at ${memoryPath}, skipping memory sync.`);
      return;
    }

    let content = fs.readFileSync(memoryPath, "utf-8");
    const sectionHeader = "## 📂 Active Projects (Managed by Osmo)";
    const sectionStart = content.indexOf(sectionHeader);
    
    let projectListText = `${sectionHeader}\n`;
    if (projects.length === 0) {
      projectListText += "_No active projects._\n";
    } else {
      for (const p of projects) {
        projectListText += `- **${p.name}**: ${p.description} (ID: ${p.id})\n`;
      }
    }

    if (sectionStart !== -1) {
      // Replace existing section until next header or end
      const nextSection = content.indexOf("\n## ", sectionStart + 1);
      const end = nextSection !== -1 ? nextSection : content.length;
      content = content.slice(0, sectionStart) + projectListText + content.slice(end);
    } else {
      // Append to end
      content += `\n\n${projectListText}`;
    }

    fs.writeFileSync(memoryPath, content);
    logInfo("Updated MEMORY.md with project list.");
  }
}
