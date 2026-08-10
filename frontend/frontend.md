# frontend.md — React + TS Client

Read `AGENTS.md` first for the auth flow and current repo state (your Zod schemas and TS types
mirror the canonical schema in `backend/backend.md` §8). This file covers frontend implementation
detail only.

---

## 1. Design direction

The core value proposition of Trust Care is **trust** — verified helpers, transparent pricing,
accountability. The UI should read as calm, credible, and warm, not like a generic gig-economy
marketplace. Avoid harsh corporate blue-on-white SaaS defaults; avoid neon/gig-app energy too.

**Direction: "trusted neighborhood service."** Soft, warm neutrals with one confident accent
color used sparingly for trust signals (verified badges, primary CTAs). Card-based layouts,
generous rounded corners, soft shadows over hard borders. Real-feeling content (ratings,
experience years, verification badges) should be visually prominent since they're the entire
reason a household picks one helper over another.

### Color tokens (Tailwind `theme.extend.colors`)

```js
colors: {
  primary: {
    50:  '#f0fdf6',
    100: '#dcfce9',
    300: '#86efc0',
    500: '#16a765',   // core brand green — trust, verified, "go"
    600: '#0f8a52',
    700: '#0c6b40',
  },
  accent: {
    500: '#f59e0b',   // warm amber — used only for ratings/stars, not CTAs
  },
  neutral: {
    50:  '#faf9f7',   // app background (warm off-white, not stark white)
    100: '#f2f0ec',
    200: '#e5e2db',
    400: '#a8a29a',
    600: '#57534e',
    800: '#292521',
  },
  danger: '#dc2626',
}
```

- Background: `neutral-50`. Cards: white with `shadow-sm` and `rounded-2xl`.
- Primary CTA buttons: `bg-primary-500 hover:bg-primary-600 text-white rounded-xl`.
- Verified badge: small `bg-primary-100 text-primary-700` pill with a checkmark icon.
- Ratings: `accent-500` filled stars, `neutral-400` empty stars.
- Destructive actions (cancel/reject): `danger` text/border, never a filled danger button as
  the primary visual weight on a screen.

### Typography

- Font: `Inter` (system-ui fallback) via Tailwind's default sans stack — no need to add a
  display font, this is a utility app, not a marketing site.
- Scale: page titles `text-2xl font-semibold`, section headers `text-lg font-semibold`, body
  `text-base`, meta/secondary text `text-sm text-neutral-600`.

### Layout

- **Mobile-first, web-only.** Design and build for a 375–430px viewport first, then expand
  with `sm:` / `md:` / `lg:` breakpoints. Max content width on desktop: `max-w-3xl` for forms
  and detail pages, `max-w-6xl` for the search/browse grid.
  Bottom tab navigation on mobile (Home / Search / Bookings / Profile), top nav on `md:` and up.
- Helper cards: photo (or initials avatar fallback), name, service type badge, verified badge,
  rating + review count, starting price, city. Tapping opens the detail page.

---

## 2. Project structure

```
src/
  main.tsx
  App.tsx
  lib/
    firebase.ts          # Firebase client init from import.meta.env
    api.ts                # fetch wrapper: attaches Bearer idToken, base URL from env
    queryClient.ts
  schemas/                # Zod schemas mirroring backend DTOs — shared shape, not shared package
    user.schema.ts
    helper.schema.ts
    booking.schema.ts
    review.schema.ts
  hooks/                  # TanStack Query hooks, one file per module
    useAuth.ts
    useHelpers.ts
    useBookings.ts
    useReviews.ts
  pages/
    onboarding/
    home/
    search/
    helper-detail/
    bookings/
    admin/
  components/
    ui/                   # buttons, inputs, badges, cards — dumb, reusable
    layout/                # AppShell, BottomNav, TopNav
  types/                  # generated/mirrored types from Prisma enums
```

---

## 3. Auth flow (implementation)

1. `lib/firebase.ts` initializes Firebase from `VITE_FIREBASE_*` env vars (never hardcode).
2. Sign-in screen offers Google (`signInWithPopup` + `GoogleAuthProvider`) and email/password
   (`signInWithEmailAndPassword` / `createUserWithEmailAndPassword`).
3. On successful Firebase auth, call `POST /auth/sync` with the ID token via `lib/api.ts`.
4. Store `{ uid, role, onboardingCompleted }` in a small auth context/store (React context is
   enough — no Redux needed for this). Also mirror `uid` into `localStorage` as specified in
    `AGENTS.md` (dev convenience only).
5. Route guard (`<RequireAuth>` wrapper): no Firebase user → redirect to `/sign-in`.
   Firebase user but `onboardingCompleted === false` → redirect to `/onboarding`.
   Otherwise → render the route.
6. `lib/api.ts`'s fetch wrapper pulls the *current* Firebase ID token fresh on every request
   (`auth.currentUser.getIdToken()`), not the localStorage copy — localStorage `uid` is only
   ever used for quick UI decisions (e.g., "is someone logged in") not for authenticating API
   calls.

---

## 4. Data fetching — TanStack Query rules

- One hook per resource, colocated in `hooks/`. Example shape:
  ```ts
  export function useHelperSearch(filters: HelperSearchFilters) {
    return useQuery({
      queryKey: ['helpers', 'search', filters],
      queryFn: () => api.get('/helpers', { params: filters }),
      staleTime: 60_000,
    });
  }
  ```
- Mutations always invalidate the exact query keys they affect, e.g. accepting a booking
  invalidates `['bookings', 'me']`.
- Every list/detail query must handle three states explicitly in the page component:
  loading (skeleton, not a spinner-only screen), error (retry affordance), empty (helpful
  empty state copy — e.g. "No helpers match these filters yet").
- Do not fetch in `useEffect`. TanStack Query only.

---

## 5. Validation — Zod

- `schemas/*.schema.ts` mirror the backend Zod DTOs field-for-field (kept in sync manually
  since this isn't a shared monorepo package — when a backend DTO changes, update the matching
  frontend schema in the same commit).
- All forms use `react-hook-form` with `zodResolver`. No manual `useState`-per-field forms.
- Client-side validation error messages must match the tone of backend messages so users never
  see two different phrasings for the same rule.

---

## 6. File uploads (Cloudinary)

1. Call `POST /uploads/signature` to get `{ timestamp, signature, apiKey, cloudName, folder }`.
2. Upload directly from the browser to
   `https://api.cloudinary.com/v1_1/<cloudName>/auto/upload` with those signed params
   (`fetch`/`FormData`, no library needed).
3. Take the returned `secure_url` and send it to the relevant backend endpoint
   (`POST /helpers/me/documents`, avatar update, etc.). The file itself never touches our
   backend server.

---

## 7. Environment variables (`.env.local`, never committed)

```
VITE_API_BASE_URL=http://localhost:3000
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```
Check in a `.env.example` with blank values. Add `.env.local` to `.gitignore` before the first
commit.

---

## 8. Must-follow instructions (non-negotiable)

1. **Mobile-first, always.** Build the 375px layout first; add breakpoints only to *improve*
   the wider view, never to fix a broken mobile one.
2. **No `useEffect` data fetching** — TanStack Query only, per §4.
3. **No secrets, no hardcoded Firebase/Cloudinary config** — everything from `import.meta.env`.
4. **Every screen has loading/error/empty states.** No bare `{data && ...}` with nothing else.
5. **Role-aware rendering must match backend role guards** — e.g. don't show "Accept Booking"
   to a household account even transiently; check role before render, not after an API 403.
6. **No test files.** Don't scaffold `*.test.tsx`.
7. **Reuse `components/ui` primitives** — don't inline one-off buttons/badges/cards once a
   primitive exists for that pattern.
8. **Commit after each phase per `AGENTS.md` §6**, not mid-feature.
