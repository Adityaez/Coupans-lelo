import { redirect } from "next/navigation";
import { getServerUser, getServerProfile } from "@/lib/auth";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const user = await getServerUser();
  if (!user) {
    redirect("/login");
  }

  const profile = await getServerProfile();
  if (!profile) {
    return (
      <main className="flex flex-1 flex-col items-center justify-center min-h-[calc(100vh-3.5rem)] bg-zinc-50 p-6">
        <div className="max-w-md w-full text-center space-y-4">
          <p className="text-red-500 font-semibold">
            Database profile not synchronized.
          </p>
          <p className="text-sm text-muted-foreground">
            Please log out and log back in to synchronize your profile.
          </p>
          <LogoutButton />
        </div>
      </main>
    );
  }

  const joinedDate = new Date(profile.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="flex-1 max-w-4xl mx-auto w-full px-4 py-8 md:py-12">
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/40 pb-5">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Manage your account and active trade deals
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="cursor-pointer" disabled>
              Create Listing
            </Button>
            <Button className="cursor-pointer" disabled>
              Browse Listings
            </Button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-2 shadow-sm border border-border/40">
            <CardHeader>
              <CardTitle className="text-xl font-semibold">
                User Details
              </CardTitle>
              <CardDescription>
                Your account details synced from Supabase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
                <div>
                  <span className="text-muted-foreground font-medium block mb-1">
                    Name
                  </span>
                  <span className="font-semibold text-foreground text-base">
                    {profile.name || "Not set"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block mb-1">
                    Email Address
                  </span>
                  <span className="font-semibold text-foreground text-base">
                    {profile.email || "Not set"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block mb-1">
                    User ID (UUID)
                  </span>
                  <span
                    className="font-mono text-xs text-foreground block truncate bg-zinc-100 dark:bg-zinc-800 p-2 rounded"
                    title={profile.id}
                  >
                    {profile.id}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground font-medium block mb-1">
                    Joined Date
                  </span>
                  <span className="font-semibold text-foreground text-base">
                    {joinedDate}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-sm border border-border/40 flex flex-col justify-between">
            <div>
              <CardHeader>
                <CardTitle className="text-xl font-semibold">
                  Trader Rating
                </CardTitle>
                <CardDescription>
                  Your reputation score on CouponSwap
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center py-6">
                <span className="text-5xl font-black text-primary">
                  {profile.ratingAvg.toFixed(1)}
                </span>
                <span className="text-muted-foreground mt-2 text-sm font-medium">
                  Based on {profile.ratingCount}{" "}
                  {profile.ratingCount === 1 ? "review" : "reviews"}
                </span>
              </CardContent>
            </div>
            <CardFooter className="flex justify-center border-t border-border/40 bg-muted/30 py-3 rounded-b-xl">
              <span className="text-xs text-muted-foreground font-medium">
                Ratings build peer-to-peer trust
              </span>
            </CardFooter>
          </Card>
        </div>

        <div className="flex justify-end pt-4 border-t border-border/40">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
