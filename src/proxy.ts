import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Runs before every page request (Next.js 16 calls this file "proxy").
// 1. Refreshes the Supabase login session and saves it in cookies.
// 2. Sends visitors who are not logged in to /login.
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // The new cookies go on the request (so this page load sees the fresh
          // session) and on the response (so the browser saves them).
          for (const cookie of cookiesToSet) {
            request.cookies.set(cookie.name, cookie.value);
          }
          response = NextResponse.next({ request });
          for (const cookie of cookiesToSet) {
            response.cookies.set(cookie.name, cookie.value, cookie.options);
          }
        },
      },
    }
  );

  // Asks Supabase who is logged in (this also refreshes an expired session).
  const { data } = await supabase.auth.getUser();
  const isLoginPage = request.nextUrl.pathname === "/login";

  if (!data.user && !isLoginPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

// Skip Next.js build files and the tab icon: they never need a login check,
// and redirecting them would break the login page's styles and scripts.
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
