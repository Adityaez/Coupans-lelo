import { NextResponse } from "next/server";
import { createClient } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;

      // Sync user into PostgreSQL using Prisma upsert
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
    }
  }

  // Redirect to requested next page or dashboard
  return NextResponse.redirect(`${origin}${next}`);
}
