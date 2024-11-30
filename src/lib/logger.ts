import { User } from '@supabase/supabase-js';

type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: any;
}

class Logger {
  private static instance: Logger;
  private logs: LogEntry[] = [];
  private readonly MAX_LOGS = 1000;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  private addLog(level: LogLevel, message: string, data?: any) {
    const logEntry: LogEntry = {
      timestamp: this.formatTimestamp(),
      level,
      message,
      data
    };

    console.log(`[${logEntry.timestamp}] ${level}: ${message}`, data ? data : '');
    
    this.logs.push(logEntry);
    if (this.logs.length > this.MAX_LOGS) {
      this.logs.shift();
    }
  }

  info(message: string, data?: any) {
    this.addLog('INFO', message, data);
  }

  warn(message: string, data?: any) {
    this.addLog('WARN', message, data);
  }

  error(message: string, data?: any) {
    this.addLog('ERROR', message, data);
  }

  debug(message: string, data?: any) {
    if (process.env.NODE_ENV === 'development') {
      this.addLog('DEBUG', message, data);
    }
  }

  // Specific logging methods for common operations
  logUserAction(action: string, user: User | null, details?: any) {
    this.info(`User ${action}`, {
      userId: user?.id,
      email: user?.email,
      ...details
    });
  }

  logAPICall(endpoint: string, method: string, status: number, duration: number) {
    this.debug(`API Call: ${method} ${endpoint}`, {
      status,
      duration: `${duration}ms`
    });
  }

  logError(error: Error, context?: string) {
    this.error(`${context || 'Application Error'}: ${error.message}`, {
      stack: error.stack,
      context
    });
  }

  logSubscriptionChange(userId: string, oldTier: string, newTier: string) {
    this.info('Subscription Changed', {
      userId,
      from: oldTier,
      to: newTier,
      timestamp: this.formatTimestamp()
    });
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }
}

export const logger = Logger.getInstance();
