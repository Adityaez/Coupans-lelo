export const CATEGORIES = [
  "Food & Dining",
  "E-commerce",
  "Travel",
  "Entertainment",
  "Fashion",
  "Electronics",
  "Grocery",
  "Health & Beauty",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];

export const COUPON_TYPES = ["code", "physical"] as const;
export type CouponType = (typeof COUPON_TYPES)[number];

export const LISTING_STATUSES = ["active", "sold", "removed"] as const;
export type ListingStatus = (typeof LISTING_STATUSES)[number];

export const SORT_OPTIONS = [
  { value: "newest", label: "Newest First" },
  { value: "price_low", label: "Price: Low → High" },
  { value: "price_high", label: "Price: High → Low" },
  { value: "discount", label: "Biggest Discount" },
  { value: "expiry", label: "Expiring Soon" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

/** Generate a URL-friendly slug from a brand name */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Calculate discount percentage */
export function calcDiscount(faceValue: number, askingPrice: number): number {
  if (faceValue <= 0) return 0;
  return Math.round(((faceValue - askingPrice) / faceValue) * 100);
}

/** Format currency for INR */
export function formatPrice(amount: number | string): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
}

/** Days remaining until expiry */
export function daysUntilExpiry(expiryDate: Date | string): number {
  const expiry = typeof expiryDate === "string" ? new Date(expiryDate) : expiryDate;
  const now = new Date();
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}
