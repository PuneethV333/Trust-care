# response.md — Trust Care: Next Steps to Match Project Requirements

Status check against the original PRD, run after the 17-phase MVP build documented in
`report.md`. This lists what's left, grouped by priority, with enough detail to hand each
item to OpenCode/Claude Code as its own phase (Phase 18+).

---

## Priority 1 — Schema/scope gaps (never designed, not just unbuilt)

These three were in the PRD but never made it into `backend.md`'s schema or route map at all
— they need to be designed before an agent can build them.

### 1.1 Helper earnings (view-only)
PRD, Helper Features: *"Track earnings (view-only in Phase 1)."*
- No new model needed — derive from existing data: sum `ServicePlan.price` across the
  requesting helper's `COMPLETED` bookings.
- Add `GET /helpers/me/earnings` — returns total earned, count of completed bookings, and a
  simple breakdown by month. Role:HELPER, cached `helper:earnings:<uid>` TTL 60s, invalidated
  whenever a booking transitions to `COMPLETED`.
- Frontend: read-only card on the helper's `/profile` or a new `/earnings` tab. No editing,
  no payout flow — purely a number the helper can see.

### 1.2 Complaints / dispute resolution
PRD, Admin Features: *"Handle complaints and dispute resolution."*
- New model:
  ```prisma
  enum DisputeStatus {
    OPEN
    IN_REVIEW
    RESOLVED
    DISMISSED
  }

  model Dispute {
    id          String        @id @default(uuid())
    bookingId   String
    booking     Booking       @relation(fields: [bookingId], references: [id])
    raisedById  String        // User.id of whoever filed it (household or helper)
    reason      String
    status      DisputeStatus @default(OPEN)
    resolution  String?
    createdAt   DateTime      @default(now())
    updatedAt   DateTime      @updatedAt

    @@index([status])
    @@index([bookingId])
  }
  ```
- Routes: `POST /bookings/:id/dispute` (either participant on that booking, Auth-guarded with
  an ownership check), `GET /admin/disputes` (Role:ADMIN, filterable by status),
  `PATCH /admin/disputes/:id/resolve` (Role:ADMIN, sets status + resolution note).
- Frontend: a "Report an issue" action on `BookingCard` for completed/cancelled bookings, and
  a new "Disputes" tab in the admin dashboard alongside Overview/Pending/Users/Bookings.

### 1.3 Availability as a search filter
PRD, User Features: search & filter by *"Availability."* Currently `availability` is stored
and shown on a helper's profile, but `GET /helpers` doesn't filter by it.
- Simplest correct approach: add optional `day` (e.g. `mon`) and `timeSlot` (e.g. `morning` /
  `afternoon` / `evening`) query params to `GET /helpers`. Filtering on JSON in Postgres is
  fine at this scale — a `WHERE availability->>'mon' IS NOT NULL`-style Prisma raw filter, or
  simpler: fetch the `VERIFIED` set (already indexed) and filter the availability JSON in
  application code, since the pool of verified helpers per city is small for an MVP.
- Update the `helpers:search:<md5(query)>` cache key to include these params (it already
  hashes the full querystring, so no cache-invalidation change needed — just add the params to
  the search form).
- Frontend: add a day/time-of-day picker to the `/search` filter form.

---

## Priority 2 — Backend exists, no UI (the practical blocker to a real demo)

These already have working, documented backend routes. Nothing here requires new design —
it's UI work only, but it's the difference between "the loop works with seeded data" and
"a real user can complete the loop."

### 2.1 Verification document upload — **do this first**
Without this, a real (non-seeded) helper can never get verified, which means the admin
verification queue and the entire "verified helpers only" search/booking flow can't be
exercised end-to-end by an actual user. This is the single most important item on this list.
- Uses the existing `POST /uploads/signature` + `POST /helpers/me/documents` routes.
- Frontend: a document upload step in helper onboarding (or a dedicated section on the
  helper's profile page if onboarding is already past that point) — file picker → direct
  Cloudinary upload using the signature → POST the returned `secure_url` to
  `/helpers/me/documents` with a `docType` (`ID_PROOF` / `ADDRESS_PROOF`).
- Show upload status (pending/verified/rejected per document) so a helper knows what's
  missing.

### 2.2 Service-plan CRUD (helper self-service)
- Uses existing `POST/PATCH/DELETE /service-plans`.
- Frontend: a "My Plans" section on the helper's profile — list existing plans, add new
  (planType, price, description), edit, delete. Reuse the `ServicePlan` Zod schema already
  mirrored in `schemas/`.

### 2.3 Availability editor
- Uses existing `PATCH /helpers/me/availability`.
- Frontend: a simple weekly grid (day × rough time slots) that a helper can toggle, submitted
  as the same JSON shape already used for display (`{ "mon": ["09:00-13:00"], ... }`).

### 2.4 Avatar upload
- Same Cloudinary signature flow as 2.1, applied to `avatarUrl` on both `HouseholdProfile`
  and `HelperProfile` via the existing `PATCH /users/me` / `PATCH /helpers/me` routes.
- Frontend: an avatar upload control on the `/profile` edit forms built in Phase 17.

---

## Priority 3 — Deliverable not yet produced

### 3.1 Deployment-ready build
PRD Deliverables explicitly list this; current state is local-only (`npm run dev` /
`start:dev`).
- Backend: containerize (`Dockerfile`, multi-stage build → `dist/` + `prisma generate` at
  build time) or deploy straight to a Node host; needs a managed Postgres + Redis (e.g. a
  free-tier Postgres + Redis instance) with `DATABASE_URL`/`REDIS_URL` set as real env vars,
  not `.env.example`.
- Frontend: static build (`npm run build`) deployed to Vercel or Netlify per the PRD's
  suggested stack, with `VITE_API_BASE_URL` pointed at the deployed backend and
  `VITE_FIREBASE_*` set to the real Firebase project's web config.
- Don't reuse dev Firebase/Cloudinary credentials for a public deployment without checking
  their usage limits and CORS/authorized-domains settings.

---

## Priority 4 — KPIs not yet computed

PRD lists six KPIs; `GET /admin/analytics` currently covers four (households, verified
helpers, bookings by status, avg rating). Missing:
- **Helper reliability score** — needs a definition before it can be built (candidates:
  `completed / (completed + cancelled + rejected)` per helper, or a rolling window). Pick a
  formula, add it to the helper's `GET /helpers/:id` response and as an aggregate on
  `/admin/analytics`.
- **Monthly active users** — needs a definition of "active" (e.g. logged in, or created/
  accepted a booking, within the last 30 days) since there's no session/login-event table
  yet. Simplest MVP version: count distinct users with a `Booking` (as household or helper)
  or a `User.updatedAt` touch in the last 30 days — good enough without adding new tracking
  infrastructure.

---

## Priority 5 — Housekeeping

- ~~Resolve the naming split~~ — **done**: product name is **Trust Care** everywhere (app copy,
  `<title>`, Swagger). `AGENTS.md` updated so it can't drift again on the next phase.
- Two off-plan commits happened outside the 17-phase list (`chore: moved agents/skills to
  repo root`, `chore: prettier formatting on prisma config`) — harmless, but worth noting
  these weren't reviewed as part of a numbered phase the way everything else was.

---

## Suggested order

1. **2.1** (verification documents) — unblocks a real end-to-end user loop.
2. **1.1, 1.2, 1.3** (earnings, disputes, availability filter) — closes the PRD scope gaps.
3. **2.2, 2.3, 2.4** (plans/availability/avatar self-service UI) — rounds out helper
   self-service now that the schema/routes for 1.1–1.3 exist alongside them.
4. **4** (reliability score, MAU) — needs 1.2's dispute/cancellation data and more booking
   history to be meaningful, so do this after the loop is fully exercisable.
5. **3.1** (deployment) — last, once the feature set is actually final.
6. **5** (naming, commit hygiene) — anytime, doesn't block anything else.

Each numbered item above is scoped to be handed to a coding agent as a single phase, the same
way `backend.md`/`frontend.md` phases were — one phase, one commit, `npm run build` passing
before committing, per `agents.md` §0.