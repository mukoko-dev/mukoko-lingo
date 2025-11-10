# Deployment Guide - Nyuchi Lingo

**Last Updated**: November 10, 2025
**Version**: 2.0
**Framework**: Next.js 16 + Supabase + Vercel

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Supabase Setup](#supabase-setup)
4. [Database Migrations](#database-migrations)
5. [Vercel Deployment](#vercel-deployment)
6. [Post-Deployment Checklist](#post-deployment-checklist)
7. [Troubleshooting](#troubleshooting)
8. [Rollback Procedures](#rollback-procedures)

---

## Prerequisites

### Required Accounts
- **Vercel Account**: For hosting the Next.js application
- **Supabase Account**: For database and authentication
- **GitHub Account**: For version control and CI/CD

### Development Tools
- **Node.js**: v18.x or later
- **npm**: v9.x or later
- **Git**: Latest version
- **Supabase CLI** (optional): For local database development

### Required Services
- **Vercel AI Gateway**: For AI model access (Claude Haiku 4.5)
- **HelpScout** (optional): For customer support widget

---

## Environment Variables

### Required Variables

Create a `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Development Mode (NEVER set true in production!)
NEXT_PUBLIC_DEV_MODE=false

# Vercel AI Gateway (managed via Vercel dashboard)
# No API keys needed - handled by Vercel AI Gateway
```

### Optional Variables

```bash
# HelpScout Beacon (Customer Support)
NEXT_PUBLIC_HELPSCOUT_BEACON_ID=your-beacon-id

# Analytics (Vercel Analytics enabled by default)
# No additional environment variables needed
```

### Environment Variable Setup

#### Local Development
1. Copy `.env.example` to `.env.local`
2. Fill in Supabase credentials
3. Set `NEXT_PUBLIC_DEV_MODE=true` for development

#### Vercel Production
1. Go to Vercel dashboard → Your Project → Settings → Environment Variables
2. Add all production variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_HELPSCOUT_BEACON_ID` (if using HelpScout)
3. **Critical**: Ensure `NEXT_PUBLIC_DEV_MODE` is NOT set or set to `false`

---

## Supabase Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click "New Project"
3. Choose organization and region (closest to your users)
4. Set database password (save securely!)
5. Wait for project to initialize (~2 minutes)

### 2. Get Connection Details

1. Go to Project Settings → API
2. Copy **Project URL** → Use as `NEXT_PUBLIC_SUPABASE_URL`
3. Copy **anon public** key → Use as `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Configure Authentication

1. Go to Authentication → Providers
2. Enable **Email** provider
3. Configure email templates (optional):
   - Confirmation email
   - Password recovery
   - Magic link
4. Set up redirect URLs:
   - Add your production domain: `https://yourdomain.com/auth/callback`
   - Add development URL: `http://localhost:3000/auth/callback`

### 4. Configure Storage (if needed)

1. Go to Storage → Create bucket
2. Name: `avatars` or `user-uploads`
3. Set RLS policies for user access

---

## Database Migrations

### Migration Files Location

All SQL migration files are in `/scripts/` directory:

```
scripts/
├── 001_create_phrases_table.sql
├── 002_seed_phrases.sql
├── 003_create_profiles_table.sql
├── ...
├── 026_add_user_status_and_partitioning.sql
├── 027_critical_fixes.sql
```

### Apply Migrations

#### Method 1: Supabase Dashboard (Recommended for Production)

1. Go to Supabase Dashboard → SQL Editor
2. Open each migration file in order (001 → 027)
3. Copy SQL contents
4. Paste into SQL Editor
5. Click "Run"
6. Verify success (check for errors)
7. Repeat for all migrations

#### Method 2: Supabase CLI (Development)

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Apply all migrations
supabase db push

# Alternative: Reset database (DESTRUCTIVE - Dev only!)
supabase db reset
```

#### Method 3: Automated Script

Use the provided migration script:

```bash
# Make script executable
chmod +x scripts/apply-migrations.sh

# Run migrations
./scripts/apply-migrations.sh
```

### Migration Order

**Critical**: Migrations must be applied in numerical order:
1. Schema creation (001-003)
2. User features (004-007)
3. Learning features (008-011)
4. AI features (012-015)
5. Admin features (016-019)
6. Performance optimizations (020-023)
7. Learning standards (024)
8. Indexes and partitioning (025-026)
9. Critical fixes (027)

### Verify Migrations

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- Check RLS policies
SELECT * FROM pg_policies;

-- Check functions
SELECT routine_name FROM information_schema.routines
WHERE routine_schema = 'public';

-- Test admin check function
SELECT is_admin();
```

---

## Vercel Deployment

### Initial Deployment

#### 1. Connect GitHub Repository

1. Go to [vercel.com](https://vercel.com)
2. Click "New Project"
3. Import your GitHub repository
4. Authorize Vercel to access the repo

#### 2. Configure Project

1. **Framework Preset**: Next.js (auto-detected)
2. **Root Directory**: `.` (default)
3. **Build Command**: `npm run build` (default)
4. **Output Directory**: `.next` (default)
5. **Install Command**: `npm install` (default)

#### 3. Set Environment Variables

Add in Vercel dashboard:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_HELPSCOUT_BEACON_ID` (optional)

**Do NOT add** `NEXT_PUBLIC_DEV_MODE` - it defaults to false

#### 4. Deploy

1. Click "Deploy"
2. Wait for build to complete (~2-3 minutes)
3. Vercel will provide a deployment URL

### Vercel AI Gateway Setup

#### 1. Enable AI Gateway

1. Go to Vercel Dashboard → Your Project
2. Navigate to Settings → AI Gateway
3. Click "Enable AI Gateway"

#### 2. Configure Model Access

1. Add Anthropic provider
2. No API keys needed - Vercel manages this
3. Model used: `anthropic/claude-haiku-4-5`

#### 3. Verify AI Access

Test AI endpoints after deployment:
- `/api/ai/chat` - Streaming chat
- `/api/ai/generate-scenario` - Scenario generation
- `/api/ai/recommend-phrases` - Phrase recommendations

### Custom Domain Setup

1. Go to Project Settings → Domains
2. Add your custom domain
3. Configure DNS:
   - **Type**: A Record or CNAME
   - **Name**: @ or www
   - **Value**: cname.vercel-dns.com
4. Wait for DNS propagation (~5-30 minutes)
5. Vercel auto-issues SSL certificate

### Production Optimization

#### Build Configuration

In `next.config.mjs`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    unoptimized: false, // Enable in production
    domains: ['your-project.supabase.co'],
  },
  typescript: {
    ignoreBuildErrors: false, // Fix TypeScript errors for production
  },
  eslint: {
    ignoreDuringBuilds: false, // Fix ESLint errors for production
  },
}

export default nextConfig
```

#### Environment-Specific Settings

Create `vercel.json`:

```json
{
  "github": {
    "silent": true
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        }
      ]
    }
  ],
  "redirects": [
    {
      "source": "/analytics",
      "destination": "/app/analytics",
      "permanent": true
    }
  ]
}
```

---

## Post-Deployment Checklist

### Immediate Verification (0-5 minutes)

- [ ] Website loads at production URL
- [ ] No console errors in browser dev tools
- [ ] Public pages accessible (landing, about)
- [ ] Authentication pages accessible (login, signup)
- [ ] SSL certificate active (padlock in browser)
- [ ] Dev mode is OFF (check localStorage and environment)

### Authentication Testing (5-10 minutes)

- [ ] User can sign up with email
- [ ] Confirmation email received (check spam)
- [ ] User can log in with credentials
- [ ] User redirected to app after login
- [ ] Session persists across page refresh
- [ ] User can log out successfully

### Core Features Testing (10-20 minutes)

- [ ] Browse phrases works
- [ ] Search functionality works
- [ ] Bookmarks save correctly
- [ ] Progress tracking updates
- [ ] AI chat responds (test AI endpoint)
- [ ] Theme switching works (light/dark)
- [ ] Language switching works (4 languages)

### Admin Features Testing (5-10 minutes)

- [ ] Admin can access `/admin/overview`
- [ ] User management loads user list
- [ ] Phrase management shows phrases
- [ ] Content moderation works
- [ ] Learning standards editor loads
- [ ] Activity logs display correctly

### Performance Testing (5-10 minutes)

- [ ] Lighthouse score >90 (Performance)
- [ ] First Contentful Paint <1.5s
- [ ] Time to Interactive <3s
- [ ] No memory leaks (check DevTools)
- [ ] Mobile responsiveness verified

### Security Verification (5-10 minutes)

- [ ] Dev mode disabled in production
- [ ] RLS policies enforced (test unauthorized access)
- [ ] Admin routes protected (non-admin blocked)
- [ ] API routes require authentication
- [ ] Content moderation active
- [ ] HTTPS enforced (HTTP redirects to HTTPS)

### Database Health Check

```sql
-- Check user count
SELECT COUNT(*) FROM profiles;

-- Check phrase count
SELECT COUNT(*) FROM phrases;

-- Check active sessions
SELECT COUNT(*) FROM study_sessions WHERE created_at > NOW() - INTERVAL '24 hours';

-- Check RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
```

---

## Troubleshooting

### Build Failures

#### TypeScript Errors

```bash
# Check TypeScript errors locally
npm run build

# Fix common issues
npm install --save-dev @types/node @types/react @types/react-dom
```

#### Missing Dependencies

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Verify package.json is committed
git status
```

#### Next.js Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build
```

### Runtime Errors

#### Supabase Connection Issues

```javascript
// Test Supabase connection
const { data, error } = await supabase.from('phrases').select('count').single()
console.log('Supabase test:', { data, error })
```

**Solutions:**
- Verify `NEXT_PUBLIC_SUPABASE_URL` format (https://...)
- Check `NEXT_PUBLIC_SUPABASE_ANON_KEY` is correct
- Confirm Supabase project is not paused
- Check Supabase project region

#### Authentication Not Working

**Symptoms**: Users can't log in, redirected to login loop

**Solutions:**
1. Check redirect URLs in Supabase Auth settings
2. Verify `middleware.ts` is running correctly
3. Check browser cookies are enabled
4. Clear browser cache and cookies
5. Verify session cookie domain matches deployment URL

#### AI Features Not Responding

**Symptoms**: AI chat doesn't respond, 500 errors

**Solutions:**
1. Check Vercel AI Gateway is enabled
2. Verify model access: `anthropic/claude-haiku-4-5`
3. Check API route logs in Vercel dashboard
4. Test endpoint directly: `curl https://yourdomain.com/api/ai/chat`
5. Review Vercel function logs for errors

### Performance Issues

#### Slow Page Loads

**Diagnosis:**
```bash
# Run Lighthouse audit
npm install -g lighthouse
lighthouse https://yourdomain.com --view
```

**Solutions:**
- Enable image optimization (`unoptimized: false`)
- Add loading states to async components
- Implement code splitting for large components
- Enable compression in `next.config.mjs`

#### Database Slow Queries

**Diagnosis:**
```sql
-- Check slow queries
SELECT query, mean_exec_time, calls
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

**Solutions:**
- Apply indexes (see migration 025)
- Limit query results (already: 100-200 phrases)
- Add pagination to large lists
- Enable query caching

### Common Errors

#### "Dev mode should only be used in development"

**Cause**: `NEXT_PUBLIC_DEV_MODE=true` in production

**Solution**:
1. Remove environment variable from Vercel
2. Redeploy
3. Clear browser localStorage
4. Verify middleware warning disappears

#### "Row Level Security policy violation"

**Cause**: RLS policy blocking legitimate access

**Solution**:
1. Check user is authenticated: `supabase.auth.getUser()`
2. Verify RLS policies in Supabase dashboard
3. Test policy with SQL: `SELECT * FROM phrases WHERE ...`
4. Re-apply migration with RLS policies

#### "Could not resolve module"

**Cause**: Missing dependency or incorrect import path

**Solution**:
```bash
# Install missing dependency
npm install <package-name>

# Fix import paths
# Use @/ alias for absolute imports
import { Component } from '@/components/component'
```

---

## Rollback Procedures

### Vercel Rollback (Instant)

1. Go to Vercel Dashboard → Deployments
2. Find previous working deployment
3. Click "..." menu → "Promote to Production"
4. Confirm rollback
5. Previous version goes live immediately

### Database Rollback (Manual)

**Warning**: Database rollbacks are destructive. Always backup first!

#### Backup Database

```bash
# Using Supabase CLI
supabase db dump -f backup-$(date +%Y%m%d).sql

# Or use Supabase Dashboard
# Database → Backups → Create Backup
```

#### Restore from Backup

```bash
# Restore from dump
supabase db reset --db-url postgresql://...
psql postgresql://... < backup-20251110.sql
```

### Partial Rollback

If only specific tables need rollback:

```sql
-- Backup affected table
CREATE TABLE phrases_backup AS SELECT * FROM phrases;

-- Restore from backup
TRUNCATE TABLE phrases;
INSERT INTO phrases SELECT * FROM phrases_backup;
```

---

## Maintenance

### Regular Tasks

#### Daily
- [ ] Check Vercel deployment status
- [ ] Monitor error logs in Vercel dashboard
- [ ] Review moderation queue

#### Weekly
- [ ] Review Supabase database size
- [ ] Check user growth metrics
- [ ] Review AI usage and costs
- [ ] Backup database

#### Monthly
- [ ] Update dependencies: `npm update`
- [ ] Review Lighthouse performance
- [ ] Audit security (check for vulnerabilities)
- [ ] Review RLS policies

### Monitoring

**Vercel Analytics**:
- Page views
- Unique visitors
- Performance metrics (Core Web Vitals)

**Supabase Dashboard**:
- Database size and growth
- Active connections
- Query performance
- Auth metrics

### Scaling Considerations

#### When to Scale

- Database queries consistently >100ms
- Vercel function timeouts increasing
- User complaints about slow performance
- Database size >1GB

#### How to Scale

1. **Supabase**: Upgrade to Pro plan (more resources)
2. **Vercel**: Enable caching, CDN
3. **Database**: Add indexes, optimize queries
4. **Code**: Implement pagination, lazy loading

---

## Support and Resources

### Official Documentation
- **Next.js**: [nextjs.org/docs](https://nextjs.org/docs)
- **Supabase**: [supabase.com/docs](https://supabase.com/docs)
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)

### Project Documentation
- [CLAUDE.md](CLAUDE.md) - Development guide
- [SECURITY.md](SECURITY.md) - Security documentation
- [CHANGELOG.md](CHANGELOG.md) - Version history
- [DEV_MODE.md](DEV_MODE.md) - Development mode guide

### Getting Help
- **GitHub Issues**: Report bugs and feature requests
- **Vercel Support**: Contact via dashboard
- **Supabase Support**: support@supabase.io
- **HelpScout**: In-app support widget

---

**Document maintained by**: Claude Code
**Last deployment**: November 10, 2025
**Production URL**: [Your domain]
**Deployment frequency**: Continuous (on push to main)
