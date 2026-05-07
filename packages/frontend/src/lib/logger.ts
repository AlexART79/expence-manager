export type LogContext = Record<string, unknown>;

export type FrontendLogger = {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, context?: LogContext): void;
};

export function createLogger(scope: string): FrontendLogger {
  const prefix = `[${scope}]`;

  return {
    debug: (message, context) => console.debug(`${prefix} ${message}`, context),
    info: (message, context) => console.info(`${prefix} ${message}`, context),
    warn: (message, context) => console.warn(`${prefix} ${message}`, context),
    error: (message, context) => console.error(`${prefix} ${message}`, context)
  };
}

export const logger = createLogger("app");
