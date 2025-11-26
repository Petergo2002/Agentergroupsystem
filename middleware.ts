import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            res.cookies.set({
              name,
              value,
              ...options,
            });
          },
          remove(name: string, options: any) {
            res.cookies.set({
              name,
              value: "",
              ...options,
            });
          },
        },
      },
    );

    // Refresh session if expired
    await supabase.auth.getSession();

    // Get user
    const {
      data: { user },
    } = await supabase.auth.getUser();

  // Protect admin routes (except login page)
  if (
    req.nextUrl.pathname.startsWith("/admin") &&
    !req.nextUrl.pathname.startsWith("/admin/login")
  ) {
    if (!user) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    // Check if user is super admin
    const { data: userData } = await supabase
      .from("users")
      .select("is_super_admin")
      .eq("id", user.id)
      .single();

    if (!userData?.is_super_admin) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

    // Protect analytics API routes
    if (req.nextUrl.pathname.startsWith("/analytics/api")) {
      if (!user) {
        return NextResponse.redirect(new URL("/auth/login", req.url));
      }
    }

    return res;
  } catch (error) {
    console.error("Middleware error:", error);
    // If Supabase is down or there's an error, allow the request through
    // but log the error for monitoring
    return res;
  }
}
