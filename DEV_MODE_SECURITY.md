# Dev Mode Security Warning

## What is Dev Mode?

Dev mode is a development feature that **completely bypasses authentication** in the application. When enabled:

- ❌ All authentication checks are disabled
- ❌ Anyone can access `/app/*` routes without logging in
- ❌ Anyone can access `/admin/*` routes without authentication
- ❌ All users are treated as admins

## Security Requirements

### ✅ Local Development
```bash
# .env.local - Default should be false
NEXT_PUBLIC_DEV_MODE="false"

# Only enable temporarily for specific testing
NEXT_PUBLIC_DEV_MODE="true"
```

### ✅ Production (Vercel)
**CRITICAL**: The `NEXT_PUBLIC_DEV_MODE` environment variable must:
- ❌ **NEVER** be set in Vercel environment variables
- ❌ **NEVER** be set to "true" in production
- ✅ Be completely absent from Vercel configuration

## Vercel Configuration Check

1. Go to https://vercel.com/your-project/settings/environment-variables
2. Search for `NEXT_PUBLIC_DEV_MODE`
3. If it exists, **DELETE IT IMMEDIATELY**
4. Save changes and redeploy

## Current Status

- ✅ `.env.local` - Set to "false" by default
- ✅ `.env.example` - Documented with security warnings
- ⚠️  **VERIFY**: Ensure not set in Vercel

## How to Verify

### Local:
```bash
# Check .env.local
cat .env.local | grep NEXT_PUBLIC_DEV_MODE

# Should show:
# NEXT_PUBLIC_DEV_MODE="false"
```

### Production:
1. Visit your deployed site
2. Try to access `/app/learn` without logging in
3. You should be redirected to `/auth/login`
4. If you can access it without login, dev mode is enabled (CRITICAL BUG)

## Emergency Disable

If dev mode is accidentally enabled in production:

1. Go to Vercel dashboard
2. Delete `NEXT_PUBLIC_DEV_MODE` environment variable
3. Trigger a new deployment
4. Verify authentication is working

## Related Files

- `lib/supabase/middleware.ts` - Contains dev mode check (lines 5-11)
- `.env.local` - Local environment configuration
- `.env.example` - Template with security warnings
