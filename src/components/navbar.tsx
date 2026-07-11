import Link from "next/link";
import { getServerUser } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";

export async function Navbar() {
  const user = await getServerUser();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 max-w-7xl mx-auto items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/"
            className="flex items-center space-x-2 font-bold text-xl tracking-tight text-primary transition-opacity hover:opacity-90"
          >
            CouponSwap
          </Link>
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            {/* Browse — always visible (public page) */}
            <Link
              href="/listings"
              className="transition-colors hover:text-foreground"
            >
              Browse
            </Link>
            {user && (
              <>
                <Link
                  href="/dashboard"
                  className="transition-colors hover:text-foreground"
                >
                  Dashboard
                </Link>
                <Link
                  href="/sell"
                  className="transition-colors hover:text-foreground"
                >
                  Sell
                </Link>
                <Link
                  href="/profile"
                  className="transition-colors hover:text-foreground"
                >
                  Profile
                </Link>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden sm:inline-block text-sm text-muted-foreground">
                {user.email}
              </span>
              <LogoutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="inline-flex h-9 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 cursor-pointer"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
