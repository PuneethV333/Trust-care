# Trust Care

Monorepo with a React frontend and a NestJS backend.

## Stack

| Layer    | Tech                                    |
| -------- | --------------------------------------- |
| Frontend | React, TypeScript, Vite, Tailwind CSS   |
| Backend  | NestJS, Prisma (ORM), PostgreSQL        |

## Structure

```
frontend/   React + TS + Vite + Tailwind CSS
backend/    NestJS + Prisma + PostgreSQL
```

## Getting started

### Backend

```bash
cd backend
npm install
cp .env.example .env   # set DATABASE_URL to your PostgreSQL instance
npx prisma migrate dev # create tables from prisma/schema.prisma
npm run start:dev      # http://localhost:3000/api
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```

The frontend proxies `/api` requests to the backend (`http://localhost:3000`) via `vite.config.ts`.
