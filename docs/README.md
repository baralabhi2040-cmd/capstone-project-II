# Deployment Guide

This project is prepared for a simple production stack:

- Render for hosting
- Render Postgres for the database
- Resend SMTP for verification emails and snapshot delivery

## 1. Create a Resend SMTP sender

Before deploying, create:

- a Resend account
- a verified sending domain or subdomain
- an API key

Use these SMTP values:

- `SMTP_HOST=smtp.resend.com`
- `SMTP_PORT=587`
- `SMTP_USERNAME=resend`
- `SMTP_PASSWORD=<your Resend API key>`
- `SMTP_USE_TLS=true`
- `SMTP_USE_SSL=false`

Set `SMTP_FROM_EMAIL` to an address on your verified domain, for example:

```text
alerts@yourdomain.com
```

## 2. Deploy on Render

This repo includes [render.yaml](/D:/BIT(2k26)/ICT%20311/Final%20Project/render.yaml), which provisions:

- one public web service for the full app
- one Postgres database

Render will:

- build the frontend inside Docker
- copy the built frontend into the final image
- start FastAPI as the public app server

## 3. Required production environment values

Set these in Render if they are not already filled by the blueprint:

```text
SMTP_PASSWORD=<your Resend API key>
SMTP_FROM_EMAIL=alerts@yourdomain.com
EMAIL_DEBUG_PREVIEW=false
RELOAD=false
```

Optional but recommended:

```text
FRONTEND_BASE_URL=https://your-public-domain.com
ALLOWED_ORIGINS=https://your-public-domain.com
```

If `FRONTEND_BASE_URL` is not set on Render, the app falls back to `RENDER_EXTERNAL_URL`.

## 4. Domain and verification flow

After deployment:

1. Open the public app URL.
2. Create an account.
3. Check your inbox and verify the account.
4. Run a scan while signed in.
5. Click `Email this snapshot`.

## 5. Going from demo to stronger production

Use at least a paid Render web plan for the application service.

Important:

- Render's current docs say free web services cannot send outbound traffic on SMTP ports `25`, `465`, or `587`
- that means email verification and snapshot delivery will not work on a free web service

For stronger uptime and reliability, upgrade later to:

- an always-on Render web plan
- a paid Postgres plan
- your own custom domain

## 6. Local fallback

If SMTP is not configured, the app still works and writes preview emails to:

- [backend/logs/outbox](/D:/BIT(2k26)/ICT%20311/Final%20Project/backend/logs/outbox)

That makes it easy to test account creation and snapshot delivery before you connect Resend.
