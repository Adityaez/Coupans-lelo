import { redirect } from "next/navigation";
import Link from "next/link";
import { getServerUser, getServerProfile } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MyListingCard } from "@/components/listings/my-listing-card";
import { OfferList } from "@/components/offers/offer-list";
import { Plus, Package, Search, MessageSquare } from "lucide-react";
import type { Metadata } from "next";
import type { Prisma } from "@prisma/client";

export const metadata: Metadata = {
  title: "Dashboard | CouponSwap",
  description: "Manage your CouponSwap account, listings, and trade deals.",
};

type OfferReceived = Prisma.OfferGetPayload<{
  include: {
    listing: { select: { id: true; slug: true; brand: true; category: true; askingPrice: true } };
    buyer: { select: { name: true } };
  };
}>;

type OfferMade = Prisma.OfferGetPayload<{
  include: {
    listing: {
      select: {
        id: true; slug: true; brand: true; category: true; askingPrice: true;
        seller: { select: { name: true } };
      };
    };
  };
}>;

type SearchParams = Promise<{ tab?: string }>;

export default async function DashboardPage(props: {
  searchParams: SearchParams;
}) {
  const searchParams = await props.searchParams;
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

  // Fetch user's listings
  let myListings: Awaited<ReturnType<typeof prisma.listing.findMany>> = [];
  let offersReceived: OfferReceived[] = [];
  let offersMadeWithSeller: OfferMade[] = [];

  try {
    myListings = await prisma.listing.findMany({
      where: { sellerId: user.id },
      orderBy: { createdAt: "desc" },
    });

    offersReceived = await prisma.offer.findMany({
      where: {
        listing: { sellerId: user.id },
      },
      include: {
        listing: { select: { id: true, slug: true, brand: true, category: true, askingPrice: true } },
        buyer: { select: { name: true } },
      },
      orderBy: { updatedAt: "desc" },
    });

    offersMadeWithSeller = await prisma.offer.findMany({
      where: { buyerId: user.id },
      include: {
        listing: {
          select: { id: true, slug: true, brand: true, category: true, askingPrice: true, seller: { select: { name: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
  } catch (error) {
    console.error("Dashboard DB fetch error:", error);
  }

  const activeListings = myListings.filter((l) => l.status === "active");
  const soldListings = myListings.filter((l) => l.status === "sold");

  const totalOffers = offersReceived.length + offersMadeWithSeller.length;
  const activeOffers = offersReceived.filter((o) => o.status === "pending" || o.status === "countered").length
    + offersMadeWithSeller.filter((o) => o.status === "pending" || o.status === "countered").length;

  const joinedDate = new Date(profile.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const defaultTab = searchParams.tab || "overview";

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
            <Link href="/sell">
              <Button variant="outline" className="cursor-pointer gap-2">
                <Plus className="h-4 w-4" />
                Create Listing
              </Button>
            </Link>
            <Link href="/listings">
              <Button className="cursor-pointer gap-2">
                <Search className="h-4 w-4" />
                Browse Listings
              </Button>
            </Link>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue={defaultTab} className="space-y-6">
          <TabsList className="h-10">
            <TabsTrigger value="overview" className="px-4 cursor-pointer">
              Overview
            </TabsTrigger>
            <TabsTrigger value="offers" className="px-4 cursor-pointer">
              Offers
              {activeOffers > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 text-[10px] font-bold">
                  {activeOffers}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="listings" className="px-4 cursor-pointer">
              My Listings
              {myListings.length > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center h-5 min-w-5 px-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                  {myListings.length}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
              <Card className="shadow-sm border border-border/40">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold">{myListings.length}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Total Listings
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border border-border/40">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-emerald-600">
                    {activeListings.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Active
                  </p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border border-border/40">
                <CardContent className="pt-6">
                  <div className="text-2xl font-bold text-blue-600">
                    {soldListings.length}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Sold</p>
                </CardContent>
              </Card>
              <Card className="shadow-sm border border-border/40">
                <CardContent className="pt-6 flex flex-col items-center">
                  <span className="text-2xl font-bold text-primary">
                    {profile.ratingAvg.toFixed(1)}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">
                    Rating ({profile.ratingCount} reviews)
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* User Details */}
            <Card className="shadow-sm border border-border/40">
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
          </TabsContent>

          {/* Offers Tab */}
          <TabsContent value="offers" className="space-y-6">
            {/* Offers Received */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Offers Received</h3>
                <span className="text-xs text-muted-foreground">({offersReceived.length})</span>
              </div>
              <OfferList
                perspective="seller"
                emptyMessage="No offers received yet. List a coupon and wait for buyers!"
                offers={offersReceived.map((o) => ({
                  id: o.id,
                  amount: Number(o.amount),
                  status: o.status,
                  updatedAt: o.updatedAt.toISOString(),
                  listing: {
                    id: o.listing.id,
                    slug: o.listing.slug,
                    brand: o.listing.brand,
                    category: o.listing.category,
                    askingPrice: Number(o.listing.askingPrice),
                  },
                  counterparty: { name: o.buyer.name },
                }))}
              />
            </div>

            {/* Offers Made */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-muted-foreground" />
                <h3 className="font-semibold">Offers Made</h3>
                <span className="text-xs text-muted-foreground">({offersMadeWithSeller.length})</span>
              </div>
              <OfferList
                perspective="buyer"
                emptyMessage="You haven't made any offers yet. Browse listings to find deals!"
                offers={offersMadeWithSeller.map((o) => ({
                  id: o.id,
                  amount: Number(o.amount),
                  status: o.status,
                  updatedAt: o.updatedAt.toISOString(),
                  listing: {
                    id: o.listing.id,
                    slug: o.listing.slug,
                    brand: o.listing.brand,
                    category: o.listing.category,
                    askingPrice: Number(o.listing.askingPrice),
                  },
                  counterparty: { name: o.listing.seller.name },
                }))}
              />
            </div>
          </TabsContent>

          {/* My Listings Tab */}
          <TabsContent value="listings" className="space-y-4">
            {myListings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="p-4 rounded-full bg-muted/50 mb-4">
                  <Package className="h-8 w-8 text-muted-foreground/50" />
                </div>
                <h3 className="text-lg font-semibold mb-1">
                  No listings yet
                </h3>
                <p className="text-sm text-muted-foreground max-w-sm mb-6">
                  Start selling your unused coupons and gift cards to earn
                  money from deals you won&apos;t use.
                </p>
                <Link href="/sell">
                  <Button className="cursor-pointer gap-2">
                    <Plus className="h-4 w-4" />
                    Create Your First Listing
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myListings.map((listing) => (
                  <MyListingCard
                    key={listing.id}
                    listing={{
                      id: listing.id,
                      brand: listing.brand,
                      slug: listing.slug,
                      category: listing.category,
                      faceValue: Number(listing.faceValue),
                      askingPrice: Number(listing.askingPrice),
                      expiryDate: listing.expiryDate.toISOString(),
                      couponType: listing.couponType,
                      imageUrl: listing.imageUrl,
                      status: listing.status,
                      createdAt: listing.createdAt.toISOString(),
                    }}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end pt-4 border-t border-border/40">
          <LogoutButton />
        </div>
      </div>
    </main>
  );
}
