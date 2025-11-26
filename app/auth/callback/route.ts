import { type NextRequest, NextResponse } from "next/server";
import { createServerClientForRoute } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");

  if (code) {
    // Prepare the redirect response early so we can set cookies on it
    const redirectTo = `${requestUrl.origin}/`;
    const response = NextResponse.redirect(redirectTo);
    const supabase = createServerClientForRoute(request, response);
    await supabase.auth.exchangeCodeForSession(code);
    return response;
  }

  // URL to redirect to after sign in process completes
  return NextResponse.redirect(`${requestUrl.origin}/`);
}
