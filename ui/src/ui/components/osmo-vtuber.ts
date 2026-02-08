import { html, LitElement, css } from "lit";
import { customElement, property, state } from "lit/decorators.js";

/**
 * Osmo VTuber Component
 * Renders the "body" of Osmo with simple animations and talking states.
 */
@customElement("osmo-vtuber")
export class OsmoVTuber extends LitElement {
  @property({ type: String }) avatarUrl = "assets/avatar-placeholder.svg";
  @property({ type: Boolean }) isTalking = false;
  @property({ type: String }) emotion = "happy";

  static styles = css`
    :host {
      display: block;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: radial-gradient(circle at center, var(--bg-subtle) 0%, transparent 70%);
      overflow: hidden;
      position: relative;
    }

    .container {
      position: relative;
      width: 200px;
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .avatar {
      width: 100%;
      height: 100%;
      object-fit: contain;
      transition: transform 0.3s ease-out;
      filter: drop-shadow(0 0 15px var(--accent));
      animation: float 3s ease-in-out infinite;
    }

    .avatar.talking {
      animation: bounce 0.4s ease-in-out infinite;
    }

    .glow {
      position: absolute;
      width: 150%;
      height: 150%;
      background: radial-gradient(circle, var(--accent) 0%, transparent 60%);
      opacity: 0.15;
      z-index: -1;
      animation: pulse 2s infinite alternate;
    }

    .particles {
      position: absolute;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }

    @keyframes float {
      0% { transform: translateY(0px); }
      50% { transform: translateY(-15px); }
      100% { transform: translateY(0px); }
    }

    @keyframes bounce {
      0% { transform: scale(1) translateY(-15px); }
      50% { transform: scale(1.05) translateY(-20px); }
      100% { transform: scale(1) translateY(-15px); }
    }

    @keyframes pulse {
      from { opacity: 0.1; transform: scale(0.8); }
      to { opacity: 0.3; transform: scale(1.2); }
    }

    .status-badge {
      margin-top: 1rem;
      padding: 4px 12px;
      border-radius: 12px;
      background: var(--bg-card);
      border: 1px solid var(--border);
      font-size: 0.7rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }
  `;

  render() {
    return html`
      <div class="container">
        <div class="glow"></div>
        <img 
          src="${this.avatarUrl}" 
          class="avatar ${this.isTalking ? 'talking' : ''}" 
          alt="Osmo VTuber"
        />
        <div class="particles"></div>
      </div>
      <div class="status-badge">
        ${this.isTalking ? 'Syncing Olfactory Data...' : 'Osmo Idle'}
      </div>
    `;
  }
}
