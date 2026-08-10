# AGENTS.md — Trust Care (Maid & Nanny Service Platform)

Read this file fully before writing code. It is the repo's single source of truth. Two
companion docs carry the implementation detail — read the one for the layer you're touching:

- `backend/backend.md` — NestJS API: project layout, route map, cache keys/TTLs, rate limits, Swagger.
- `frontend/frontend.md` — React client: design tokens, structure, data-fetching rules.

> Naming note: the product name is **Trust Care**. The spec once called it "Helper4U"; don't
> reintroduce that name.

## 0. How to work (read every session)

1. Re-read this file and the layer doc each session — do not rely on memory.
2. Work one phase at a time, in the order in §6. Never jump ahead before the current phase builds.
3. One commit per phase (Conventional Commits), and only after `npm run build` passes.
4. Prefer the simplest option that satisfies the spec — this is an internship MVP.
5. Do not add libraries/patterns not named in these docs. If one is genuinely needed, flag it,
   don't silently add it.

> Out of scope — do NOT build toward or leave hooks for: payments, mobile app, attendance
> tracking, multi-language, SOS.

## 1. Verified commands

Backend (`backend/`, NestJS 11 + Prisma 7):

- `npm run start:dev` — dev server on `http://localhost:3000/api` (global prefix `api`)
- `npm run build` — `nest build`; must pass before committing
- `npm run lint` — eslint **with `--fix` (auto-rewrites files)**
- `npm run format` — prettier `--write`
- Prisma: `npx prisma migrate dev` / `generate` / `studio` — config comes from
  `prisma.config.ts` (backend root), not the schema file

Frontend (`frontend/`, React 19 + Vite 8 + Tailwind 4):

- `npm run dev` — `http://localhost:5173`, proxies `/api` → `http://localhost:3000`
- `npm run build` — `tsc -b && vite build`
- `npm run lint` — **oxlint** (NOT eslint; config `.oxlintrc.json`)
- `npm run preview`

Suggested verification order: lint → build. There is no CI and no required test suite (§5).

## 2. Repo layout & current state

- `backend/` — NestJS app. Entry `src/main.ts` (CORS from `CLIENT_URL`, global prefix `/api`,
  port `PORT ?? 3000`, helmet, Swagger at `/api/docs`). `PrismaModule` and `RedisModule` are
  global. Foundation is in place: Firebase Auth + Roles guards (global, `@Public()` / `@Roles()`
  opt-outs), global `ZodValidationPipe`, global throttler (100/60s default), `HttpExceptionFilter`.
  **No feature modules yet** (auth/users/helpers/... come in phases 2+).
- `frontend/` — Vite app. Entry `src/main.tsx` → `App.tsx` (still the template counter). No
  firebase/query/router/zod installed yet.

### Prisma 7 gotchas (differs from most Prisma tutorials)

- `prisma.config.ts` holds schema path + `DATABASE_URL` and loads dotenv itself.
- Generator is `prisma-client` with `output = "../generated/prisma"` — NOT `prisma-client-js`,
  and there is no `url` in the datasource block. The generator block also sets
  `moduleFormat = "cjs"` — without it the client emits ESM-only `import.meta.url` code that
  crashes the NestJS CJS build.
- `PrismaClient` requires a **driver adapter** — `new PrismaClient({ adapter })` with
  `@prisma/adapter-pg` (see `src/prisma/prisma.service.ts`). `new PrismaClient()` with no
  adapter throws at startup.
- Because `generated/` is part of the TS compilation, `nest build` outputs to `dist/src/`
  (not `dist/`), so the prod start script is `node dist/src/main`.
- Generated client is gitignored; import it as `from '../../generated/prisma/client'`
  (see `src/prisma/prisma.service.ts`).
- Prisma skills are installed under `backend/.agents/skills/prisma-*` — consult them for
  Prisma 7 CLI/client questions before guessing.
- Current `prisma/schema.prisma` is still the scaffold `User` placeholder. The full target model
  (household/helper profiles, verification documents, service plans, bookings, reviews) is the
  canonical contract in `backend/backend.md` §8 — apply it during Phase 1, and mirror any field
  changes into the frontend Zod schemas.

### Ports & env

- Backend: `PORT` (default 3000), `CLIENT_URL` (CORS). Env from `backend/.env` (gitignored);
  `backend/.env.example` is checked in with placeholders. Never commit `.env`.
- Frontend: no env files yet; later phases add `.env.local` with `VITE_*` keys.
- Older spec text says port 4000 — **the code uses 3000; trust the code.**

## 3. Tech stack (locked — do not swap)

Frontend: React + TypeScript, Tailwind CSS, TanStack Query, mobile-first, web only.
Backend: NestJS (TypeScript). ORM/DB: Prisma + PostgreSQL. Cache: Redis. Auth: Firebase Auth
(client-side sign-in, backend verifies ID token). File storage: Cloudinary (signed uploads).
Validation: Zod everywhere (`nestjs-zod` backend, `zod` + `react-hook-form` frontend).
Docs: Swagger/OpenAPI (`@nestjs/swagger`, generated from Zod DTOs). Tests: none required.

## 4. Auth flow (keep simple, don't over-engineer)

1. Frontend Firebase sign-in (Google or email/password) → get `idToken`.
2. `POST /auth/sync` with `Authorization: Bearer <idToken>`.
3. Backend verifies token (Firebase Admin), upserts `User` by `firebaseUid` (default
   `role: HOUSEHOLD`, `onboardingCompleted: false`), returns `{ id, role, onboardingCompleted }`.
4. `onboardingCompleted === true` → Home, else → Onboarding.
5. Frontend mirrors the returned `id` to `localStorage` for UX only — **never trusted by the
   backend**; every authenticated request still carries the real ID token.
6. No custom JWT, no refresh-token dance, no sessions table. Firebase is the only identity provider.

## 5. Non-negotiable rules

- **Never commit secrets.** Everything from env (§2). No hardcoded Firebase/Cloudinary keys.
- **Zod is the only validation layer.** No `class-validator`. Backend DTOs are Zod schemas wrapped
  with `nestjs-zod`'s `createZodDto` so Swagger generates from the same source — don't hand-write
  duplicate OpenAPI decorators.
- **Every cacheable GET uses Redis** (cache-aside) with the exact key pattern/TTL in `backend.md`;
  every mutation invalidates the keys it affects in the same request.
- **Every route needs a rate limit** per the table in `backend.md` — no route is exempt.
- **Role guards are mandatory** on any non-public route (per-route table in `backend.md`).
- **No tests.** Do not scaffold `*.spec.ts` / `*.test.tsx` even though jest/oxlint config exists.
- Commit after each phase, only after build passes. Conventional Commits, one per phase.

## 6. Phases (do them in order)

Backend: (1) foundation — scaffold, Prisma schema + migration, Redis module, Firebase Admin,
guards, global Zod pipe, Swagger; (2) auth `/auth/sync`; (3) users; (4) helpers; (5) service-plans;
(6) bookings; (7) reviews; (8) uploads; (9) admin.
Frontend: (10) foundation — Vite scaffold, Tailwind tokens, Firebase client init, TanStack Query
client, Zod mirrors, api client; (11) auth + onboarding; (12) home + search; (13) helper profile +
booking; (14) my bookings; (15) reviews; (16) admin dashboard; (17) polish.

Each phase lands as its own commit; don't batch phases into one diff.
