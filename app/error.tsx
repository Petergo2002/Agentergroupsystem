"use client";

import { AlertCircle } from "lucide-react";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { logger } from "@/lib/logger";

type AppErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AppError({ error, reset }: AppErrorProps) {
  useEffect(() => {
    // Log the error to our logging service
    logger.error("Application error", {
      error: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6 text-center">
        <div className="flex justify-center">
          <div className="rounded-full bg-destructive/10 p-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Något gick fel</h1>
          <p className="text-muted-foreground">
            Ett oväntat fel har inträffat. Vi har loggat problemet och kommer
            att undersöka det.
          </p>
        </div>

        {process.env.NODE_ENV === "development" && (
          <div className="rounded-lg bg-muted p-4 text-left">
            <p className="font-mono text-sm text-destructive">
              {error.message}
            </p>
            {error.stack && (
              <pre className="mt-2 overflow-auto text-xs text-muted-foreground">
                {error.stack}
              </pre>
            )}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} variant="default">
            Försök igen
          </Button>
          <Button
            onClick={() => {
              window.location.href = "/";
            }}
            variant="outline"
          >
            Gå till startsidan
          </Button>
        </div>
      </div>
    </div>
  );
}
