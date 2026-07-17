import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center min-h-[70vh] p-6 text-center">
      <div className="space-y-4 max-w-md">
        <h1 className="text-6xl font-extrabold text-primary">404</h1>
        <h2 className="text-2xl font-bold tracking-tight">Page Not Found</h2>
        <p className="text-muted-foreground text-sm">
          The page you are looking for does not exist or may have moved.
        </p>
        <div className="pt-2 flex justify-center gap-3">
          <Link href="/dashboard">
            <Button className="cursor-pointer">Go to Dashboard</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="cursor-pointer">
              Home
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
