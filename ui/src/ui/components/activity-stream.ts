import { html, LitElement, css } from "lit";
import { customElement, property } from "lit/decorators.js";
import { repeat } from "lit/directives/repeat.js";
import { icons } from "../icons.ts";

export type ActivityEntry = {
  id: string;
  type: "thought" | "tool_start" | "tool_result" | "info";
  text: string;
  timestamp: number;
};

@customElement("activity-stream")
export class ActivityStream extends LitElement {
  @property({ type: Array }) entries: ActivityEntry[] = [];

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--bg-card);
      border-left: 1px solid var(--border);
      font-size: 0.85rem;
      overflow: hidden;
    }
    .header {
      padding: 0.75rem;
      font-weight: 600;
      border-bottom: 1px solid var(--border);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--bg-subtle);
    }
    .list {
      flex: 1;
      overflow-y: auto;
      padding: 0.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .entry {
      padding: 0.5rem;
      border-radius: 4px;
      background: var(--bg-app);
      border: 1px solid var(--border);
      animation: slideIn 0.2s ease-out;
    }
    @keyframes slideIn {
      from { transform: translateX(10px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .entry.tool_start { border-left: 3px solid var(--color-primary); }
    .entry.tool_result { border-left: 3px solid var(--color-success); }
    .entry.thought { border-left: 3px solid var(--color-warning); font-style: italic; color: var(--text-muted); }
    
    .entry-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.25rem;
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .entry-content {
      word-break: break-word;
      white-space: pre-wrap;
    }
    .empty {
      padding: 2rem;
      text-align: center;
      color: var(--text-muted);
    }
  `;

  render() {
    return html`
      <div class="header">
        ${icons.activity} Activity Monitor
      </div>
      <div class="list">
        ${this.entries.length === 0 
          ? html`<div class="empty">No activity recorded yet.</div>`
          : repeat(this.entries.slice().reverse(), (e) => e.id, (e) => this.renderEntry(e))
        }
      </div>
    `;
  }

  renderEntry(e: ActivityEntry) {
    const time = new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    return html`
      <div class="entry ${e.type}">
        <div class="entry-header">
          <span>${e.type.replace('_', ' ').toUpperCase()}</span>
          <span>${time}</span>
        </div>
        <div class="entry-content">${e.text}</div>
      </div>
    `;
  }
}
