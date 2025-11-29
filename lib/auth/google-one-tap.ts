import { createSupabaseClient } from "@/lib/supabase";

export const initializeGoogleOneTap = async (
  onSuccess: () => void,
  onError: (error: Error) => void,
) => {
  const { google } = window as unknown as {
    google?: {
      accounts: {
        id: {
          initialize: (config: any) => void;
          prompt: (callback: (notification: any) => void) => void;
        };
      };
    };
  };

  if (!google) {
    onError(new Error("Google API not loaded"));
    return;
  }

  const supabase = createSupabaseClient();

  // Check for existing session
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (session) {
    onSuccess();
    return;
  }

  // Generate nonce for security
  const generateNonce = async (): Promise<[string, string]> => {
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
  };

  try {
    const [nonce, hashedNonce] = await generateNonce();

    google.accounts.id.initialize({
      client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
      callback: async (response: any) => {
        try {
          const { error } = await supabase.auth.signInWithIdToken({
            provider: "google",
            token: response.credential,
            nonce,
          });

          if (error) throw error;
          onSuccess();
        } catch (error) {
          onError(error as Error);
        }
      },
      nonce: hashedNonce,
      use_fedcm_for_prompt: true,
      cancel_on_tap_outside: false,
    });

    // Show the One Tap UI
    google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        onError(new Error("Google One Tap prompt was not displayed"));
      }
    });
  } catch (error) {
    onError(error as Error);
  }
};

export const loadGoogleScript = (
  onLoad: () => void,
  onError: (error: Error) => void,
) => {
  const script = document.createElement("script");
  script.src = "https://accounts.google.com/gsi/client";
  script.async = true;
  script.onload = onLoad;
  script.onerror = () =>
    onError(new Error("Failed to load Google One Tap script"));
  document.body.appendChild(script);

  return () => {
    document.body.removeChild(script);
  };
};
