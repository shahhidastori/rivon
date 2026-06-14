# Hotel Booking Platform

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

- Email: `admin@hotel.test`
- Password: `password123`

## Free/Low-Cost Deployment

The lowest-cost deployment path for this project is:

- Render free Web Service for the React + Express app
- Supabase Free Postgres for persistent production data
- Your custom domain pointed at Render

### 1. Push the app to GitHub

Create or open the GitHub repository, then connect this local project:

```bash
git remote add origin git@github.com:shahhidastori/rivon.git
git push -u origin main
```

### 2. Create the Supabase database

Create a Supabase project and copy the Postgres connection string. Use the Supavisor Session Pooler connection string if your deploy environment needs IPv4 support.

### 3. Create the Render web service

Create a new Render Web Service from the GitHub repository.

Render build command:

```bash
npm run db:prod:push && npm run build:render
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
CLIENT_ORIGIN=https://hotel-booking-platform.onrender.com
AUTO_SEED=true
```

The included `render.yaml` already defines the service name, free plan, build command, start command, health check, generated `JWT_SECRET`, and first-start baseline content seeding. The first free URL will be Render's default `*.onrender.com` service URL. Later, set `CLIENT_ORIGIN` to the final custom domain after DNS is connected.

### 4. Connect the GoDaddy domain

In Render, add the custom domain you want to use, for example:

- `www.example.com`
- `example.com`

Add both the root domain and `www` domain in Render. Render will show the exact DNS records to create. In GoDaddy, open the domain DNS manager and add or update those records. After DNS verifies in Render, HTTPS is issued automatically.

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
