"use client";

import { useRouter } from "next/navigation";
import Script from "next/script";
import { useCallback, useEffect, useState } from "react";
import { logger } from "@/lib/logger";
import { createSupabaseClient } from "@/lib/supabase";

// Type definitions for Google One Tap
type GoogleCredentialResponse = {
  credential: string;
  select_by: string;
  client_id: string;
};

type GooglePromptMomentNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
  getNotDisplayedReason: () => string;
  getSkippedReason: () => string;
  getDismissedReason: () => string;
  getMomentType: () => string;
};

interface GoogleAccounts {
  accounts: {
    id: {
      initialize: (config: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
        nonce?: string;
        use_fedcm_for_prompt?: boolean;
        cancel_on_tap_outside?: boolean;
      }) => void;
      prompt: (
        callback?: (notification: GooglePromptMomentNotification) => void,
      ) => void;
      renderButton: (element: HTMLElement, options: any) => void;
      revoke: (
        hint: string,
        callback: (response: { successful: boolean; error: string }) => void,
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleAccounts;
  }
}

const GoogleOneTap = () => {
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const supabase = createSupabaseClient();
  const router = useRouter();

  const generateNonce = useCallback(async (): Promise<[string, string]> => {
    const nonce = btoa(
      String.fromCharCode(...crypto.getRandomValues(new Uint8Array(32))),
    );
    const encoder = new TextEncoder();
    const encodedNonce = encoder.encode(nonce);
    const hashBuffer = await crypto.subtle.digest("SHA-256", encodedNonce);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashedNonce = hashArray
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    return [nonce, hashedNonce];
  }, []);

  const handleCredentialResponse = useCallback(
    (nonce: string) => async (response: GoogleCredentialResponse) => {
      try {
        const { error } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token: response.credential,
          nonce,
        });

        if (error) throw error;
        router.push("/");
      } catch (error) {
        logger.error("Error during Google One Tap sign in", { error });
      }
    },
    [router, supabase.auth],
  );

  const initializeGoogleOneTap = useCallback(async () => {
    try {
      logger.debug("Initializing Google One Tap");

      // Check for existing session
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        logger.debug("User already has a session, redirecting to home");
        router.push("/");
        return;
      }

      logger.debug("Generating nonce");
      const [nonce, hashedNonce] = await generateNonce();

      // Wait for Google API to be available
      const checkGoogle = () => {
        return new Promise<void>((resolve, reject) => {
          let attempts = 0;
          const check = () => {
            if (typeof window !== "undefined" && window.google?.accounts?.id) {
              logger.debug("Google API is available");
              resolve();
            } else if (attempts < 10) {
              // Try for up to 2 seconds (200ms * 10)
              attempts++;
              logger.debug(`Waiting for Google API (attempt ${attempts}/10)`);
              setTimeout(check, 200);
            } else {
              const error = new Error(
                "Google API not loaded after multiple attempts",
              );
              logger.error("Google API failed to load", { error });
              reject(error);
            }
          };
          check();
        });
      };

      logger.debug("Checking for Google API");
      await checkGoogle();

      if (typeof window === "undefined" || !window.google?.accounts?.id) {
        const error = new Error("Google API not available");
        logger.error("Google API not available", { error });
        throw error;
      }

      logger.debug("Initializing Google One Tap");
      const { google } = window;
      logger.debug("Initializing Google One Tap with client ID", {
        clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
      });
      google.accounts.id.initialize({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
        callback: handleCredentialResponse(nonce),
        nonce: hashedNonce,
        use_fedcm_for_prompt: false, // Disable FedCM as it's causing issues
        cancel_on_tap_outside: true,
      });

      logger.debug("Showing Google One Tap prompt");
      google.accounts.id.prompt(
        (notification: GooglePromptMomentNotification) => {
          if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
            logger.debug("Google One Tap prompt was not displayed", {
              reason:
                (notification as any).getNotDisplayedReason?.() ||
                (notification as any).getSkippedReason?.() ||
                "Unknown reason",
            });
          } else {
            logger.debug("Google One Tap prompt displayed successfully");
          }
        },
      );
    } catch (error) {
      logger.error("Error initializing Google One Tap", { error });
    }
  }, [generateNonce, handleCredentialResponse, router, supabase.auth]);

  useEffect(() => {
    if (scriptLoaded) {
      initializeGoogleOneTap();
    }
  }, [scriptLoaded, initializeGoogleOneTap]);

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="lazyOnload"
      onLoad={() => setScriptLoaded(true)}
      onError={(e) =>
        logger.error("Failed to load Google One Tap script", { error: e })
      }
    />
  );
};

export default GoogleOneTap;
