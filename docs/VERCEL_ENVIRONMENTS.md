# Vercel Environments Strategy for Nyuchi Lingo

**Version**: 1.0
**Date**: November 11, 2025
**Purpose**: Multi-environment deployment strategy leveraging Vercel's environment system

---

## Vercel Environment Types

Vercel provides three distinct environment types mapped to specific branches:

| Environment | Git Branch | Purpose | URL Pattern | Dev Mode |
|-------------|-----------|---------|-------------|----------|
| **Production** | `main` | Live user-facing app | `nyuchi-lingo.com` | ❌ Disabled |
| **Preview** | `preview` | Pre-production testing | `nyuchi-lingo-git-preview.vercel.app` | ❌ Disabled |
| **Development** | `dev` | Active development/staging | `nyuchi-lingo-git-dev.vercel.app` | ✅ Enabled |

---

## Recommended Environment Strategy

### 1. Production Environment (`main` branch)

**Purpose**: Live production app for real users

**Branch Protection**:
- Require PR reviews before merging
- Require status checks to pass
- No direct pushes allowed

**Configuration**:
```bash
# Vercel Dashboard → Environment Variables → Production
NEXT_PUBLIC_DEV_MODE="false"
NEXT_PUBLIC_SUPABASE_URL="https://yqmqdiudhztddiyeerig.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[production-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[production-service-role-key]"
NODE_ENV="production"
```

**Key Points**:
- ✅ **Dev mode MUST be disabled**
- ✅ Production Supabase database
- ✅ Real authentication required
- ✅ Analytics enabled
- ✅ Error tracking enabled
- ✅ Performance monitoring

**Deployment URL**: `https://nyuchi-lingo.com`

**Git Workflow**:
```bash
# Merge preview to main after thorough testing
git checkout main
git merge preview
git push origin main
# Vercel auto-deploys to production
```

---

### 2. Preview Environment (`preview` branch)

**Purpose**: Pre-production testing and client demos

**Branch Protection**:
- Require PR reviews before merging
- Optional status checks

**Configuration**:
```bash
# Vercel Dashboard → Environment Variables → Preview
NEXT_PUBLIC_DEV_MODE="false"
NEXT_PUBLIC_SUPABASE_URL="https://[staging-project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[staging-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[staging-service-role-key]"
VERCEL_ENV="preview"
```

**Key Points**:
- ✅ Separate staging Supabase project
- ✅ Real auth flow (dev mode disabled)
- ✅ Safe for breaking changes
- ✅ Client demos and UAT
- ✅ Final testing before production

**Deployment URL**: `https://nyuchi-lingo-git-preview.vercel.app`

**Git Workflow**:
```bash
# Merge dev to preview when ready for pre-production testing
git checkout preview
git merge dev
git push origin preview
# Vercel auto-deploys to preview URL
# Test thoroughly before merging to main
```

---

### 3. Development Environment (`dev` branch)

**Purpose**: Active development with dev mode enabled

**Branch Protection**:
- No protection (fast iteration)
- Direct pushes allowed

**Configuration**:
```bash
# Vercel Dashboard → Environment Variables → Development
NEXT_PUBLIC_DEV_MODE="true"
NEXT_PUBLIC_SUPABASE_URL="https://[staging-project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[staging-anon-key]"
SUPABASE_SERVICE_ROLE_KEY="[staging-service-role-key]"
VERCEL_ENV="development"
```

**Key Points**:
- ✅ **Dev mode enabled** for fast iteration
- ✅ Staging Supabase project
- ✅ No authentication required
- ✅ Admin access by default
- ✅ Fast testing and debugging

**Deployment URL**: `https://nyuchi-lingo-git-dev.vercel.app`

**Git Workflow**:
```bash
# Push directly to dev for rapid iteration
git checkout dev
git add .
git commit -m "feat: add new feature"
git push origin dev
# Vercel auto-deploys to dev URL
```

---

### 4. Local Development

**Purpose**: Local development with hot reload

**Configuration**:
```bash
# .env.local (Local only, not committed)
NEXT_PUBLIC_DEV_MODE="true"  # Enable for local dev
NEXT_PUBLIC_SUPABASE_URL="https://[staging-project].supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="[staging-anon-key]"

# Optional: Local Supabase
# NEXT_PUBLIC_SUPABASE_URL="http://localhost:54321"
```

**Key Points**:
- ✅ Dev mode enabled for quick iteration
- ✅ Uses staging Supabase (or local)
- ✅ Hot reload enabled
- ✅ No auth required (with dev mode)
- ✅ Fast feedback loop

**Commands**:
```bash
npm run dev  # Start local server
```

---

## Recommended Setup: Three Supabase Projects

### Option A: Full Isolation (Recommended for Production Apps)

```
Production Supabase Project (yqmqdiudhztddiyeerig.supabase.co)
├── Real user data
├── Real authentication
├── Production database
└── Connected to: Vercel Production (main branch)

Staging Supabase Project ([create new project])
├── Test data
├── Safe for breaking changes
├── Separate database
└── Connected to: Vercel Preview + Local Dev

Development Supabase Project (Local - Optional)
├── Local docker instance
├── Completely isolated
├── No internet required
└── Connected to: Local development only
```

### Option B: Shared Staging (Current Setup)

```
Production Supabase (yqmqdiudhztddiyeerig.supabase.co)
├── Real user data
└── Connected to: Vercel Production (main branch)

Staging Supabase (same project, different connection)
├── Test data (same database)
└── Connected to: Vercel Preview + Local Dev
```

**⚠️ Warning**: Option B shares the same database. Use Option A for true isolation.

---

## Vercel Environment Variables Configuration

### Setting Environment Variables in Vercel Dashboard

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add variables with proper scope**:

```
Variable Name: NEXT_PUBLIC_DEV_MODE
Value: false
Environments: ✅ Production  ☐ Preview  ☐ Development
```

```
Variable Name: NEXT_PUBLIC_DEV_MODE
Value: false
Environments: ☐ Production  ✅ Preview  ☐ Development
```

```
Variable Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://yqmqdiudhztddiyeerig.supabase.co
Environments: ✅ Production  ☐ Preview  ☐ Development
```

```
Variable Name: NEXT_PUBLIC_SUPABASE_URL
Value: https://[staging-project].supabase.co
Environments: ☐ Production  ✅ Preview  ☐ Development
```

### Critical Variables to Set

| Variable | Production | Preview | Development |
|----------|-----------|---------|-------------|
| `NEXT_PUBLIC_DEV_MODE` | `false` | `false` | Not needed (use .env.local) |
| `NEXT_PUBLIC_SUPABASE_URL` | Production URL | Staging URL | Local .env.local |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Production Key | Staging Key | Local .env.local |
| `SUPABASE_SERVICE_ROLE_KEY` | Production Key | Staging Key | Local .env.local |
| `NODE_ENV` | `production` | `production` | `development` |

---

## Git Branch Strategy

### Three-Branch Model

```
main                    # Production (https://nyuchi-lingo.com)
  ↑
  PR (thoroughly tested)
  ↑
preview                # Pre-production (https://...-git-preview.vercel.app)
  ↑
  PR (when feature complete)
  ↑
dev                    # Active development (https://...-git-dev.vercel.app)
  ↑
  Direct pushes
  ↑
feature branches       # Optional for complex features
```

### Branch Purposes

| Branch | Purpose | Dev Mode | Auth Required | Push Access |
|--------|---------|----------|---------------|-------------|
| `main` | Production | ❌ No | ✅ Yes | 🔒 PR only |
| `preview` | Pre-production testing | ❌ No | ✅ Yes | 🔒 PR only |
| `dev` | Active development | ✅ Yes | ❌ No | ✅ Direct |

### Standard Workflow

```bash
# DAY-TO-DAY DEVELOPMENT (dev branch)
# 1. Start working on dev branch
git checkout dev
git pull origin dev

# 2. Make changes and test locally
# Edit files...
npm run dev
# Test with dev mode enabled

# 3. Push directly to dev (triggers dev deployment)
git add .
git commit -m "feat: add category badges"
git push origin dev
# Auto-deploys to: https://nyuchi-lingo-git-dev.vercel.app
# Test online with dev mode enabled

# 4. Continue iterating on dev
git add .
git commit -m "fix: badge styling"
git push origin dev
# Keep pushing to dev until feature is complete

# MOVING TO PREVIEW (when ready for real auth testing)
# 5. Create PR from dev to preview
git checkout preview
git pull origin preview
# Open PR: dev → preview

# 6. Review and merge to preview
# Triggers preview deployment
# URL: https://nyuchi-lingo-git-preview.vercel.app
# Test with REAL authentication (dev mode disabled)

# 7. Test thoroughly on preview
# - Real auth flow
# - All features work without dev mode
# - Client demos
# - UAT (User Acceptance Testing)

# DEPLOYING TO PRODUCTION (when preview is stable)
# 8. Create PR from preview to main
# Open PR: preview → main

# 9. Final review and merge to main
# Triggers production deployment
# URL: https://nyuchi-lingo.com
# Monitor production carefully

# 10. If issues found in production
git checkout dev
# Fix issues
git push origin dev
# Then repeat preview → main process
```

### Quick Push to Dev

```bash
# For rapid iteration (most common workflow)
git checkout dev
# Make changes...
git add .
git commit -m "feat: implement new feature"
git push origin dev
# Done! Auto-deploys to dev environment
```

### Feature Branch Workflow (Optional)

For complex features that need isolation:

```bash
# 1. Create feature branch from dev
git checkout dev
git pull origin dev
git checkout -b feature/complex-auth-system

# 2. Work on feature
git add .
git commit -m "feat: add OAuth integration"
git push origin feature/complex-auth-system
# This creates a temporary preview URL

# 3. When ready, merge to dev
git checkout dev
git merge feature/complex-auth-system
git push origin dev
# Now available on dev environment

# 4. Delete feature branch
git branch -d feature/complex-auth-system
git push origin --delete feature/complex-auth-system
```

---

## Dev Mode Management by Environment

### Production (main)
```typescript
// MUST be false - enforced by environment variable
if (process.env.NEXT_PUBLIC_DEV_MODE === "true") {
  throw new Error("Dev mode cannot be enabled in production!")
}
```

### Preview (feature branches)
```typescript
// Should be false to test real auth flow
// Can temporarily enable for debugging specific issues
const devMode = process.env.NEXT_PUBLIC_DEV_MODE === "true"
```

### Development (local)
```typescript
// Enable in .env.local for fast iteration
// NEXT_PUBLIC_DEV_MODE="true"
```

---

## Use Cases by Environment

### Production Environment

**Use for**:
- ✅ Live user traffic
- ✅ Real data operations
- ✅ Production monitoring
- ✅ Performance testing with real load

**Never use for**:
- ❌ Testing new features
- ❌ Database migrations (test in staging first)
- ❌ Breaking changes
- ❌ Dev mode experiments

### Preview Environment

**Use for**:
- ✅ Feature testing before production
- ✅ PR reviews with live URLs
- ✅ Client demos
- ✅ UAT (User Acceptance Testing)
- ✅ Database migration testing
- ✅ Integration testing

**Example URLs**:
```
develop branch:
https://nyuchi-lingo-git-develop.vercel.app

feature/category-badges:
https://nyuchi-lingo-git-feature-category-badges.vercel.app

fix/sidebar-mobile:
https://nyuchi-lingo-git-fix-sidebar-mobile.vercel.app
```

### Development Environment

**Use for**:
- ✅ Rapid prototyping
- ✅ Local testing
- ✅ Debugging
- ✅ Hot reload development
- ✅ Offline work (with local Supabase)

---

## Database Migration Strategy

### 1. Development
```bash
# Test migration locally
supabase db reset
supabase migration up

# Test with dev mode enabled
npm run dev
# Verify changes work
```

### 2. Staging/Preview
```bash
# Apply to staging Supabase project
supabase link --project-ref [staging-project-ref]
supabase db push

# Deploy to preview environment
git push origin feature/new-migration

# Test on preview URL
# https://nyuchi-lingo-git-feature-new-migration.vercel.app
```

### 3. Production
```bash
# After testing in staging, apply to production
supabase link --project-ref yqmqdiudhztddiyeerig
supabase db push

# Deploy to production
git checkout main
git merge develop
git push origin main

# Monitor for issues
# https://nyuchi-lingo.com
```

---

## CI/CD Pipeline

### Automatic Deployments

**On Push to Any Branch**:
1. Vercel detects push
2. Runs `npm run build`
3. Deploys to preview URL
4. Comments on PR with URL
5. Runs status checks

**On Push to main**:
1. Vercel detects push to main
2. Runs `npm run build`
3. Deploys to production domain
4. Updates DNS automatically
5. Sends deployment notifications

### Build Command
```json
{
  "scripts": {
    "build": "next build",
    "vercel-build": "next build"
  }
}
```

### Vercel Configuration
```json
// vercel.json
{
  "buildCommand": "npm run build",
  "devCommand": "npm run dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "NEXT_PUBLIC_DEV_MODE": "false"
  }
}
```

---

## Monitoring & Alerts

### Production Monitoring

**Vercel Analytics**:
- Page views
- Performance metrics
- Core Web Vitals
- Error tracking

**Setup**:
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

### Preview Environment Monitoring

**Lighthouse CI**:
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [pull_request]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://nyuchi-lingo-git-${{ github.head_ref }}.vercel.app
```

---

## Security Best Practices

### Environment Variable Security

**DO**:
- ✅ Use Vercel's encrypted environment variables
- ✅ Different keys for each environment
- ✅ Rotate keys regularly
- ✅ Use service role keys only server-side
- ✅ Prefix public vars with `NEXT_PUBLIC_`

**DON'T**:
- ❌ Commit `.env.local` to git
- ❌ Share production keys
- ❌ Use production DB in preview
- ❌ Enable dev mode in production
- ❌ Expose service role keys to client

### .gitignore
```gitignore
# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Vercel
.vercel
```

---

## Quick Setup Checklist

### Initial Setup

- [ ] Create staging Supabase project
- [ ] Configure Vercel environment variables
  - [ ] Production: Dev mode false, production DB
  - [ ] Preview: Dev mode false, staging DB
- [ ] Set up branch protection for `main`
- [ ] Configure `.env.local` for local dev
- [ ] Add `.env*` to `.gitignore`
- [ ] Test deployment to preview
- [ ] Test deployment to production

### Per Feature

- [ ] Create feature branch from `develop`
- [ ] Make changes locally (dev mode enabled)
- [ ] Push to GitHub
- [ ] Review preview deployment
- [ ] Test with real auth (dev mode disabled)
- [ ] Open PR to `develop`
- [ ] Merge after review
- [ ] Test on `develop` preview
- [ ] Open PR to `main`
- [ ] Deploy to production

---

## Common Issues & Solutions

### Issue: Dev mode enabled in production

**Symptoms**: Everyone has admin access

**Solution**:
```bash
# In Vercel Dashboard
# Environment Variables → NEXT_PUBLIC_DEV_MODE → Production
# Set to: false

# Redeploy
vercel --prod
```

### Issue: Wrong database in preview

**Symptoms**: Preview shows production data

**Solution**:
```bash
# In Vercel Dashboard
# Environment Variables → NEXT_PUBLIC_SUPABASE_URL → Preview
# Set to: https://[staging-project].supabase.co

# Redeploy preview
git push origin [branch-name]
```

### Issue: Environment variables not updating

**Symptoms**: Old values persist after update

**Solution**:
```bash
# Redeploy to pick up new environment variables
vercel --prod  # For production
# Or push new commit to trigger rebuild
```

---

## Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vercel Deployment Environments](https://vercel.com/docs/concepts/deployments/environments)
- [Supabase Multi-Environment Setup](https://supabase.com/docs/guides/cli/managing-environments)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)

---

**Last Updated**: November 11, 2025
**Maintained By**: Nyuchi Tech Team
