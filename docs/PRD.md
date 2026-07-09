# Product Requirements Document (PRD)
## CouponSwap (working title) — Peer-to-Peer Coupon & Gift Card Resale Marketplace (Website)

**Version:** 1.0
**Status:** Draft
**Owner:** Aditya
**Last Updated:** July 2026

---

## 1. Problem Statement

Every year, billions of dollars in gift cards, coupons, and vouchers go unused or expire because the holder doesn't need them, doesn't like the brand, or forgets about them. Meanwhile, other people would happily use a discount at a brand they already shop at — if they could get it cheaper than face value.

There is no simple, trustworthy, India-first platform where:
- A person holding an unused coupon/gift card can **recover some value** instead of losing 100% of it.
- A buyer can **save money** by purchasing a coupon below face value.
- Both parties can **negotiate price** directly, like a mini-marketplace/OLX for coupons.

## 2. Vision

A safe, simple, responsive website where unused coupons and gift cards find a second owner — turning "wasted value" into "shared value," with price negotiation built into the core experience (not just fixed-price listings). Works well on both desktop and mobile browsers, so no native app is required.

## 3. Goals & Success Metrics

### Primary Goals (MVP)
- Let sellers list a coupon/gift card in under 2 minutes.
- Let buyers discover, negotiate, and purchase safely.
- Ensure neither party can be cheated (fake/used codes, non-payment) via an escrow-style flow.

### Success Metrics (first 90 days post-launch)
| Metric | Target |
|---|---|
| Listings created | 500+ |
| Successful transactions | 150+ |
| Buyer-reported "code didn't work" rate | < 3% |
| Avg. time from listing to sale | < 5 days |
| Repeat sellers/buyers | > 20% |

## 4. Target Users

| Persona | Description | Need |
|---|---|---|
| **The Unused-Coupon Holder** | Got a gift card as a gift, reward, or promo they won't use | Recover some cash instead of losing it |
| **The Bargain Buyer** | Regularly shops at certain brands (Amazon, Swiggy, Myntra, Zomato, etc.) | Wants the same purchase at a discount |
| **The Reseller (power user)** | Buys coupons in bulk cheap, resells at small markup | Needs bulk listing tools, analytics |

## 5. Core User Stories

**Seller**
- As a seller, I want to list a coupon with brand, value, discount %, and expiry so buyers can find it.
- As a seller, I want to set a fixed price OR allow offers/bargaining.
- As a seller, I want my payout released only after the buyer confirms the code worked, to protect me from disputes — actually, I want protection *from* buyers falsely claiming it didn't work.
- As a seller, I want to see and respond to buyer offers in a chat-like thread.

**Buyer**
- As a buyer, I want to search/filter coupons by brand, category, discount %, and expiry.
- As a buyer, I want to make an offer below the asking price.
- As a buyer, I want assurance that the code is valid before my money is released to the seller.
- As a buyer, I want to report a bad code and get a refund through a dispute process.

**Both**
- As a user, I want in-app chat to negotiate price.
- As a user, I want push notifications for offers, counter-offers, and sale confirmations.
- As a user, I want to see seller/buyer ratings before transacting.

## 6. Feature Scope

### 6.1 MVP (Phase 1)
- Auth: Phone/email OTP login
- User profile with rating (post-transaction)
- Create listing: brand, category, face value, asking price, expiry date, coupon type (code / physical card), optional photo of the card
- Browse/search/filter listings (brand, category, discount %, expiry soon)
- Listing detail page with "Buy Now" and "Make an Offer"
- In-app chat per listing for negotiation (offer/counter-offer as structured chat messages, not just free text)
- Escrow-lite payment flow:
  1. Buyer pays into platform-held balance
  2. Seller reveals code/card details only after payment confirmation
  3. Buyer has a fixed window (e.g., 30 min–2 hrs) to confirm code works
  4. Auto-release to seller if no dispute raised in window
  5. Dispute flow → manual review/support ticket
- Basic seller/buyer rating & review after transaction
- Notifications (web push + email + in-app) for offers, sales, disputes
- Admin dashboard (basic): view users, listings, transactions, disputes

### 6.2 Phase 2 (Post-MVP)
- Automated gift card balance verification via brand APIs (where available)
- Bulk upload for power sellers (CSV)
- Category-specific expiry alerts ("your coupon expires in 3 days — drop the price?")
- Smart price suggestions based on brand + historical resale data
- Wallet system (in-app balance, withdraw to bank/UPI)
- Referral program
- "Auto-accept offers above X%" setting for sellers

### 6.3 Phase 3 (Growth)
- Progressive Web App (PWA) support — installable "app-like" experience straight from the browser, if mobile engagement demands it, without building a separate native app
- Brand partnerships (official resale channel for expiring promo codes)
- Subscription tier for power resellers (lower commission, analytics)
- AI-based fraud detection on listings/patterns

## 7. Out of Scope (for MVP)
- Physical card shipping/logistics (start with digital codes only to reduce complexity)
- International currency support (start India-only, INR)
- Full KYC (start with phone verification; add KYC only if fraud/regulatory need arises)

## 8. Trust & Safety (Critical)

This is the make-or-break part of the product. Key mechanisms:

1. **Escrow-first payments** — buyer's money is never released to seller until confirmation window passes or buyer confirms.
2. **One-time code reveal** — the actual coupon code is hidden until payment is captured, and shown only to the paying buyer, to prevent one code being "shown" and reused.
3. **Rating system** — sellers/buyers with low ratings or repeated disputes get flagged/restricted.
4. **Dispute resolution SLA** — target: initial response within 24 hours.
5. **Listing verification (Phase 2)** — auto-check balance via brand API where supported (e.g., some retail gift cards support balance-check endpoints).
6. **Rate limiting** — prevent a single account from listing/buying at abusive volume without verification.

## 9. Monetization

- **Commission per transaction**: 5–10% of sale price, charged to the seller (industry norm for resale marketplaces).
- **Optional buyer convenience fee**: small flat fee for instant/no-negotiation "Buy Now" purchases.
- **Phase 2**: Featured/boosted listings, premium seller subscription.

## 10. Legal & Compliance Notes (non-exhaustive — consult a lawyer before launch)
- Many gift cards/coupons have terms prohibiting resale or transfer. This is a known industry risk (see CardCash, Raise, GiftCash operating in this exact grey area) — mitigate by:
  - Clear ToS stating users are responsible for ensuring their coupon is transferable.
  - Takedown process if a brand requests removal of their listings.
- Payment aggregator compliance (RBI guidelines in India for escrow-like flows — using a payment gateway with proper nodal/escrow account support, e.g., Razorpay Route, is important for launch legality).
- GST implications on commission revenue.

## 11. Open Questions
- Do we support **physical** gift cards (with shipping) in v1, or digital-only?
- Do we allow **partial redemption** coupons (e.g., a $50 card with $30 left)?
- What's the dispute resolution window — instant auto-release risk vs. buyer complaint window trade-off?
- Do we need KYC for high-value transactions to control fraud?

## 12. Milestones (suggested)

| Phase | Timeline | Deliverable |
|---|---|---|
| Design & spec | Week 1–2 | Finalized PRD, wireframes, tech stack |
| MVP build | Week 3–8 | Core app: listing, browse, chat, escrow payment |
| Closed beta | Week 9–10 | 50–100 test users, bug fixes |
| Public launch | Week 11+ | Marketing push, monitor metrics |

---
*This document is a living draft — update as decisions are made on open questions.*
