# Implementation Plan
## CouponSwap — Peer-to-Peer Coupon & Gift Card Marketplace (Website)

**Version:** 1.0
**Last Updated:** July 2026
**Based on:** PRD.md, tech-stack.md

---

## 1. Guiding Principles for This Build

1. **Ship the escrow/payment flow correctly before anything else scales** — this is the trust backbone of the whole product. Don't add features on top of a shaky payment flow.
2. **Build vertically, not horizontally** — get one full listing → offer → payment → release flow working end-to-end early (even ugly), rather than perfecting each layer in isolation.
3. **Solo-builder friendly** — this plan assumes you (Aditya) are building mostly alone or with a very small team, so it avoids over-engineering (no separate backend service until you actually need it — see tech-stack.md's "leaner MVP" option).
4. **Re-use before you build** — Supabase, Razorpay, Resend, Cloudinary etc. exist specifically so you don't build auth/payments/email from scratch. Don't reinvent them.

---

## 2. Phase Breakdown

### Phase 0 — Setup & Foundations (Week 1)

**Goal:** Dev environment ready, core infra provisioned, nothing user-facing yet.

- [ ] Set up GitHub repo (Next.js + TypeScript + Tailwind + shadcn/ui template)
- [ ] Create Supabase project (Postgres + Auth + Storage + Realtime)
- [ ] Design initial Prisma schema (see Section 4 below) and run first migration
- [ ] Set up Vercel project, connect to GitHub, confirm auto-deploy on push works
- [ ] Set up Sentry (error tracking) — connect from day one, not as an afterthought
- [ ] Set up Razorpay test/sandbox account
- [ ] Create `.env.example` and document all required environment variables
- [ ] Write a one-page internal README: how to run locally, how to deploy, where secrets live

**Exit criteria:** A blank Next.js app is deployed on Vercel, connected to a real (empty) Supabase DB, with a working "Hello World" page and Sentry capturing a test error.

---

### Phase 1 — Auth & User Profiles (Week 2)

**Goal:** A user can sign up, log in, and has a profile.

- [ ] Phone/email OTP login via Supabase Auth
- [ ] User profile table: name, avatar, rating (default 0/empty), joined date
- [ ] Basic profile page (view/edit own profile)
- [ ] Protected routes middleware (redirect to login if not authenticated)

**Exit criteria:** You can sign up with your own phone number, log out, log back in, and see your profile.

---

### Phase 2 — Listings (Weeks 3–4)

**Goal:** Sellers can create listings; anyone can browse them.

- [ ] Listing creation form: brand, category, face value, asking price, expiry date, coupon type (code/physical), optional image upload (Cloudinary)
- [ ] Listing detail page (public, SEO-friendly URL e.g. `/listings/[id]-[slug]`)
- [ ] Browse/search page with filters: brand, category, discount %, expiry soon
- [ ] Basic Postgres full-text search on brand/category (per tech-stack.md, upgrade to Algolia/Meilisearch later)
- [ ] "My Listings" dashboard tab (seller's own view — edit/delete/mark sold)

**Exit criteria:** You can create a listing, see it appear in the browse page, filter for it, and open its detail page from a fresh (logged-out) browser tab to confirm it's publicly viewable.

---

### Phase 3 — Offers & Negotiation (Week 5)

**Goal:** Buyers can make offers; sellers can counter or accept.

- [ ] Offer data model: linked to listing, buyer, amount, status (pending/countered/accepted/rejected/expired)
- [ ] "Make an Offer" flow on listing detail page
- [ ] Realtime offer/counter-offer thread (Supabase Realtime) — simple structured messages, not free-form chat, to start
- [ ] Notifications on new offer/counter (in-app + email via Resend)
- [ ] Seller can accept an offer → triggers Phase 4 payment flow

**Exit criteria:** Two test accounts (buyer + seller) can go back and forth on price and reach an "accepted" state.

---

### Phase 4 — Payment & Escrow Flow (Weeks 6–7) — **Highest Priority Phase**

**Goal:** Money moves safely; code is only revealed after payment; disputes have a path.

- [ ] Razorpay Route integration: buyer pays into platform-held balance
- [ ] Transaction state machine: `pending_payment → paid_held → code_revealed → confirmed → released` (or `disputed → refunded`)
- [ ] Code/card details stored encrypted at rest, decrypted and shown only to the paying buyer post-payment
- [ ] Confirmation window logic (e.g., buyer has 2 hours to confirm code works) — background job via Inngest/BullMQ for auto-release
- [ ] "Report a problem" button → creates a dispute ticket, halts auto-release
- [ ] Basic dispute queue (even a simple internal admin table/page is fine for MVP — doesn't need to be pretty yet)
- [ ] Commission calculation and payout logic (deduct platform %, release rest to seller)

**Exit criteria:** A full test transaction — pay, reveal code, confirm, seller gets paid minus commission — completes successfully with real (test-mode) Razorpay calls. Also test the dispute path once.

**⚠️ Do not proceed to Phase 5 until this phase is solid and tested with edge cases (buyer never confirms, buyer disputes, payment fails midway).**

---

### Phase 5 — Ratings & Trust Signals (Week 8)

**Goal:** Reputation system live so future users can trust each other.

- [ ] Post-transaction rating (1–5 stars) + optional comment, both directions (buyer rates seller, seller rates buyer)
- [ ] Display average rating + transaction count on profile and listing cards
- [ ] Basic abuse safeguard: flag accounts with multiple disputes for manual review

**Exit criteria:** After a completed transaction, both parties are prompted to rate, and the rating shows up on the other's public profile.

---

### Phase 6 — Admin & Ops Tools (Week 9)

**Goal:** You (the operator) can actually run the platform day-to-day.

- [ ] Simple admin dashboard (can be a protected route in the same Next.js app, gated by an `isAdmin` flag)
- [ ] View all users, listings, transactions
- [ ] Dispute resolution screen: view evidence, manually refund or release funds
- [ ] Manual listing takedown (for ToS violations / brand requests, per PRD legal notes)

**Exit criteria:** You can resolve a simulated dispute end-to-end without touching the database directly.

---

### Phase 7 — Closed Beta (Weeks 10–11)

**Goal:** Real users, real (small) transactions, controlled environment.

- [ ] Invite 20–50 real users (friends, classmates, relevant online communities)
- [ ] Set low transaction limits initially (e.g., cap listing value) to limit fraud exposure while trust systems are unproven
- [ ] Actively monitor every transaction manually for the first 1–2 weeks
- [ ] Collect feedback via a simple form/survey after each transaction
- [ ] Track the metrics defined in PRD Section 3 (listings created, successful transactions, dispute rate)

**Exit criteria:** At least 20 completed transactions with a dispute rate under the PRD's 3% target, and no critical payment bugs found.

---

### Phase 8 — Public Launch (Week 12+)

**Goal:** Open signups, start marketing.

- [ ] Remove beta invite-gate
- [ ] Finalize legal pages (Terms of Service, Privacy Policy, Refund/Dispute Policy) — get at least a basic legal review given the payment/escrow nature of the product
- [ ] SEO pass on listing/category pages (this is a real acquisition channel per tech-stack.md — don't skip it)
- [ ] Soft launch marketing (relevant communities, social media, maybe a Product Hunt-style launch)
- [ ] Keep the Phase 2 features (bulk upload, brand balance verification API, smart pricing) as your post-launch roadmap, not pre-launch blockers

---

## 3. Suggested Timeline Summary

| Phase | Duration | Weeks |
|---|---|---|
| 0. Setup & Foundations | 1 week | 1 |
| 1. Auth & Profiles | 1 week | 2 |
| 2. Listings | 2 weeks | 3–4 |
| 3. Offers & Negotiation | 1 week | 5 |
| 4. Payment & Escrow | 2 weeks | 6–7 |
| 5. Ratings & Trust | 1 week | 8 |
| 6. Admin & Ops Tools | 1 week | 9 |
| 7. Closed Beta | 2 weeks | 10–11 |
| 8. Public Launch | ongoing | 12+ |

**Total to public launch: ~12 weeks**, assuming steady part-time-to-full-time solo/small-team effort. Adjust based on your actual available hours — the phase *order* matters more than hitting these exact durations.

---

## 4. Initial Data Model (Prisma Schema Sketch)

This isn't final, but gives you a concrete starting point for Phase 0:

```prisma
model User {
  id            String   @id @default(uuid())
  phone         String   @unique
  name          String?
  avatarUrl     String?
  ratingAvg     Float    @default(0)
  ratingCount   Int      @default(0)
  isAdmin       Boolean  @default(false)
  createdAt     DateTime @default(now())

  listings      Listing[]
  offersMade    Offer[]      @relation("BuyerOffers")
  transactions  Transaction[] @relation("BuyerTransactions")
  soldTransactions Transaction[] @relation("SellerTransactions")
}

model Listing {
  id            String   @id @default(uuid())
  sellerId      String
  seller        User     @relation(fields: [sellerId], references: [id])
  brand         String
  category      String
  faceValue     Decimal
  askingPrice   Decimal
  expiryDate    DateTime
  couponType    String   // "code" | "physical"
  encryptedCode String?  // encrypted at rest, revealed post-payment
  imageUrl      String?
  status        String   @default("active") // active | sold | removed
  createdAt     DateTime @default(now())

  offers        Offer[]
  transaction   Transaction?
}

model Offer {
  id          String   @id @default(uuid())
  listingId   String
  listing     Listing  @relation(fields: [listingId], references: [id])
  buyerId     String
  buyer       User     @relation("BuyerOffers", fields: [buyerId], references: [id])
  amount      Decimal
  status      String   @default("pending") // pending | countered | accepted | rejected | expired
  createdAt   DateTime @default(now())
}

model Transaction {
  id              String   @id @default(uuid())
  listingId       String   @unique
  listing         Listing  @relation(fields: [listingId], references: [id])
  buyerId         String
  buyer           User     @relation("BuyerTransactions", fields: [buyerId], references: [id])
  sellerId        String
  seller          User     @relation("SellerTransactions", fields: [sellerId], references: [id])
  amount          Decimal
  commission      Decimal
  status          String   // pending_payment | paid_held | code_revealed | confirmed | released | disputed | refunded
  codeRevealedAt  DateTime?
  confirmDeadline DateTime?
  createdAt       DateTime @default(now())
}

model Rating {
  id            String   @id @default(uuid())
  transactionId String
  raterId       String
  ratedId       String
  score         Int      // 1-5
  comment       String?
  createdAt     DateTime @default(now())
}
```

---

## 5. Risk Register (Watch These Closely)

| Risk | Mitigation |
|---|---|
| Buyer pays, seller's code is already used | Escrow reveal + confirmation window + dispute path (Phase 4) |
| Duplicate resale of same code to multiple buyers | Code hidden until payment; mark listing "sold" immediately on payment capture, before reveal |
| Payment gateway compliance for escrow-like holding | Use Razorpay Route (built for split/hold payments) rather than a plain payment gateway; consult a professional on RBI compliance before real-money launch |
| Brand ToS/legal pushback on resale | Manual takedown tool (Phase 6) + clear ToS (Phase 8) |
| Low trust slows adoption early on | Closed beta with manual monitoring (Phase 7) before opening publicly |
| Solo-builder burnout / scope creep | Stick to phase order; resist adding Phase 2/3 PRD features before Phase 4 (payments) is rock-solid |

---

## 6. What NOT to Do

- Don't build the admin dashboard before the payment flow — you won't have real disputes to manage yet.
- Don't add bulk upload, brand API verification, or smart pricing (PRD Phase 2 features) before public launch — they're optimizations, not blockers.
- Don't skip the confirmation-window/dispute logic "for now" — this is the single most common failure mode for coupon resale platforms and is much harder to retrofit later.
- Don't over-invest in a custom chat UI early — structured offer/counter-offer messages are enough for MVP; free-form chat can come later if users ask for it.

---

*Update this plan as phases complete or priorities shift — treat it as a living checklist, not a fixed contract.*
