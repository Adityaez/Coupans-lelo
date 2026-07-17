"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application Error:", error);
  }, [error]);

  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="space-y-4 max-w-md">
        <h1 className="text-4xl font-extrabold text-destructive">Something went wrong</h1>
        <p className="text-muted-foreground text-sm">
          An unexpected error occurred while loading this page.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Button onClick={() => reset()} className="cursor-pointer">
            Try Again
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" className="cursor-pointer">
              Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
