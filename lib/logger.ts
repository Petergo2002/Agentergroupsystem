/**
 * Production-ready logger with structured logging
 * - Sanitizes sensitive data (passwords, tokens, API keys)
 * - JSON format in production for log aggregation
 * - Human-readable format in development
 * - Ready for Sentry integration
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === "development";
  private isProduction = process.env.NODE_ENV === "production";

  /**
   * Sanitize sensitive data from logs
   */
  private sanitize(data: any): any {
    if (!data || typeof data !== "object") return data;

    const sanitized = { ...data };
    const sensitiveKeys = [
      "password",
      "token",
      "secret",
      "api_key",
      "apiKey",
      "vapi_api_key",
      "authorization",
      "cookie",
      "supabase_service_role",
      "service_role",
    ];

    for (const key of Object.keys(sanitized)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sensitive) => lowerKey.includes(sensitive))) {
        sanitized[key] = "[REDACTED]";
      } else if (typeof sanitized[key] === "object") {
        sanitized[key] = this.sanitize(sanitized[key]);
      }
    }

    return sanitized;
  }

  /**
   * Format log entry as JSON for production
   */
  private formatEntry(entry: LogEntry): string {
    const sanitizedContext = entry.context
      ? this.sanitize(entry.context)
      : undefined;

    const logData = {
      level: entry.level,
      message: entry.message,
      timestamp: entry.timestamp,
      ...(sanitizedContext && { context: sanitizedContext }),
      ...(entry.error && {
        error: {
          name: entry.error.name,
          message: entry.error.message,
          stack: this.isDevelopment ? entry.error.stack : undefined,
        },
      }),
    };

    return JSON.stringify(logData);
  }

  /**
   * Send to external logging service (Sentry, LogRocket, etc.)
   *
   * To enable Sentry integration:
   * 1. Install @sentry/nextjs: npm install @sentry/nextjs
   * 2. Run: npx @sentry/wizard@latest -i nextjs
   * 3. Uncomment the Sentry code below
   *
   * The logger API will remain stable - just uncomment to enable.
   */
  private async sendToExternalService(entry: LogEntry): Promise<void> {
    // Sentry integration (uncomment when ready):
    // try {
    //   const Sentry = await import("@sentry/nextjs");
    //
    //   if (entry.level === "error") {
    //     if (entry.error) {
    //       Sentry.captureException(entry.error, {
    //         level: "error",
    //         contexts: {
    //           custom: this.sanitize(entry.context || {}),
    //         },
    //         tags: {
    //           source: "logger",
    //         },
    //       });
    //     } else {
    //       Sentry.captureMessage(entry.message, {
    //         level: "error",
    //         contexts: {
    //           custom: this.sanitize(entry.context || {}),
    //         },
    //       });
    //     }
    //   } else if (entry.level === "warn") {
    //     Sentry.captureMessage(entry.message, {
    //       level: "warning",
    //       contexts: {
    //         custom: this.sanitize(entry.context || {}),
    //       },
    //     });
    //   }
    // } catch {
    //   // Sentry not available, silently ignore
    // }

    // For now, just ensure the entry is used to avoid unused variable warning
    void entry;
  }

  /**
   * Log info message
   */
  info(message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level: "info",
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (this.isProduction) {
      console.log(this.formatEntry(entry));
    } else {
      console.log(`[INFO] ${message}`, context || "");
    }
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: Record<string, any>): void {
    const entry: LogEntry = {
      level: "warn",
      message,
      timestamp: new Date().toISOString(),
      context,
    };

    if (this.isProduction) {
      console.warn(this.formatEntry(entry));
    } else {
      console.warn(`[WARN] ${message}`, context || "");
    }

    this.sendToExternalService(entry).catch(() => {});
  }

  /**
   * Log error message
   */
  error(
    message: string,
    error?: Error | Record<string, any>,
    context?: Record<string, any>,
  ): void {
    // Handle both (message, Error) and (message, context) signatures
    const actualError = error instanceof Error ? error : undefined;
    const actualContext =
      error instanceof Error ? context : (error as Record<string, any>);

    const entry: LogEntry = {
      level: "error",
      message,
      timestamp: new Date().toISOString(),
      context: actualContext,
      error: actualError,
    };

    if (this.isProduction) {
      console.error(this.formatEntry(entry));
    } else {
      console.error(
        `[ERROR] ${message}`,
        actualError || "",
        actualContext || "",
      );
    }

    this.sendToExternalService(entry).catch(() => {});
  }

  /**
   * Log debug message (only in development)
   */
  debug(message: string, context?: Record<string, any>): void {
    if (!this.isDevelopment) return;

    console.debug(`[DEBUG] ${message}`, context || "");
  }
}

export const logger = new Logger();
