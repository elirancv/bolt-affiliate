// Simple logger implementation
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  level: LogLevel;
  tags?: string[];
}

class Logger {
  private isProduction = import.meta.env.PROD;
  private minLevel: LogLevel = this.isProduction ? 'info' : 'debug';
  
  private levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const timestamp = new Date().toISOString();
    const dataString = data ? `\n${JSON.stringify(data, null, 2)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${dataString}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels[level] >= this.levels[this.minLevel];
  }

  private log(options: LoggerOptions, message: string, data?: any) {
    const { level, tags = [] } = options;

    if (!this.shouldLog(level)) return;

    const formattedMessage = this.formatMessage(level, message, data);

    // Console output
    switch (level) {
      case 'error':
        console.error(formattedMessage);
        break;
      case 'warn':
        console.warn(formattedMessage);
        break;
      case 'info':
        console.info(formattedMessage);
        break;
      case 'debug':
        console.debug(formattedMessage);
        break;
    }
  }

  debug(message: string, data?: any, options: Partial<LoggerOptions> = {}) {
    this.log({ level: 'debug', ...options }, message, data);
  }

  info(message: string, data?: any, options: Partial<LoggerOptions> = {}) {
    this.log({ level: 'info', ...options }, message, data);
  }

  warn(message: string, data?: any, options: Partial<LoggerOptions> = {}) {
    this.log({ level: 'warn', ...options }, message, data);
  }

  error(message: string, data?: any, options: Partial<LoggerOptions> = {}) {
    this.log({ level: 'error', ...options }, message, data);
  }
}

export const logger = new Logger();
