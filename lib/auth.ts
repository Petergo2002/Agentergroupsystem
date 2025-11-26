import type { User } from "@supabase/supabase-js";
import { createSupabaseClient } from "./supabase";

export interface AuthUser extends User {
  user_metadata: {
    name?: string;
    avatar_url?: string;
  };
}

export const auth = {
  async signUp(email: string, password: string, name: string) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
        },
      },
    });
    return { data, error };
  },

  async signIn(email: string, password: string) {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  },

  async signInWithGoogle() {
    const supabase = createSupabaseClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    return { data, error };
  },

  async signOut() {
    const supabase = createSupabaseClient();
    const { error } = await supabase.auth.signOut();
    return { error };
  },

  async getUser() {
    const supabase = createSupabaseClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    return { user: user as AuthUser | null, error };
  },

  async getSession() {
    const supabase = createSupabaseClient();
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();
    return { session, error };
  },

  onAuthStateChange(callback: (user: AuthUser | null) => void) {
    const supabase = createSupabaseClient();
    return supabase.auth.onAuthStateChange((_event: any, session: any) => {
      callback(session?.user as AuthUser | null);
    });
  },
};
