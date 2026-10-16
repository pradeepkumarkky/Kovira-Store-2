/**
 * Kovira Store Centralized Error & Event Logger
 * Tracks Supabase errors, API errors, Dropship sync failures, and client-side notifications
 */

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'supabase' | 'api' | 'sync' | 'auth' | 'checkout' | 'system';
  level: 'info' | 'warn' | 'error';
  message: string;
  details?: any;
}

class CentralLogger {
  private logs: LogEntry[] = [];
  private readonly maxLogs = 200;
  private listeners: ((logs: LogEntry[]) => void)[] = [];

  constructor() {
    // Retain past session error logs from sessionStorage if available
    if (typeof window !== 'undefined') {
      try {
        const stored = window.sessionStorage.getItem('kovira_error_logs');
        if (stored) {
          this.logs = JSON.parse(stored);
        }
      } catch {
        // ignore
      }
    }
  }

  private persist() {
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.setItem('kovira_error_logs', JSON.stringify(this.logs.slice(-50)));
      } catch {
        // ignore
      }
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => {
      try {
        listener([...this.logs]);
      } catch {
        // ignore
      }
    });
  }

  public subscribe(listener: (logs: LogEntry[]) => void): () => void {
    this.listeners.push(listener);
    listener([...this.logs]);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  public log(entry: Omit<LogEntry, 'id' | 'timestamp'>) {
    const fullEntry: LogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...entry,
    };

    this.logs.unshift(fullEntry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    if (entry.level === 'error') {
      console.error(`[KOVIRA ${entry.type.toUpperCase()}]`, entry.message, entry.details || '');
    } else if (entry.level === 'warn') {
      console.warn(`[KOVIRA ${entry.type.toUpperCase()}]`, entry.message, entry.details || '');
    } else {
      console.log(`[KOVIRA ${entry.type.toUpperCase()}]`, entry.message, entry.details || '');
    }

    this.persist();
    return fullEntry;
  }

  public supabase(message: string, error?: any, level: 'warn' | 'error' = 'error') {
    return this.log({
      type: 'supabase',
      level,
      message,
      details: error?.message || error,
    });
  }

  public api(message: string, error?: any, level: 'warn' | 'error' = 'error') {
    return this.log({
      type: 'api',
      level,
      message,
      details: error?.message || error,
    });
  }

  public sync(message: string, details?: any, level: 'info' | 'warn' | 'error' = 'info') {
    return this.log({
      type: 'sync',
      level,
      message,
      details,
    });
  }

  public auth(message: string, details?: any, level: 'info' | 'warn' | 'error' = 'info') {
    return this.log({
      type: 'auth',
      level,
      message,
      details,
    });
  }

  public getLogs(): LogEntry[] {
    return [...this.logs];
  }

  public clear() {
    this.logs = [];
    if (typeof window !== 'undefined') {
      try {
        window.sessionStorage.removeItem('kovira_error_logs');
      } catch {
        // ignore
      }
    }
    this.notify();
  }
}

export const logger = new CentralLogger();
