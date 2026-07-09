# Tech Stack Document
## CouponSwap — Peer-to-Peer Coupon & Gift Card Marketplace (Website)

**Version:** 2.0 (Web-only)
**Last Updated:** July 2026

---

## 1. Overview

Website-only for now — one deployable, no app store review delays, faster iteration, and still fully accessible on mobile browsers (responsive design covers the "on-the-go" use case without the overhead of native app builds).

---

## 2. High-Level Architecture

```
┌─────────────────────┐
│   Web App (Next.js)  │  Responsive — works on desktop & mobile browsers
└──────────┬───────────┘
           │ REST/GraphQL over HTTPS
┌──────────▼───────────┐
│   Backend API Server  │  Node.js (NestJS/Express)
│  Auth, Listings, Chat,│
│  Escrow logic, Ratings│
└──────────┬───────────┘
           │
   ┌───────┼─────────────┬──────────────┬─────────────┐
   ▼       ▼             ▼              ▼             ▼
PostgreSQL Redis    Payment Gateway  Web Push      Object Storage
(main DB) (cache/    (Razorpay Route  (via service   (S3/Cloudinary
           queues)    for escrow)      worker)        for images)
```

---

## 3. Frontend (Website)

| Layer | Choice | Why |
|---|---|---|
| Framework | **Next.js (React)** | Server-side rendering + static generation gives you fast page loads and good SEO for listing pages (people searching "cheap Amazon gift card" should be able to find listings via Google). Single framework handles both marketing pages and the app itself. |
| Language | **TypeScript** | Type safety across listings, offers, transactions — reduces bugs in payment-related code. |
| Styling | **Tailwind CSS** | Fast to build with, consistent design system, easy responsive layouts for mobile-browser users. |
| UI components | **shadcn/ui** | Accessible, themeable components (dialogs, forms, dropdowns) without reinventing basics. |
| State/data fetching | **TanStack Query (React Query)** | Server state caching for listings feed, chat polling, offer updates. |
| Forms | **React Hook Form + Zod** | Listing creation, offer forms, validation. |
| Chat UI | **Custom component** or **Stream Chat** (hosted) | Buyer-seller negotiation thread; Stream Chat is a fast shortcut if you don't want to build chat UI/infra yourself. |
| Auth | **NextAuth.js (Auth.js)** with phone/email OTP provider | Handles session management cleanly within Next.js. |
| Notifications | **Web Push API** (via service worker) + **email** (Resend/SendGrid) | Since there's no app, browser push + email covers offer/sale/dispute alerts. |
| Image upload | Direct-to-**Cloudinary** upload widget | For optional coupon photo uploads. |

---

## 4. Backend

| Layer | Choice | Why |
|---|---|---|
| Runtime | **Node.js** | Shared TS types with the Next.js frontend, single language across the stack. |
| Framework | **NestJS** | Structured modules for Auth, Listings, Offers, Chat, Payments, Disputes — scales cleanly as the domain grows. |
| Alternative (leaner MVP) | **Next.js API routes / Route Handlers only** (no separate backend) | If you want the absolute fastest MVP, you can skip a separate NestJS service entirely and put all logic in Next.js API routes + a Postgres DB. Recommended for v1; split into a dedicated backend later if the team/scope grows. |
| API style | **REST** | Simple, clear resources (listings, offers, transactions) — easy to secure and reason about. |
| Real-time chat | **Supabase Realtime** or **Pusher** | Live offer/counter-offer updates without building your own WebSocket server. |
| Background jobs | **Inngest** or **BullMQ + Redis** | Escrow auto-release timers, expiry reminders, dispute SLA timers. Inngest is a good serverless-friendly choice if hosting on Vercel. |
| Payments/Escrow | **Razorpay Route** (or Cashfree split payments) | Supports holding funds and splitting payouts — needed for the escrow-lite flow. |

---

## 5. Database & Storage

| Layer | Choice | Why |
|---|---|---|
| Primary DB | **PostgreSQL** via **Supabase** | Relational data (users, listings, offers, transactions, ratings); Supabase bundles DB + auth + storage + realtime, which covers most MVP needs in one service. |
| ORM | **Prisma** | Type-safe queries, easy migrations. |
| Caching/Queues | **Redis** (via Upstash for serverless-friendly hosting) | Rate limiting, background job queue backing store. |
| File storage | **Cloudinary** | Coupon card images, user avatars, with built-in optimization/transformations. |
| Search | **Postgres full-text search** (MVP) → **Meilisearch/Algolia** (Phase 2) | Start simple; upgrade once listing volume grows. |

---

## 6. Infrastructure & DevOps

| Layer | Choice | Why |
|---|---|---|
| Hosting (frontend + API routes) | **Vercel** | Native home for Next.js — zero-config deploys, previews per PR, edge caching for listing pages. |
| Hosting (separate backend, if used) | **Railway** or **Render** (MVP) → **AWS (ECS/Fargate)** at scale | Low DevOps overhead to launch fast. |
| Hosting (Postgres) | **Supabase** (MVP) → managed **AWS RDS** at scale | Bundled DB/auth/storage/realtime speeds up MVP significantly. |
| Domain/SSL | Any registrar + Vercel auto-SSL | Standard. |
| CI/CD | **GitHub Actions** (or Vercel's built-in git integration) | Lint/test/build pipeline; Vercel auto-deploys on push. |
| Monitoring/Errors | **Sentry** | Crash/error tracking from day one — important for a payments-adjacent product. |
| Analytics | **PostHog** | Funnel tracking: listing created → viewed → offer made → purchased. |

---

## 7. Third-Party Services Summary

| Purpose | Service |
|---|---|
| Payments/Escrow | Razorpay Route (India-first, supports split/hold payments) |
| Realtime chat/offers | Supabase Realtime or Pusher |
| OTP/Auth | Supabase Auth or MSG91 (India-focused SMS OTP) |
| Web push notifications | Web Push API (native browser) |
| Email notifications | Resend or SendGrid |
| Image storage | Cloudinary |
| Error tracking | Sentry |
| Analytics | PostHog |

---

## 8. Suggested Repo Structure

Single Next.js app is enough for MVP — no monorepo needed unless you split out a dedicated backend later:

```
coupon-marketplace/
├── app/                  # Next.js App Router pages
│   ├── (marketing)/      # Landing, about, how-it-works
│   ├── (auth)/           # Login/signup
│   ├── listings/         # Browse, listing detail
│   ├── sell/             # Create listing flow
│   └── dashboard/        # User's listings, offers, transactions
├── components/           # Shared UI components
├── lib/                   # Auth, payment, db helpers
├── prisma/                # Schema & migrations
└── package.json
```

If/when you split into a dedicated NestJS backend (e.g., once real-time/chat/escrow logic grows complex), move to:

```
coupon-marketplace/
├── apps/
│   ├── web/              # Next.js frontend
│   └── backend/          # NestJS API
├── packages/
│   └── types/            # Shared TS types (Listing, Offer, User, Transaction)
└── turbo.json
```

---

## 9. MVP Build Order (Suggested)

1. Auth (OTP login) + user profile
2. Listing CRUD (create/browse/detail) with SEO-friendly listing pages
3. Search & filters
4. Offer/negotiation flow (Supabase Realtime or Pusher)
5. Payment integration + escrow hold/release logic
6. Rating & review system
7. Email/web-push notifications
8. Admin dashboard
9. Dispute flow

---

## 10. Cost Consideration (Rough, MVP stage)

| Service | Approx. Monthly Cost (early stage, low volume) |
|---|---|
| Vercel (hosting) | Free tier (Hobby) → ~$20/mo (Pro) |
| Supabase (DB + auth + storage + realtime) | Free tier → ~$25/mo |
| Razorpay | No fixed cost, % per transaction |
| Sentry | Free tier sufficient early on |
| Resend/SendGrid (email) | Free tier sufficient early on |
| Cloudinary | Free tier sufficient early on |

Total early-stage infra cost: **roughly $0–45/month** before meaningful transaction volume — even leaner than a mobile-app approach since there's no app store fees or build service costs.

---

*This stack prioritizes speed-to-MVP (Next.js + Vercel + Supabase + Razorpay) with SEO built in from day one (important for organic discovery of listings), while keeping a clean upgrade path (dedicated backend, AWS RDS, Algolia) once the product finds traction.*
