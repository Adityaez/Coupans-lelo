import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

/**
 * Creates a request-scoped Supabase client for Server Components,
 * Route Handlers, and Server Actions. Awaits and sets cookies.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Can be ignored if handled by middleware session refreshing
          }
        },
      },
    }
  );
}

/**
 * Helper to fetch the current authenticated Supabase user on the server.
 */
export async function getServerUser() {
  const supabase = await createClient();
  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error || !user) return null;
    return user;
  } catch {
    return null;
  }
}

/**
 * Helper to fetch the current authenticated user's database profile via Prisma.
 */
export async function getServerProfile() {
  const user = await getServerUser();
  if (!user) return null;

  try {
    return await prisma.user.findUnique({
      where: { id: user.id },
    });
  } catch {
    return null;
  }
}
