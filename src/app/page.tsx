import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Zap, Coins, Search } from "lucide-react";

export default async function Home() {
  const user = await getServerUser();

  return (
    <main className="flex-1 flex flex-col justify-center items-center py-20 px-4 md:px-8 text-center max-w-5xl mx-auto w-full">
      <div className="space-y-6 max-w-3xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20 animate-pulse">
          <span>Phase 2 Listings Live 🎉</span>
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-950 via-zinc-800 to-zinc-600 dark:from-zinc-50 dark:via-zinc-300 dark:to-zinc-500 leading-tight">
          P2P Coupon & Gift Card Marketplace
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Buy and sell unused coupons and gift cards at the best prices. Safely swap, negotiate, and verify codes automatically.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 pt-4">
          {user ? (
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-11 text-base font-semibold group cursor-pointer">
                Go to Dashboard
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          ) : (
            <Link href="/login" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto h-11 text-base font-semibold group cursor-pointer">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          )}
          <Link href="/listings" className="w-full sm:w-auto">
            <Button size="lg" variant="outline" className="w-full sm:w-auto h-11 text-base font-semibold group cursor-pointer">
              <Search className="mr-2 h-4 w-4" />
              Browse Coupons
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full text-left">
        <div className="flex flex-col items-start p-6 bg-card border border-border/40 rounded-xl space-y-3">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Zap className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">Instant Magic Link</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            No passwords to remember. Authenticate securely with a single-use magic login link delivered right to your inbox.
          </p>
        </div>

        <div className="flex flex-col items-start p-6 bg-card border border-border/40 rounded-xl space-y-3">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">Secure User Profiles</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Automatic profile creation and DB synchronization powered by Supabase Auth and Prisma ORM with PostgreSQL.
          </p>
        </div>

        <div className="flex flex-col items-start p-6 bg-card border border-border/40 rounded-xl space-y-3">
          <div className="p-3 bg-primary/10 rounded-lg text-primary">
            <Coins className="h-6 w-6" />
          </div>
          <h3 className="text-lg font-bold">Escrow Swap System</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Swap coupons with confidence. Future phases will introduce automatic code locks, payments, and trade negotiations.
          </p>
        </div>
      </div>
    </main>
  );
}