# Rivon Hotel Booking Platform

A complete Skardu-based hotel website and booking management system built from the provided Visily board direction: image-led public pages, gold CTAs, dark footer/admin surfaces, compact cards, and operational admin tables.

## Stack

- React + Vite frontend
- Express API
- Prisma ORM
- SQLite local database
- JWT admin authentication
- Multer image uploads

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create local environment:

```bash
cp .env.example .env
```

3. Generate Prisma Client:

```bash
npm run prisma:generate
```

4. Apply the database schema:

```bash
npm run db:migrate
```

If Prisma's local schema engine fails on your machine, use the included SQLite fallback:

```bash
npm run db:apply:sqlite
```

5. Seed demo data:

```bash
npm run db:seed
```

6. Start development servers:

```bash
npm run dev
```

Frontend: http://localhost:5173  
API: http://localhost:4000

## Demo Admin Login

- Email: `admin@rivon.test`
- Password: `password123`

## Free/Low-Cost Deployment

The lowest-cost deployment path for this project is:

- Render free Web Service for the React + Express app
- Supabase Free Postgres for persistent production data
- Your custom domain pointed at Render

Render build command:

```bash
npm run build:render
```

Render start command:

```bash
npm run start
```

Required Render environment variables:

```bash
NODE_ENV=production
DATABASE_URL=<Supabase Postgres connection string>
JWT_SECRET=<long random secret>
CLIENT_ORIGIN=https://your-domain.com
```

Before first production deploy, initialize and seed Supabase:

```bash
DATABASE_URL="<Supabase Postgres connection string>" npm run db:prod:push
DATABASE_URL="<Supabase Postgres connection string>" npm run db:prod:seed
```

After running the production Prisma scripts locally, run `npm run prisma:generate` to switch the local Prisma Client back to the SQLite schema.

Note: Render's free service can sleep after inactivity, so the first request after a quiet period may be slow. Room image uploads use the service filesystem, which is not durable on free hosting. For live operations, prefer hosted image URLs or add free object storage later.

## Main Features

- Public landing page with hero, facilities, rooms, gallery, testimonials, location, and footer
- Room listing with filters
- Room detail pages with gallery, amenities, pricing, beds, capacity, and availability notes
- Multi-step booking flow with dates, guests, room selection, customer details, review, payment method, submission, and confirmation
- Booking lookup by reference and email
- Customer cancellation when inside the allowed cancellation window
- Admin login/logout
- Admin dashboard metrics, revenue, occupancy, and recent bookings
- Room CRUD with amenities, pricing, status, featured flag, image URL management, and image upload
- Booking search/filter, status updates, payment status updates, and manual booking creation
- Customer list, profile, and booking history
- CMS editing for public hero, about, facilities, gallery, testimonials, contact, terms, and privacy content

## Useful Scripts

```bash
npm run dev              # Start API and frontend
npm run build            # Build frontend and server
npm run start            # Run built production server
npm run typecheck        # TypeScript checks
npm run db:migrate       # Prisma migration workflow
npm run db:apply:sqlite  # Local SQLite fallback migration
npm run db:seed          # Seed demo content
```

## Uploads

Uploaded room images are stored in `server/uploads` and served from `/uploads/<filename>`. The folder is ignored except for `.gitkeep`.
