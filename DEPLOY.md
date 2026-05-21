# Deploying CleanMap Hyderabad

## Pre-deploy checklist
- [ ] Supabase project created and schema.sql applied
- [ ] `spot-photos` storage bucket set to public
- [ ] RLS policies verified (anon: SELECT public_spots only; service role: full access)
- [ ] Run supabase/indexes.sql in Supabase SQL Editor (or apply via schema.sql)
- [ ] `.env.local` has all 5 env vars — do NOT commit this file
- [ ] Seed script run: `npm run seed`
- [ ] `NEXT_PUBLIC_SITE_URL` set to the final Vercel URL

## Environment variables to set in Vercel dashboard
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_MAPBOX_TOKEN
ADMIN_PASSWORD
NEXT_PUBLIC_SITE_URL   (set to https://your-project.vercel.app)
GEMINI_API_KEY
RESEND_API_KEY          (optional — if missing, no email is sent)
ADMIN_EMAIL             (optional — if missing, no email is sent)



## Deploy steps
1. Push repo to GitHub
2. Import into Vercel → Framework: Next.js (auto-detected)
3. Add all env vars above in Vercel project settings → Environment Variables
4. Deploy
5. Verify: home page loads, stats show counts, map shows pins
6. Verify: /admin/login works, status transitions work
7. Verify: /spots/[id] OG tags by pasting a URL into https://www.opengraph.xyz

## Do NOT commit
- `.env.local`
- `SUPABASE_SERVICE_ROLE_KEY`
