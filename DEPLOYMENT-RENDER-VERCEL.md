# FIELD DOOR Production Deployment

This repo is set up for:

- Backend: Render web service using Docker
- Frontend: Vercel static deployment
- Database: managed PostgreSQL
- Cache: managed Redis

## Files Added For Production

- `render.yaml`
- `vercel.json`
- `fielddoor-backend/.env.production.example`
- `fielddoor-backend/.dockerignore`

## Backend On Render

Render supports Docker web services and `render.yaml` blueprints. The backend blueprint in this repo uses:

- `runtime: docker`
- `dockerfilePath: ./fielddoor-backend/Dockerfile`
- `dockerContext: ./fielddoor-backend`
- `healthCheckPath: /api/v1/health`

Render docs used:

- Blueprint YAML reference: https://render.com/docs/blueprint-spec
- Docker on Render: https://render.com/docs/docker
- Web services: https://render.com/docs/web-services

### Render setup

1. Push this repo to GitHub.
2. In Render, create a new Blueprint from the repo or create a Docker web service pointing to the same repo.
3. Use the values from `fielddoor-backend/.env.production.example` to populate Render environment variables.
4. Set your real backend domain in:
   - `APP_URL`
   - `ALLOWED_ORIGINS`
5. Render will build the Docker image and run:
   - `npx prisma migrate deploy`
   - `node dist/src/server.js`

### Required Render env vars

You must provide real values for:

- `APP_URL`
- `ALLOWED_ORIGINS`
- `DATABASE_URL`
- `REDIS_URL`
- `ACCESS_TOKEN_SECRET`
- `REFRESH_TOKEN_SECRET`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEBHOOK_SECRET`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET`
- `CDN_URL`
- `SMTP_HOST`
- `SMTP_USER`
- `SMTP_PASS`
- `EMAIL_FROM`

### Cloud Postgres checklist

Run these against the cloud Postgres database after setting `DATABASE_URL`:

1. `npx prisma generate`
2. `npx prisma migrate deploy`
3. `npm run db:seed`

If your provider is Neon, Supabase, Render Postgres, or RDS, make sure SSL is enabled in `DATABASE_URL`.

### Cloud Redis checklist

Use a Redis URL like:

- `rediss://default:<password>@<host>:6379`

After deploy, verify:

1. `GET /api/v1/health` is reachable
2. OTP rate limiting works
3. Slot locking works without timeout

## Frontend On Vercel

Vercel supports external rewrites in `vercel.json`, which is ideal for proxying `/api/*` to Render.

Vercel docs used:

- Rewrites to external origins: https://vercel.com/docs/rewrites
- Environment variables: https://vercel.com/docs/environment-variables

### Vercel setup

1. Import the repo into Vercel.
2. Set the project root to the repo root.
3. Keep the output as a static site.
4. Update `vercel.json`:
   - replace `https://fielddoor-backend.onrender.com` with your real Render backend URL
5. Deploy.

### Domain setup

- Point your frontend domain to Vercel
- Point your API domain to Render if using a dedicated backend domain
- Add both frontend domains to backend `ALLOWED_ORIGINS`

## Client Handover Checklist

Before giving this to the client, verify:

1. Frontend loads from the Vercel domain
2. `/api/*` requests proxy successfully to Render
3. Prisma migrations ran against the cloud Postgres database
4. Seed data exists or client data is loaded
5. Redis slot locks work and expire correctly
6. OTP logs appear in Render logs
7. Razorpay order creation works
8. Razorpay webhook endpoint is configured with the production Render URL
9. Booking confirmation email sends successfully
10. Firebase push notifications send successfully
11. S3 presigned uploads return valid upload URLs
12. Cancellation and refund flows work against live or test Razorpay credentials

## What Still Needs Real Credentials

I cannot complete these from the repo alone:

- switch `.env` to real production secrets
- run Prisma against your cloud Postgres instance
- seed real client data
- verify Redis connectivity from Render
- configure SMTP, Razorpay, Firebase, and S3 with live credentials
- test booking, OTP, payment verify, webhook, and cancellation flows on the deployed public URL

Once you have:

- Render backend URL
- Vercel frontend URL
- cloud Postgres URL
- cloud Redis URL
- vendor secrets

the next step is to deploy and run a live production verification pass.
