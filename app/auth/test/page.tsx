"use client";

import type { Session } from "@supabase/supabase-js";
import { useEffect, useState } from "react";
import GoogleOneTap from "@/components/auth/GoogleOneTap";
import { createSupabaseClient } from "@/lib/supabase";

export default function TestAuthPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);
  const supabase = createSupabaseClient();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        setSession(session);
      } catch (error) {
        console.error("Error checking session:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Set up auth state change listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event: any, session: Session | null) => {
        setSession(session);
      },
    );

    return () => {
      subscription?.unsubscribe();
    };
  }, [supabase]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Force a page reload to clear any client-side state
      window.location.href = "/auth/test";
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Welcome!</h1>
          <div className="mb-6">
            <p className="text-gray-700 mb-2">
              Logged in as:{" "}
              <span className="font-medium">{session.user.email}</span>
            </p>
            <p className="text-sm text-gray-500">User ID: {session.user.id}</p>
          </div>
          <button
            type="button"
            onClick={handleSignOut}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-2 px-4 rounded-md transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-6 text-center">Sign In</h1>
        <div className="mb-4">
          <p className="text-gray-600 text-center mb-6">
            Sign in with your Google account
          </p>
          <div className="flex justify-center">
            <GoogleOneTap />
          </div>
        </div>
      </div>
    </div>
  );
}
