/** How long an offer stays valid before auto-expiring */
export const OFFER_EXPIRY_HOURS = 24;

export const OFFER_STATUSES = [
  "pending",
  "countered",
  "accepted",
  "rejected",
  "expired",
  "withdrawn",
] as const;

export type OfferStatus = (typeof OFFER_STATUSES)[number];

export const OFFER_EVENT_TYPES = [
  "offer",
  "counter",
  "accept",
  "reject",
  "expire",
  "withdraw",
] as const;

export type OfferEventType = (typeof OFFER_EVENT_TYPES)[number];

/** Terminal states — no further actions allowed */
export const TERMINAL_STATUSES: OfferStatus[] = [
  "accepted",
  "rejected",
  "expired",
  "withdrawn",
];

/** Status labels for display */
const STATUS_LABELS: Record<OfferStatus, string> = {
  pending: "Pending",
  countered: "Countered",
  accepted: "Accepted",
  rejected: "Rejected",
  expired: "Expired",
  withdrawn: "Withdrawn",
};

/** Event type labels for timeline display */
const EVENT_LABELS: Record<OfferEventType, string> = {
  offer: "Made an offer",
  counter: "Sent a counter-offer",
  accept: "Accepted the offer",
  reject: "Rejected the offer",
  expire: "Offer expired",
  withdraw: "Withdrew the offer",
};

export function formatOfferStatus(status: string): string {
  return STATUS_LABELS[status as OfferStatus] || status;
}

export function formatEventType(type: string): string {
  return EVENT_LABELS[type as OfferEventType] || type;
}

export function isOfferExpired(expiresAt: Date): boolean {
  return new Date() > new Date(expiresAt);
}

/** Calculate the expiry timestamp from now */
export function calcOfferExpiry(): Date {
  const expiry = new Date();
  expiry.setHours(expiry.getHours() + OFFER_EXPIRY_HOURS);
  return expiry;
}

/** Status-to-color mapping for badges */
export function getStatusColor(status: string): string {
  switch (status as OfferStatus) {
    case "pending":
      return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300";
    case "countered":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
    case "accepted":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
    case "rejected":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    case "expired":
      return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
    case "withdrawn":
      return "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400";
    default:
      return "bg-zinc-100 text-zinc-800";
  }
}
