# Phase 3 — Offers & Negotiation: Walkthrough

## Summary

Built the complete offer/counter-offer negotiation system for CouponSwap. Two users (buyer + seller) can now make offers, counter, accept, reject, or withdraw — with realtime updates and in-app notifications.

---

## What Changed

### Data Layer
| File | Change |
|------|--------|
| [schema.prisma](file:///c:/coupan-lelo/prisma/schema.prisma) | Added 3 new models: `Offer`, `OfferEvent`, `Notification`. Added back-relations to `User` and `Listing`. Migration: `20260712093147_add_offers_notifications` |

### Shared Logic
| File | Change |
|------|--------|
| [offer-constants.ts](file:///c:/coupan-lelo/src/lib/offer-constants.ts) | Status enums, event type enums, expiry helpers, status badge colors |
| [offer-schemas.ts](file:///c:/coupan-lelo/src/lib/offer-schemas.ts) | Zod validation schemas for make/counter/respond actions |

### Server Actions
| File | Change |
|------|--------|
| [offer-actions.ts](file:///c:/coupan-lelo/src/app/actions/offer-actions.ts) | 5 server actions: `makeOffer`, `counterOffer`, `acceptOffer`, `rejectOffer`, `withdrawOffer`. Each uses Prisma transactions and dispatches notifications |

### Services
| File | Change |
|------|--------|
| [notification-service.ts](file:///c:/coupan-lelo/src/services/notification-service.ts) | In-app notification creator + optional email dispatch via Resend |
| [email-service.ts](file:///c:/coupan-lelo/src/services/email-service.ts) | Transactional email sender using Resend REST API (no SDK needed) |

### API Routes
| File | Change |
|------|--------|
| [/api/offers/[offerId]/events](file:///c:/coupan-lelo/src/app/api/offers/%5BofferId%5D/events/route.ts) | GET — fetch offer event timeline |
| [/api/notifications](file:///c:/coupan-lelo/src/app/api/notifications/route.ts) | GET (paginated) + PATCH (mark as read) |
| [/api/cron/expire-offers](file:///c:/coupan-lelo/src/app/api/cron/expire-offers/route.ts) | POST — expire stale offers (24h window) |

### Realtime Hooks
| File | Change |
|------|--------|
| [use-realtime-offers.ts](file:///c:/coupan-lelo/src/hooks/use-realtime-offers.ts) | Supabase Realtime subscription for offer events + status changes |
| [use-notifications.ts](file:///c:/coupan-lelo/src/hooks/use-notifications.ts) | Supabase Realtime subscription for notification feed |

### UI Components
| File | Change |
|------|--------|
| [make-offer-dialog.tsx](file:///c:/coupan-lelo/src/components/offers/make-offer-dialog.tsx) | Modal dialog for making initial offers, with savings preview |
| [counter-offer-dialog.tsx](file:///c:/coupan-lelo/src/components/offers/counter-offer-dialog.tsx) | Modal dialog for counter-offers |
| [offer-thread.tsx](file:///c:/coupan-lelo/src/components/offers/offer-thread.tsx) | Realtime vertical timeline of offer events |
| [offer-actions-bar.tsx](file:///c:/coupan-lelo/src/components/offers/offer-actions-bar.tsx) | Context-aware Accept/Counter/Reject/Withdraw buttons |
| [offer-list.tsx](file:///c:/coupan-lelo/src/components/offers/offer-list.tsx) | Dashboard offer list rows |
| [notification-bell.tsx](file:///c:/coupan-lelo/src/components/notifications/notification-bell.tsx) | Navbar bell icon with unread count badge |
| [notification-dropdown.tsx](file:///c:/coupan-lelo/src/components/notifications/notification-dropdown.tsx) | Dropdown panel for notification feed |

### Page Updates
| File | Change |
|------|--------|
| [listings/[slug]/page.tsx](file:///c:/coupan-lelo/src/app/listings/%5Bslug%5D/page.tsx) | Replaced disabled "Make an Offer" button with live dialog. Added offer thread for active negotiations. Added "negotiating" status banner. Login CTA for unauthenticated users. |
| [dashboard/page.tsx](file:///c:/coupan-lelo/src/app/dashboard/page.tsx) | Added "Offers" tab with "Offers Received" and "Offers Made" sections |
| [navbar.tsx](file:///c:/coupan-lelo/src/components/navbar.tsx) | Added NotificationBell component |

### Config
| File | Change |
|------|--------|
| [.env.example](file:///c:/coupan-lelo/.env.example) | Documented `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_SITE_URL`, `CRON_SECRET` |

---

## Verification

- ✅ Prisma migration ran successfully
- ✅ TypeScript type checking passed
- ✅ Production build completed with all 14 routes generated
- ✅ No new npm dependencies required (Resend uses native `fetch`)

---

## Before You Test

1. **Enable Supabase Realtime** on `Offer`, `OfferEvent`, and `Notification` tables:
   - Supabase Dashboard → Database → Replication → enable these tables for `INSERT` and `UPDATE`

2. **Optional: Set up Resend** for email notifications:
   - Create account at [resend.com](https://resend.com)
   - Add `RESEND_API_KEY` and `RESEND_FROM_EMAIL` to `.env.local`
   - (App works fine without this — emails are silently skipped)

3. **Test with two accounts** following the verification plan in the implementation plan

---

## Architecture Notes

- **One offer per buyer per listing** — enforced by `@@unique([listingId, buyerId])` constraint. When a buyer's offer reaches a terminal state (rejected/expired/withdrawn), making a new offer deletes the old one first.
- **Structured events, not chat** — `OfferEvent` records form a typed timeline (offer → counter → accept etc.), not free-form messages. This is intentional per PRD.
- **Accept auto-rejects** — When a seller accepts one offer, all other pending/countered offers on that listing are auto-rejected with a notification to those buyers.
- **Listing status progression** — `active` → `negotiating` (after offer accepted) → `sold` (after Phase 4 payment). The "negotiating" state prevents new offers.
