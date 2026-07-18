import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    DATABASE_URL_set: !!process.env.DATABASE_URL,
    DIRECT_URL_set: !!process.env.DIRECT_URL,
    SUPABASE_URL_set: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
  };

  try {
    // Test basic DB connectivity
    const result = await prisma.$queryRaw`SELECT 1 as ok`;
    checks.db_connected = true;
    checks.db_result = result;
  } catch (err) {
    checks.db_connected = false;
    checks.db_error = err instanceof Error ? err.message : String(err);
  }

  try {
    // Count users
    const count = await prisma.user.count();
    checks.user_count = count;
  } catch (err) {
    checks.user_count_error = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(checks);
}
