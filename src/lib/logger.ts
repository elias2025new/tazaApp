/**
 * lib/logger.ts — Structured server-side logging.
 * No console.log in committed code — use this instead.
 * Redacts PII fields automatically.
 * Never log secrets, phone numbers, or addresses.
 */

const PII_FIELDS = ['phone', 'password', 'token', 'secret', 'address', 'landmark'];

function redact(obj: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const isRedacted = PII_FIELDS.some((f) => key.toLowerCase().includes(f));
    result[key] = isRedacted ? '[REDACTED]' : value;
  }
  return result;
}

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(
  level: LogLevel,
  message: string,
  context?: Record<string, unknown>
): void {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...(context ? { context: redact(context) } : {}),
  };
  // In production, replace with a proper structured log sink (e.g., Vercel Log Drains)
  if (level === 'error') {
    console.error(JSON.stringify(entry));
  } else if (level === 'warn') {
    console.warn(JSON.stringify(entry));
  } else {
    console.log(JSON.stringify(entry));
  }
}

export const logger = {
  info: (message: string, context?: Record<string, unknown>) => log('info', message, context),
  warn: (message: string, context?: Record<string, unknown>) => log('warn', message, context),
  error: (message: string, context?: Record<string, unknown>) => log('error', message, context),
  debug: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV !== 'production') {
      log('debug', message, context);
    }
  },
};
