# Coached by Dre

A standalone Next.js landing page with a secure coaching inquiry form.

## Run locally

```bash
npm install
copy .env.example .env.local
npm run dev
```

The contact form sends inquiries directly by email with Resend. Messages are
not stored in a database.

## Environment variables

Copy `.env.example` to `.env.local` and set:

- `RESEND_API_KEY` — API key from Resend.
- `CONTACT_FROM_EMAIL` — sender address verified in Resend, e.g.
  `Coached by Dre <contact@your-verified-domain.com>`.
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` — public site key for the Cloudflare
  Turnstile widget.
- `TURNSTILE_SECRET_KEY` — private server-side Turnstile secret.

Messages are emailed to `dre.miller3489@gmail.com`, with replies directed to
the sender. Verify your sender domain with Resend for production email delivery.
Turnstile verification is required before the email is sent.

## Deploy to Cloudflare Workers

1. Configure the Cloudflare Worker build environment with
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and `CONTACT_FROM_EMAIL`.
2. Add `RESEND_API_KEY` and `TURNSTILE_SECRET_KEY` as Worker secrets. Never put
   these secret values in Git.
3. Configure the Turnstile widget to allow the production hostname.
4. Run `npm run deploy` from this project, or connect the repository to
   Cloudflare Workers Builds and use `npm run deploy` as the deploy command.
