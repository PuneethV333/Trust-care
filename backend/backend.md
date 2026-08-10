# backend.md — NestJS API

Read `AGENTS.md` first for the auth flow and the current repo state. This file covers backend
implementation detail only. §8 is the canonical Prisma schema — the contract both backend and
frontend types must match.

---

## 1. Project structure (module per entity)

```
src/
  main.ts                  # bootstrap, swagger, global pipes, helmet, CORS
  app.module.ts
  common/
    guards/firebase-auth.guard.ts
    guards/roles.guard.ts
    decorators/roles.decorator.ts
    decorators/current-user.decorator.ts
    filters/http-exception.filter.ts
    pipes/zod-validation.pipe.ts   # or rely on nestjs-zod's ZodValidationPipe globally
  config/
    firebase.config.ts
    redis.config.ts
    cloudinary.config.ts
  prisma/
    prisma.service.ts
    prisma.module.ts
  redis/
    redis.service.ts        # get/set/del/invalidate-by-prefix helpers
    redis.module.ts
  modules/
    auth/
    users/
    helpers/
    service-plans/
    bookings/
    reviews/
    uploads/
    admin/
```

Each module folder: `*.module.ts`, `*.controller.ts`, `*.service.ts`, `dto/*.zod.ts`.

---

## 2. Environment variables (`.env`, never committed — `.env.example` checked in with blanks)

```
DATABASE_URL=
REDIS_URL=

FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

PORT=3000
CLIENT_URL=http://localhost:5173
```

Firebase Admin SDK is initialized once in `config/firebase.config.ts` from these three vars
(private key needs `.replace(/\\n/g, '\n')` since env files escape newlines).

---

## 3. Auth guard

`FirebaseAuthGuard` reads `Authorization: Bearer <idToken>`, calls
`admin.auth().verifyIdToken(token)`, attaches `{ firebaseUid, email }` to `request.user`.
`RolesGuard` (paired with `@Roles(Role.HELPER)` decorator) then loads the `User` row (cached,
see §5) and checks `role`. Both guards are applied globally; `/auth/sync` requires a valid
token but no role, and `/helpers` GET search/detail routes are public reads.

---

## 4. Route Map

Legend — **Auth**: `Public` / `Auth` (valid Firebase token only) / `Role:X` (token + role check).
**Cache**: Redis key pattern and TTL, or `—` if not cached. **Rate limit**: requests per window
per client (IP for public, uid for authenticated), enforced via `@nestjs/throttler` with a
named throttler override per route (`@Throttle({ default: { limit, ttl } })`).

### Auth module

| Method | Path | Handler | Auth | Cache | Rate limit |
|---|---|---|---|---|---|
| POST | `/auth/sync` | `syncFirebaseUser` | Auth (token required, no role yet) | — | 10 / 60s |

`syncFirebaseUser`: find `User` by `firebaseUid`; create with `role: HOUSEHOLD` if missing;
return `{ id, role, onboardingCompleted }`.

### Users module (household)

| Method | Path | Handler | Auth | Cache | Rate limit |
|---|---|---|---|---|---|
| POST | `/users/onboarding` | `completeHouseholdOnboarding` | Auth | invalidates `user:me:<uid>` | 10 / 60s |
| GET | `/users/me` | `getCurrentUser` | Auth | `user:me:<uid>` TTL 60s | 60 / 60s |
| PATCH | `/users/me` | `updateHouseholdProfile` | Role:HOUSEHOLD | invalidates `user:me:<uid>` | 20 / 60s |

### Helpers module

| Method | Path | Handler | Auth | Cache | Rate limit |
|---|---|---|---|---|---|
| POST | `/helpers/onboarding` | `completeHelperOnboarding` | Auth | invalidates `user:me:<uid>` | 10 / 60s |
| GET | `/helpers/me` | `getMyHelperProfile` | Role:HELPER | `helper:me:<uid>` TTL 60s | 60 / 60s |
| GET | `/helpers/me/earnings` | `getEarnings` (total earned, completed count, monthly breakdown, per-booking list with open-dispute flag from COMPLETED bookings) | Role:HELPER | `helper:earnings:<uid>` TTL 60s | 60 / 60s |
| PATCH | `/helpers/me` | `updateHelperProfile` | Role:HELPER | invalidates `helper:me:<uid>`, `helper:profile:<id>`, `helpers:search:*` | 20 / 60s |
| PATCH | `/helpers/me/availability` | `updateAvailability` | Role:HELPER | invalidates `helper:me:<uid>`, `helper:profile:<id>`, `helpers:search:*` | 20 / 60s |
| GET | `/helpers` | `searchHelpers` (query: `type`, `city`, `minExperience`, `planType`, `day`, `timeSlot`, `page`) | Public | `helpers:search:<md5(querystring)>` TTL 120s | 60 / 60s |
| GET | `/helpers/:id` | `getHelperById` | Public | `helper:profile:<id>` TTL 300s | 60 / 60s |
| POST | `/helpers/me/documents` | `uploadVerificationDocument` (stores Cloudinary url returned by client after signed upload) | Role:HELPER | invalidates `helper:me:<uid>` | 10 / 60s |

`helpers:search:*` invalidation = delete-by-prefix via `redis.service`'s `SCAN` + `DEL` helper
(Redis has no native prefix TTL group, so keep a small `redis.deleteByPrefix('helpers:search:')`
utility rather than tracking individual keys).

### Service Plans module

| Method | Path | Handler | Auth | Cache | Rate limit |
|---|---|---|---|---|---|
| POST | `/service-plans` | `createServicePlan` | Role:HELPER | invalidates `service-plans:helper:<helperId>`, `helper:profile:<helperId>` | 20 / 60s |
| GET | `/service-plans/helper/:helperId` | `getPlansByHelper` | Public | `service-plans:helper:<helperId>` TTL 300s | 60 / 60s |
| PATCH | `/service-plans/:id` | `updateServicePlan` | Role:HELPER (owner check) | invalidates `service-plans:helper:<helperId>`, `helper:profile:<helperId>` | 20 / 60s |
| DELETE | `/service-plans/:id` | `deleteServicePlan` | Role:HELPER (owner check) | invalidates `service-plans:helper:<helperId>`, `helper:profile:<helperId>` | 10 / 60s |

### Bookings module

| Method | Path | Handler | Auth | Cache | Rate limit |
|---|---|---|---|---|---|
| POST | `/bookings` | `createBooking` | Role:HOUSEHOLD | invalidates `bookings:me:<householdUid>`, `bookings:me:<helperUid>` | 15 / 60s |
| GET | `/bookings/me` | `getMyBookings` (role-aware: household sees own bookings, helper sees assigned) | Auth | `bookings:me:<uid>` TTL 30s | 60 / 60s |
| GET | `/bookings/:id` | `getBookingById` (participant-only check) | Auth | — | 60 / 60s |
| PATCH | `/bookings/:id/accept` | `acceptBooking` | Role:HELPER (owner check) | invalidates both `bookings:me:*` involved | 20 / 60s |
| PATCH | `/bookings/:id/reject` | `rejectBooking` | Role:HELPER (owner check) | invalidates both `bookings:me:*` involved | 20 / 60s |
| PATCH | `/bookings/:id/cancel` | `cancelBooking` | Role:HOUSEHOLD (owner check) | invalidates both `bookings:me:*` involved | 20 / 60s |
| PATCH | `/bookings/:id/complete` | `completeBooking` | Role:HELPER or Role:ADMIN | invalidates both `bookings:me:*` involved | 20 / 60s |
| POST | `/bookings/:id/dispute` | `createDispute` (participant on a completed/cancelled booking, one open dispute per booking) | Role:HELPER or Role:HOUSEHOLD | — | 10 / 60s |

Status transitions are enforced in the service layer as a strict state machine:
`PENDING → ACCEPTED|REJECTED`, `ACCEPTED → ONGOING|CANCELLED`, `ONGOING → COMPLETED|CANCELLED`.
Any other transition throws `400 Bad Request`.

### Reviews module

| Method | Path | Handler | Auth | Cache | Rate limit |
|---|---|---|---|---|---|
| POST | `/reviews` | `createReview` (only if booking `status = COMPLETED` and no existing review) | Role:HOUSEHOLD (owner check) | invalidates `reviews:helper:<helperId>`, `helper:profile:<helperId>`, `reviews:me:<householdUid>` | 10 / 60s |
| GET | `/reviews/helper/:helperId` | `getHelperReviews` | Public | `reviews:helper:<helperId>` TTL 300s | 60 / 60s |
| GET | `/reviews/me` | `getMyReviews` (role-aware: household = sent reviews + bookings awaiting review; helper = received reviews + bookings awaiting review) | Role:HOUSEHOLD or Role:HELPER | `reviews:me:<uid>` TTL 30s | 60 / 60s |

On create, also recompute and persist `ratingAvg`/`ratingCount` on `HelperProfile` in the same
transaction.

### Uploads module

| Method | Path | Handler | Auth | Cache | Rate limit |
|---|---|---|---|---|---|
| POST | `/uploads/signature` | `getCloudinarySignature` (returns `timestamp`, `signature`, `apiKey`, `cloudName`, `folder`) | Auth | — | 20 / 60s |

Frontend uploads directly to Cloudinary with this signature; backend never proxies file bytes.

### Admin module

| Method | Path | Handler | Auth | Cache | Rate limit |
|---|---|---|---|---|---|
| GET | `/admin/helpers/pending` | `getPendingHelpers` | Role:ADMIN | — (admin views stay fresh, no cache) | 50 / 60s |
| PATCH | `/admin/helpers/:id/verify` | `verifyHelper` | Role:ADMIN | invalidates `helper:profile:<id>`, `helpers:search:*` | 30 / 60s |
| PATCH | `/admin/helpers/:id/reject` | `rejectHelper` | Role:ADMIN | invalidates `helper:profile:<id>`, `helpers:search:*` | 30 / 60s |
| GET | `/admin/users` | `listUsers` (paginated) | Role:ADMIN | — | 50 / 60s |
| GET | `/admin/bookings` | `listAllBookings` (paginated, filterable by status) | Role:ADMIN | — | 50 / 60s |
| GET | `/admin/disputes` | `listDisputes` (paginated, filterable by status) | Role:ADMIN | — | 50 / 60s |
| PATCH | `/admin/disputes/:id/resolve` | `resolveDispute` (sets status + resolution note) | Role:ADMIN | — | 30 / 60s |
| GET | `/admin/analytics` | `getPlatformAnalytics` (counts: households, verified helpers, bookings by status, avg rating) | Role:ADMIN | `admin:analytics` TTL 600s | 30 / 60s |

---

## 5. Redis usage summary

- Client: `ioredis`, wrapped in `RedisService` with `get<T>`, `set(key, value, ttlSeconds)`,
  `del(key)`, `deleteByPrefix(prefix)`.
- Cache-aside pattern everywhere: service checks Redis first, falls back to Prisma, then
  populates Redis on miss.
- `user:me:<uid>` and `helper:me:<uid>` TTLs are short (60s) since these are read on nearly
  every page load and change rarely — cheap to refetch on the rare mutation.
- `helpers:search:*` and profile/plan/review caches are longer (120–300s) since they're public,
  high-read, low-write.
- `bookings:me:<uid>` is short (30s) because booking status changes are user-facing and should
  feel near-real-time.
- `admin:analytics` is the longest (600s) — it's an aggregate dashboard number, not
  transactional data.
- Global default throttler (applied in `app.module.ts` via `ThrottlerModule.forRoot`):
  **100 requests / 60s per IP**, with the per-route overrides above taking precedence.

---

## 6. Swagger

- `main.ts`: `SwaggerModule.setup('api/docs', app, document)` using `DocumentBuilder` with
  title `Helper4U API`, bearer auth scheme (`addBearerAuth()`).
- Every controller gets `@ApiTags('helpers')` etc.
- DTOs are defined once as Zod schemas and wrapped with `nestjs-zod`'s `createZodDto` — this
  gives you request validation **and** OpenAPI schema generation from a single definition. Do
  not write parallel `class-validator` DTOs.
- Every route handler gets `@ApiOperation({ summary })` and `@ApiResponse` for the success and
  main error cases (401/403/404/400) so `/api/docs` is a complete, accurate reference —
  this is a requirement, not a nice-to-have, since it's the project's PRD deliverable ("PRD &
  technical documentation").

---

## 7. Error handling

Global `HttpExceptionFilter` returns a consistent shape:
```json
{ "statusCode": 404, "message": "Helper not found", "error": "Not Found", "path": "/helpers/xyz" }
```
Zod validation failures are caught by `nestjs-zod`'s built-in exception handling and return
`400` with a field-level error array — do not hand-roll this.

---

## 8. Canonical Prisma schema (target model — apply during Phase 1)

The current `prisma/schema.prisma` is still the scaffold `User` placeholder. Replace it with
this model during Phase 1 (matching the repo's Prisma 7 setup: generator `prisma-client`,
`output = "../generated/prisma"`, `moduleFormat = "cjs"` — see `AGENTS.md` §2 for why, and the
required driver adapter in `src/prisma/prisma.service.ts`).
If a feature needs a field not listed here, add it to this contract first, then implement.

```prisma
generator client {
  provider     = "prisma-client"
  output       = "../generated/prisma"
  moduleFormat = "cjs"
}

datasource db {
  provider = "postgresql"
}

enum Role {
  HOUSEHOLD
  HELPER
  ADMIN
}

enum ServiceType {
  MAID
  BABYSITTER
  NANNY
}

enum PlanType {
  HOURLY
  MONTHLY
  YEARLY
}

enum VerificationStatus {
  PENDING
  VERIFIED
  REJECTED
}

enum BookingStatus {
  PENDING
  ACCEPTED
  REJECTED
  ONGOING
  COMPLETED
  CANCELLED
}

enum DisputeStatus {
  OPEN
  IN_REVIEW
  RESOLVED
  DISMISSED
}

model User {
  id                  String    @id @default(uuid())
  firebaseUid         String    @unique
  email               String    @unique
  role                Role      @default(HOUSEHOLD)
  onboardingCompleted Boolean   @default(false)
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt

  householdProfile    HouseholdProfile?
  helperProfile       HelperProfile?

  @@index([firebaseUid])
}

model HouseholdProfile {
  id        String   @id @default(uuid())
  userId    String   @unique
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  fullName  String
  phone     String
  address   String
  city      String
  avatarUrl String?

  bookings  Booking[]
  reviews   Review[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model HelperProfile {
  id                  String              @id @default(uuid())
  userId              String              @unique
  user                User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  fullName            String
  phone               String
  serviceType         ServiceType
  experienceYears     Int                 @default(0)
  bio                 String?
  city                String
  avatarUrl           String?
  availability        Json                // e.g. { "mon": ["09:00-13:00"], "tue": [...] }

  verificationStatus  VerificationStatus  @default(PENDING)
  documents           VerificationDocument[]

  ratingAvg           Float               @default(0)
  ratingCount         Int                 @default(0)

  servicePlans        ServicePlan[]
  bookings            Booking[]
  reviews             Review[]

  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  @@index([serviceType, city])
  @@index([verificationStatus])
}

model VerificationDocument {
  id         String              @id @default(uuid())
  helperId   String
  helper     HelperProfile       @relation(fields: [helperId], references: [id], onDelete: Cascade)
  docType    String              // e.g. "ID_PROOF", "ADDRESS_PROOF"
  url        String              // Cloudinary secure_url
  status     VerificationStatus  @default(PENDING)
  createdAt  DateTime            @default(now())
}

model ServicePlan {
  id          String        @id @default(uuid())
  helperId    String
  helper      HelperProfile @relation(fields: [helperId], references: [id], onDelete: Cascade)
  planType    PlanType
  price       Decimal       @db.Decimal(10, 2)
  description String?
  isActive    Boolean       @default(true)

  bookings    Booking[]

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([helperId])
}

model Booking {
  id             String           @id @default(uuid())
  householdId    String
  household      HouseholdProfile @relation(fields: [householdId], references: [id])
  helperId       String
  helper         HelperProfile    @relation(fields: [helperId], references: [id])
  servicePlanId  String
  servicePlan    ServicePlan      @relation(fields: [servicePlanId], references: [id])

  status         BookingStatus    @default(PENDING)
  scheduledDate  DateTime
  startTime      String           // "09:00"
  endTime        String           // "13:00"
  notes          String?

  review         Review?

  createdAt      DateTime         @default(now())
  updatedAt      DateTime         @updatedAt

  @@index([householdId])
  @@index([helperId])
  @@index([status])
}

model Review {
  id          String           @id @default(uuid())
  bookingId   String           @unique
  booking     Booking          @relation(fields: [bookingId], references: [id])
  householdId String
  household   HouseholdProfile @relation(fields: [householdId], references: [id])
  helperId    String
  helper      HelperProfile    @relation(fields: [helperId], references: [id])

  rating      Int              // 1-5
  comment     String?

  createdAt   DateTime         @default(now())

  @@index([helperId])
}

model Dispute {
  id          String        @id @default(uuid())
  bookingId   String
  booking     Booking       @relation(fields: [bookingId], references: [id])
  raisedById  String
  raisedBy    User          @relation(fields: [raisedById], references: [id])
  reason      String
  status      DisputeStatus @default(OPEN)
  resolution  String?
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([status])
  @@index([bookingId])
}
```
