import { html, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import { icons } from "../icons.ts";

export type Project = {
  id: string;
  name: string;
  description: string;
  createdAt: number;
};

export type ProjectsProps = {
  projects: Project[];
  loading: boolean;
  onRefresh: () => void;
  onAdd: (name: string, description: string, mcpCommand?: string) => void;
  onRemove: (id: string) => void;
};

export function renderProjects(props: ProjectsProps) {
  return html`
    <div class="projects-view">
      <section class="card">
        <div class="card-header">
          <div class="card-title">Register New Project</div>
        </div>
        <div class="card-body">
          <form class="project-form" @submit=${(e: Event) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            const name = (form.elements.namedItem("name") as HTMLInputElement).value;
            const desc = (form.elements.namedItem("description") as HTMLInputElement).value;
            const mcp = (form.elements.namedItem("mcp_command") as HTMLInputElement).value;
            if (name && desc) {
              // @ts-ignore
              props.onAdd(name, desc, mcp);
              form.reset();
            }
          }}>
              <div class="field-row">
                <label class="field">
                  <span>Project Name</span>
                  <input type="text" name="name" placeholder="e.g. Floraverse Origins" required />
                </label>
                <label class="field">
                  <span>Description</span>
                  <input type="text" name="description" placeholder="e.g. Development of Six Flower Queens manga" required />
                </label>
              </div>
              <div class="field-row">
                <label class="field">
                  <span>MCP Server (Optional)</span>
                  <input type="text" name="mcp_command" placeholder="e.g. npx @modelcontextprotocol/server-sqlite --db projects.db" />
                </label>
              </div>
              <div class="form-actions">
              <button type="submit" class="btn primary">
                ${icons.plus} Register & Create Sub-Agent
              </button>
            </div>
          </form>
        </div>
      </section>

      <section class="card">
        <div class="card-header">
          <div class="card-title">Active Projects</div>
          <div class="card-actions">
            <button class="btn btn--sm" @click=${props.onRefresh} ?disabled=${props.loading}>
              ${props.loading ? html`<span class="spinner"></span>` : icons.activity} Refresh
            </button>
          </div>
        </div>
        <div class="card-body">
          ${props.projects.length === 0 
            ? html`<div class="empty-state">No projects registered yet.</div>`
            : html`
              <table class="table">
                <thead>
                  <tr>
                    <th>Project</th>
                    <th>Description</th>
                    <th>Created</th>
                    <th class="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  ${repeat(props.projects, (p) => p.id, (p) => html`
                    <tr>
                      <td><strong>${p.name}</strong></td>
                      <td>${p.description}</td>
                      <td class="muted">${new Date(p.createdAt).toLocaleDateString()}</td>
                      <td class="text-right">
                        <button class="btn btn--sm danger" @click=${() => {
                          if (confirm(`Remove project "${p.name}"? This will also wipe it from memory.`)) {
                            props.onRemove(p.id);
                          }
                        }}>
                          ${icons.trash} Remove
                        </button>
                      </td>
                    </tr>
                  `)}
                </tbody>
              </table>
            `
          }
        </div>
      </section>
    </div>

    <style>
      .projects-view {
        display: flex;
        flex-direction: column;
        gap: 2rem;
      }
      .project-form {
        display: flex;
        flex-direction: column;
        gap: 1rem;
      }
      .field-row {
        display: grid;
        grid-template-columns: 1fr 2fr;
        gap: 1rem;
      }
      .empty-state {
        padding: 3rem;
        text-align: center;
        color: var(--text-muted);
        font-style: italic;
      }
      @media (max-width: 600px) {
        .field-row {
          grid-template-columns: 1fr;
        }
      }
    </style>
  `;
}
