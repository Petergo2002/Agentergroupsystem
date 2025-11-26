"use client";

import { useEffect } from "react";
import { logger } from "@/lib/logger";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to our logging service
    logger.error("Global application error", {
      error: error.message,
      stack: error.stack,
      digest: error.digest,
    });
  }, [error]);

  return (
    <html lang="sv">
      <body>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          <div
            style={{
              maxWidth: "32rem",
              textAlign: "center",
            }}
          >
            <h1
              style={{
                fontSize: "2rem",
                fontWeight: "bold",
                marginBottom: "1rem",
              }}
            >
              Något gick fel
            </h1>
            <p
              style={{
                color: "#666",
                marginBottom: "2rem",
              }}
            >
              Ett kritiskt fel har inträffat. Vänligen ladda om sidan eller
              kontakta support om problemet kvarstår.
            </p>

            {process.env.NODE_ENV === "development" && (
              <div
                style={{
                  backgroundColor: "#f5f5f5",
                  padding: "1rem",
                  borderRadius: "0.5rem",
                  marginBottom: "2rem",
                  textAlign: "left",
                }}
              >
                <p
                  style={{
                    fontFamily: "monospace",
                    fontSize: "0.875rem",
                    color: "#dc2626",
                    wordBreak: "break-word",
                  }}
                >
                  {error.message}
                </p>
              </div>
            )}

            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                onClick={() => reset()}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#000",
                  color: "#fff",
                  border: "none",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                Försök igen
              </button>
              <button
                type="button"
                onClick={() => {
                  window.location.href = "/";
                }}
                style={{
                  padding: "0.5rem 1rem",
                  backgroundColor: "#fff",
                  color: "#000",
                  border: "1px solid #ddd",
                  borderRadius: "0.375rem",
                  cursor: "pointer",
                  fontSize: "1rem",
                }}
              >
                Gå till startsidan
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
