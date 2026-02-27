/**
 * Production-safe logging utility
 * Suppresses debug/info logs in production to reduce noise
 */

import { isProduction } from './envValidation';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private shouldLog(level: LogLevel): boolean {
    // In production, only log warnings and errors
    if (isProduction) {
      return level === 'warn' || level === 'error';
    }
    // In development, log everything
    return true;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.shouldLog('debug')) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.shouldLog('info')) {
      console.info(`[INFO] ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.shouldLog('warn')) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  }

  error(message: string, error?: unknown, ...args: unknown[]): void {
    if (this.shouldLog('error')) {
      console.error(`[ERROR] ${message}`, error, ...args);
      
      // In production, attempt to report errors for monitoring
      if (isProduction && error instanceof Error) {
        this.reportError(error, message);
      }
    }
  }

  private reportError(error: Error, context?: string): void {
    try {
      const errorData = {
        message: error.message,
        stack: error.stack,
        context,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      };
      
      // In a real production app, you would send this to an error reporting service
      // For now, we'll just log it to console in a structured way
      console.error('🚨 Production Error Report:', errorData);
    } catch (reportError) {
      console.error('Failed to report error:', reportError);
    }
  }
}

export const logger = new Logger();
