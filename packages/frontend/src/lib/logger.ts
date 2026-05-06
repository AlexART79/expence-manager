type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, context?: Record<string, unknown>) => void;
  info: (message: string, context?: Record<string, unknown>) => void;
  warn: (message: string, context?: Record<string, unknown>) => void;
  error: (message: string, context?: Record<string, unknown>) => void;
}

function createLogger(namespace: string): Logger {
  const isDev = import.meta.env.DEV;

  function log(level: LogLevel, message: string, context?: Record<string, unknown>) {
    if (!isDev && level === 'debug') return;
    const entry = { timestamp: new Date().toISOString(), level, namespace, message, ...context };
    console[level === 'debug' ? 'debug' : level](entry);
  }

  return {
    debug: (msg, ctx) => log('debug', msg, ctx),
    info: (msg, ctx) => log('info', msg, ctx),
    warn: (msg, ctx) => log('warn', msg, ctx),
    error: (msg, ctx) => log('error', msg, ctx),
  };
}

export const logger = createLogger('app');
export { createLogger };
