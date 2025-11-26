"use client";

import { AlertCircle } from "lucide-react";
import React, { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Reusable Error Boundary component
 * Catches errors in child components and displays a fallback UI
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to logging service
    logger.error("ErrorBoundary caught an error", {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border border-destructive/20 bg-destructive/5 p-8">
          <div className="flex flex-col items-center space-y-4 text-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Något gick fel</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                Ett fel uppstod när denna komponent skulle visas. Försök att
                ladda om sidan.
              </p>
            </div>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="w-full max-w-md rounded-md bg-muted p-4 text-left">
                <p className="font-mono text-xs text-destructive break-all">
                  {this.state.error.message}
                </p>
              </div>
            )}
            <Button
              onClick={() =>
                this.setState({ hasError: false, error: undefined })
              }
              variant="outline"
              size="sm"
            >
              Försök igen
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper
 * Usage: <ErrorBoundaryWrapper>...</ErrorBoundaryWrapper>
 */
export function ErrorBoundaryWrapper({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <ErrorBoundary fallback={fallback}>{children}</ErrorBoundary>;
}
