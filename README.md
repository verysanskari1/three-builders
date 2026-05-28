# 3 Builders — Shoot Day Dashboard

A real-time shoot day management dashboard for the 3 Builders filmed coding competition.

## Setup

### 1. Clone and install

```bash
npm install
```

### 2. Environment variables

Copy `.env.example` to `.env.local` and fill in the values:

```bash
cp .env.example .env.local
```

#### HOST_PASSWORD
Set a password for the host view. This is the only auth gate.

#### Vercel KV
1. Go to your Vercel project → Storage → Create Database → KV
2. Copy the credentials into your `.env.local`:
   ```
   KV_URL=
   KV_REST_API_URL=
   KV_REST_API_TOKEN=
   KV_REST_API_READ_ONLY_TOKEN=
   ```
   These are also available as Vercel env vars — they're injected automatically for projects linked to a KV store.

#### Pusher Channels
1. Go to [pusher.com](https://pusher.com) → Create app
2. Choose cluster `ap2` (Mumbai, closest to Bangalore) or whatever region you prefer
3. Copy credentials:
   ```
   PUSHER_APP_ID=
   PUSHER_KEY=
   PUSHER_SECRET=
   PUSHER_CLUSTER=ap2
   NEXT_PUBLIC_PUSHER_KEY=
   NEXT_PUBLIC_PUSHER_CLUSTER=ap2
   ```

### 3. Deploy to Vercel

```bash
vercel --prod
```

Or push to GitHub and link the repo in Vercel dashboard.

## URLs

| View | URL |
|------|-----|
| Landing | `/` |
| Host (password-gated) | `/host` |
| Vibe Coder | `/contestant/vibe` |
| Junior Dev | `/contestant/junior` |
| Senior Dev | `/contestant/senior` |

Share the contestant URLs directly — no login needed.

## Resetting state

From the host view, scroll to the bottom-right **Danger Zone** and click "Reset everything" twice. This wipes KV and reseeds from defaults.

Or via API (requires `host_auth` cookie):
```bash
curl -X POST https://your-domain.vercel.app/api/state/reset \
  -H "Cookie: host_auth=YOUR_PASSWORD"
```

## Architecture

- **KV key**: `shoot:state` — one JSON blob with the full `AppState`
- **Real-time**: Pusher channel `shoot-day`, events: `timer-update`, `notification`, `pause-request`, `pause-ack`, `state-reset`
- **Auth**: `httpOnly` cookie `host_auth` checked server-side on every host-only route
- **Polling fallback**: contestant view polls `/api/state` every 5s in case Pusher drops
