# Coached by Dre

A standalone Next.js landing page with a secure coaching inquiry form.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

Configure Supabase and Resend before testing form submissions.

## Supabase setup

Create a Supabase project and run
[`supabase/migrations/20261031000000_contact_messages.sql`](./supabase/migrations/20261031000000_contact_messages.sql)
in its SQL Editor. This creates a private `contact_messages` table and a
rate-limiting table/function. Row-level security is enabled; browser roles have
no table access. The service-role key is used only in the server route.

## Environment variables

Copy `.env.example` to `.env.local` and set:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL.
- `SUPABASE_SERVICE_ROLE_KEY` — service-role key; server-only, never expose it
  with a `NEXT_PUBLIC_` prefix.
- `RESEND_API_KEY` — API key from Resend.
- `CONTACT_FROM_EMAIL` — sender address verified in Resend, e.g.
  `Coached by Dre <contact@your-verified-domain.com>`.
- `CONTACT_IP_HASH_SECRET` — long random secret for privacy-preserving rate
  limits. Generate one with
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

Messages are stored in Supabase and emailed to `dre.miller3489@gmail.com`;
replies go directly to the sender. Verify your sender domain with Resend for
production email delivery.

## Deploy

Push this folder to its own Git repository, import it into Vercel, add all
environment variables above, and deploy. Run the Supabase SQL migration and
verify the Resend sender domain before sharing the contact form.
