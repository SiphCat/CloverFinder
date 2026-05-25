# Cloverfinder

This repo has **two** layers:

1. **Static pages** (your original site): `index.html`, `credits.html`, `dev.html`, `script.js`, `styles.css`  
   Preview with any static server, e.g. `python3 -m http.server 8080` in this folder → http://localhost:8080  

2. **Next.js + Supabase Auth** (real login / sign up): `app/`, `npm run dev` → use the **`Local:`** URL printed in the terminal (often http://localhost:3000).

## Restart **only** login / sign up (Supabase flow)

You usually **don’t** need to wipe the whole site—only reset Next’s cache or env:

```bash
cd /Users/oksana/Documents/clover-finder
rm -rf .next
npm run dev
```

Configure Supabase once:

```bash
cp .env.example .env.local
```

Put `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from Supabase **Settings → API**.  
Add redirect URLs in Supabase **Authentication → URL Configuration**:

- `http://localhost:3000/auth/callback`
- `http://localhost:3000/auth/reset-password`

Auth UI routes: `/auth/sign-up`, `/auth/log-in`, `/auth/forgot-password`, `/auth/reset-password`.

## Prerequisites

- Node **20.9+**
- `npm install` after cloning or changing dependencies

## Browser: `ERR_EMPTY_RESPONSE` / `-324` on localhost

That means **no HTTP response** came back — usually **nothing is listening on that port**, or you’re using the **wrong port**.

1. **Start Next from the project folder** and wait until you see **`✓ Ready`**:
   ```bash
   cd /Users/oksana/Documents/clover-finder
   npm run dev
   ```
2. Open the URL printed as **`Local:`** — often **`http://127.0.0.1:3000`**. If it says **3001**, use **3001**, not 3000.
3. **Only one server per port.** If you still use Python on 3000 (`python -m http.server`), stop it (`Ctrl+C`) or Next will move to another port.
4. Check what holds 3000 (macOS Terminal):
   ```bash
   lsof -i :3000
   ```
   Stop anything that isn’t your `next dev` if needed.

Quick test (Terminal):

```bash
curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3000/
```

You want **`200`** when Next is running on 3000.

## Browser: Chrome **error -102** (`ERR_CONNECTION_REFUSED`)

Same root cause as “nothing answered on that address”: the dev server is not running, is on a **different port**, or you opened **`localhost`** vs **`127.0.0.1`** inconsistently with what is actually listening. After `npm run dev`, use the **`Local:`** URL until **Ready**, match the port, and set **`NEXT_PUBLIC_SITE_URL`** in `.env.local` to that same origin so Supabase email links do not point at a dead host.
