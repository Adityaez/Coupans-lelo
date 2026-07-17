import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { type NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  // Build the URL we'll redirect to after processing
  const redirectTo = new URL(next, origin);

  if (code) {
    // Create the redirect response FIRST so we can set cookies directly on it
    const response = NextResponse.redirect(redirectTo);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              // Set cookies directly on the response object so they
              // survive the redirect — this is the critical fix.
              response.cookies.set(name, value, options);
            });
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;

      // Sync user into PostgreSQL using Prisma upsert
      try {
        await prisma.user.upsert({
          where: { id: user.id },
          update: {
            email: user.email || null,
            phone: user.phone || null,
          },
          create: {
            id: user.id,
            email: user.email || null,
            phone: user.phone || null,
            name: null,
            avatarUrl: null,
            ratingAvg: 0,
            ratingCount: 0,
            isAdmin: false,
          },
        });
      } catch {
        // DB sync failed but auth succeeded — don't block the login
      }

      // Return the response with session cookies attached
      return response;
    }
  }

  // No code or exchange failed — send back to login
  return NextResponse.redirect(new URL("/login", origin));
}
