"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, SORT_OPTIONS } from "@/lib/listing-constants";

export function ListingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [showFilters, setShowFilters] = useState(false);

  const currentQ = searchParams.get("q") || "";
  const currentCategory = searchParams.get("category") || "";
  const currentSort = searchParams.get("sort") || "newest";
  const currentMinDiscount = searchParams.get("minDiscount") || "";
  const currentExpiringSoon = searchParams.get("expiringSoon") === "true";

  const [searchInput, setSearchInput] = useState(currentQ);

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(updates)) {
        if (value) {
          params.set(key, value);
        } else {
          params.delete(key);
        }
      }
      // Reset to page 1 when filtering
      params.delete("page");

      startTransition(() => {
        router.push(`/listings?${params.toString()}`);
      });
    },
    [router, searchParams]
  );

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: searchInput });
  };

  const clearAllFilters = () => {
    setSearchInput("");
    startTransition(() => {
      router.push("/listings");
    });
  };

  const hasActiveFilters =
    currentQ || currentCategory || currentMinDiscount || currentExpiringSoon;

  return (
    <div className="space-y-4">
      {/* Search bar */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search by brand, category..."
            className="pl-10 h-11"
          />
        </div>
        <Button
          type="submit"
          variant="default"
          className="h-11 px-6 cursor-pointer"
          disabled={isPending}
        >
          Search
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="h-11 w-11 shrink-0 md:hidden cursor-pointer"
          onClick={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal className="h-4 w-4" />
        </Button>
      </form>

      {/* Filter bar */}
      <div
        className={`flex flex-wrap items-center gap-3 ${showFilters ? "flex" : "hidden md:flex"}`}
      >
        {/* Category */}
        <Select
          value={currentCategory}
          onValueChange={(val) =>
            updateParams({ category: !val || val === "all" ? "" : val })
          }
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select
          value={currentSort}
          onValueChange={(val) => updateParams({ sort: val || "newest" })}
        >
          <SelectTrigger className="w-[180px] h-9">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Minimum Discount */}
        <Select
          value={currentMinDiscount}
          onValueChange={(val) =>
            updateParams({ minDiscount: !val || val === "any" ? "" : val })
          }
        >
          <SelectTrigger className="w-[160px] h-9">
            <SelectValue placeholder="Min Discount" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Discount</SelectItem>
            <SelectItem value="10">10%+ Off</SelectItem>
            <SelectItem value="20">20%+ Off</SelectItem>
            <SelectItem value="30">30%+ Off</SelectItem>
            <SelectItem value="50">50%+ Off</SelectItem>
          </SelectContent>
        </Select>

        {/* Expiring Soon toggle */}
        <Button
          variant={currentExpiringSoon ? "default" : "outline"}
          size="sm"
          className="h-9 cursor-pointer"
          onClick={() =>
            updateParams({
              expiringSoon: currentExpiringSoon ? "" : "true",
            })
          }
        >
          🔥 Expiring Soon
        </Button>

        {/* Clear filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="h-9 text-muted-foreground cursor-pointer"
            onClick={clearAllFilters}
          >
            <X className="h-3 w-3 mr-1" />
            Clear All
          </Button>
        )}
      </div>

      {/* Active filter badges */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {currentQ && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => {
                setSearchInput("");
                updateParams({ q: "" });
              }}
            >
              Search: &ldquo;{currentQ}&rdquo;
              <X className="h-3 w-3" />
            </Badge>
          )}
          {currentCategory && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => updateParams({ category: "" })}
            >
              {currentCategory}
              <X className="h-3 w-3" />
            </Badge>
          )}
          {currentMinDiscount && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => updateParams({ minDiscount: "" })}
            >
              {currentMinDiscount}%+ off
              <X className="h-3 w-3" />
            </Badge>
          )}
          {currentExpiringSoon && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => updateParams({ expiringSoon: "" })}
            >
              Expiring Soon
              <X className="h-3 w-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
