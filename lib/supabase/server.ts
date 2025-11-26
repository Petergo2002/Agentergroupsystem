import { createServerClient as createServerClientHelper } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { NextRequest, NextResponse } from "next/server";

type CookieOptions = {
  name: string;
  value: string;
  httpOnly?: boolean;
  path?: string;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  maxAge?: number;
};

export async function createServerClient() {
  const cookieStore = await cookies();

  // Create a simple cookie store that works with the current Next.js API
  const cookieMethods = {
    get(name: string) {
      return cookieStore.get(name)?.value;
    },
    set(name: string, value: string, options: any = {}) {
      try {
        cookieStore.set({
          name,
          value,
          ...options,
        } as any); // Using 'any' as a workaround for TypeScript type issues
        return true;
      } catch (error) {
        console.error("Error setting cookie:", error);
        return false;
      }
    },
    remove(name: string, options: any = {}) {
      try {
        cookieStore.set({
          name,
          value: "",
          ...options,
          maxAge: 0,
        } as any); // Using 'any' as a workaround for TypeScript type issues
        return true;
      } catch (error) {
        console.error("Error removing cookie:", error);
        return false;
      }
    },
  };

  // Create the Supabase client with proper typing
  const supabase = createServerClientHelper(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieMethods.get(name);
        },
        set(name: string, value: string, options: any) {
          cookieMethods.set(name, value, options);
        },
        remove(name: string, options: any) {
          cookieMethods.remove(name, options);
        },
      },
    },
  );

  return supabase;
}

// Route Handler specific helper: use request cookies for get and response cookies for set/remove
export function createServerClientForRoute(
  req: NextRequest,
  res: NextResponse,
) {
  const supabase = createServerClientHelper(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: "", ...options });
        },
      },
    },
  );

  return supabase;
}
