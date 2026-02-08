/**
 * Osmo Guard: Advanced security layer for OpenClaw.
 * Implements strict mode, expanded blocklists, and output scrubbing.
 */

import { OpenClawConfig } from "../config/config.js";

/**
 * Expanded list of dangerous environment variables that could lead to
 * sensitive data leakage or process hijacking on the host.
 */
export const OSMO_DANGEROUS_ENV_VARS = new Set([
  // Existing ones
  "LD_PRELOAD", "LD_LIBRARY_PATH", "LD_AUDIT",
  "DYLD_INSERT_LIBRARIES", "DYLD_LIBRARY_PATH",
  "NODE_OPTIONS", "NODE_PATH",
  "PYTHONPATH", "PYTHONHOME",
  "RUBYLIB", "PERL5LIB",
  "BASH_ENV", "ENV",
  "GCONV_PATH", "IFS",
  "SSLKEYLOGFILE",
  
  // Cloud / API Credentials
  "AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_SESSION_TOKEN",
  "GOOGLE_APPLICATION_CREDENTIALS",
  "AZURE_STORAGE_KEY", "AZURE_STORAGE_ACCOUNT",
  "GITHUB_TOKEN", "GITHUB_PAT",
  
  // OpenClaw Secrets
  "OPENCLAW_GATEWAY_TOKEN", "OPENCLAW_GATEWAY_PASSWORD",
  "OPENCLAW_HOOKS_TOKEN",
  "DISCORD_BOT_TOKEN", "TELEGRAM_BOT_TOKEN", "SLACK_BOT_TOKEN", "SLACK_APP_TOKEN",
  
  // Database
  "DATABASE_URL", "POSTGRES_PASSWORD", "MYSQL_PWD",
]);

/**
 * Patterns to scrub from tool output to prevent leakage.
 */
const SENSITIVE_PATTERNS = [
  // Generic API Keys / Tokens
  /(?:key|token|password|secret|pwd|auth|credential|api[_-]?key)[=:][\s"']?([a-zA-Z0-9.\-_/+=]{16,})[\s"']?/gi,
  // Bearer tokens
  /Bearer\s+([a-zA-Z0-9.\-_/+=]{16,})/gi,
  // IPv4 Addresses (Internal/External)
  /\b((?:\d{1,3}\.){3}\d{1,3})\b/g,
  // Windows-style paths (potential info leak)
  /\b([a-zA-Z]:\\[\w\s\\._-]+)/g,
  // Unix-style absolute paths (potential info leak)
  /(\/(?:home|Users)\/[\w.-]+)/g,

  // --- Proprietary Data Redaction (Sensasi Wangi Indonesia) ---
  // Formula Ratios / Concentration / Generic Measurements
  /(?:formula|ingredient|component|accords?|ratio|percentage|concentration|top|heart|base|notes?|fragrance|[\w\s]+)\s*[:=]\s*([\d.]+(?:\s*[%g]|ml|pts)?)/gi,
  // CAS Numbers (Chemical identities)
  /\b(\d{2,7}-\d{2}-\d)\b/g,
  // Trial / Batch Identifiers
  /(?:trial|batch|recipe|formula)\s*#\s*([a-zA-Z0-9_-]+)/gi,
];

/**
 * Scrubs sensitive information from a string.
 */
export function scrubOutput(text: string): string {
  let scrubbed = text;
  
  // 1. Pattern-based scrubbing
  for (const pattern of SENSITIVE_PATTERNS) {
    scrubbed = scrubbed.replace(pattern, (match, ...args) => {
      // The last two arguments are always offset and the original string.
      // Any arguments before that are capture groups.
      if (args.length > 2) {
        const captured = args[0];
        if (typeof captured === "string") {
          return match.replace(captured, "[REDACTED]");
        }
      }
      return "[REDACTED]";
    });
  }
  
  return scrubbed;
}

/**
 * Validates if a session should be forced into a sandbox.
 */
export function shouldForceSandbox(config: OpenClawConfig): boolean {
  return config.security?.strictMode === true;
}

/**
 * Validates host environment variables against Osmo's expanded list.
 */
export function validateOsmoHostEnv(env: Record<string, string>): void {
  for (const key of Object.keys(env)) {
    const upperKey = key.toUpperCase();
    if (OSMO_DANGEROUS_ENV_VARS.has(upperKey)) {
      throw new Error(`Osmo Security Violation: Environment variable '${key}' is strictly forbidden on the host.`);
    }
    
    // Prefix checks
    if (upperKey.startsWith("DYLD_") || upperKey.startsWith("LD_") || upperKey.startsWith("AWS_")) {
      throw new Error(`Osmo Security Violation: Forbidden environment variable prefix '${key}'.`);
    }
  }
}
