# Vercel Environment Setup Checklist

**Quick reference for configuring Vercel environments**

---

## Branch Structure ✅ COMPLETE

- [x] `main` - Production branch (created)
- [x] `preview` - Pre-production testing (created)
- [x] `dev` - Active development (created)

---

## Vercel Dashboard Configuration

### Step 1: Connect Repository

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Import `nyuchitech/nyuchi-lingo` from GitHub
3. Configure Project Settings

### Step 2: Configure Production Environment Variables

**Vercel Dashboard → Project → Settings → Environment Variables**

Add these variables and select **Production** only:

```bash
NEXT_PUBLIC_DEV_MODE = false
NEXT_PUBLIC_SUPABASE_URL = https://yqmqdiudhztddiyeerig.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY = [your-production-anon-key]
SUPABASE_SERVICE_ROLE_KEY = [your-production-service-role-key]
NODE_ENV = production
```

### Step 3: Configure Preview Environment Variables

Add these variables and select **Preview** only:

```bash
NEXT_PUBLIC_DEV_MODE = false
NEXT_PUBLIC_SUPABASE_URL = [your-staging-supabase-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [your-staging-anon-key]
SUPABASE_SERVICE_ROLE_KEY = [your-staging-service-role-key]
VERCEL_ENV = preview
```

### Step 4: Configure Development Environment Variables

**IMPORTANT**: Vercel's "Development" environment type corresponds to your `dev` branch.

Add these variables and select **Development** only:

```bash
NEXT_PUBLIC_DEV_MODE = true
NEXT_PUBLIC_SUPABASE_URL = [your-staging-supabase-url]
NEXT_PUBLIC_SUPABASE_ANON_KEY = [your-staging-anon-key]
SUPABASE_SERVICE_ROLE_KEY = [your-staging-service-role-key]
VERCEL_ENV = development
```

### Step 5: Configure Branch Deployments

**Vercel Dashboard → Project → Settings → Git**

1. **Production Branch**: Set to `main`
2. **Automatically Create Deployments**: Enable
3. **Preview Deployments**: Enable for all branches

---

## GitHub Branch Protection Rules

### Protect `main` Branch

**GitHub → Repository → Settings → Branches → Add Rule**

Branch name pattern: `main`

- [x] Require a pull request before merging
- [x] Require approvals: 1
- [x] Require status checks to pass before merging
- [x] Require branches to be up to date before merging
- [x] Do not allow bypassing the above settings

### Protect `preview` Branch

Branch name pattern: `preview`

- [x] Require a pull request before merging
- [x] Require approvals: 1 (optional, can be 0 for solo dev)
- [ ] Require status checks (optional)

### `dev` Branch (No Protection)

- No branch protection needed
- Allow direct pushes for fast iteration

---

## Deployment URL Mapping

After Vercel connects to your repository:

| Branch | Vercel Environment | URL | Dev Mode |
|--------|-------------------|-----|----------|
| `main` | Production | `https://nyuchi-lingo.com` | ❌ Disabled |
| `preview` | Preview | `https://nyuchi-lingo-git-preview.vercel.app` | ❌ Disabled |
| `dev` | Development | `https://nyuchi-lingo-git-dev.vercel.app` | ✅ Enabled |

---

## Verification Steps

### 1. Test Dev Environment

```bash
# Push to dev branch
git checkout dev
git push origin dev

# Wait for deployment (usually 1-2 minutes)
# Visit: https://nyuchi-lingo-git-dev.vercel.app

# Verify:
# - [ ] No login required (dev mode enabled)
# - [ ] Admin access granted automatically
# - [ ] Can access /admin routes
# - [ ] Browser console shows no auth errors
```

### 2. Test Preview Environment

```bash
# Merge dev to preview
git checkout preview
git merge dev
git push origin preview

# Wait for deployment
# Visit: https://nyuchi-lingo-git-preview.vercel.app

# Verify:
# - [ ] Login required (dev mode disabled)
# - [ ] Real authentication works
# - [ ] Can create account at /auth/sign-up
# - [ ] Admin access only with admin role
# - [ ] /admin redirects to /auth/login without admin role
```

### 3. Test Production Environment

```bash
# Merge preview to main (via PR)
git checkout main
git merge preview
git push origin main

# Wait for deployment
# Visit: https://nyuchi-lingo.com

# Verify:
# - [ ] Login required (dev mode disabled)
# - [ ] Production database connected
# - [ ] Real user data (if any)
# - [ ] Analytics enabled
# - [ ] Performance monitoring active
# - [ ] All features working
```

---

## Environment Variable Verification

### Check Variables on Each Environment

#### Production (`main` branch)

```bash
# In your deployed app, check:
console.log('Environment:', process.env.VERCEL_ENV)
console.log('Dev Mode:', process.env.NEXT_PUBLIC_DEV_MODE)
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)

# Expected output:
# Environment: production
# Dev Mode: false
# Supabase URL: https://yqmqdiudhztddiyeerig.supabase.co
```

#### Preview (`preview` branch)

```bash
# Expected output:
# Environment: preview
# Dev Mode: false
# Supabase URL: [your-staging-url]
```

#### Development (`dev` branch)

```bash
# Expected output:
# Environment: development
# Dev Mode: true
# Supabase URL: [your-staging-url]
```

---

## Troubleshooting

### Issue: Dev mode still enabled in production

**Check**:
1. Vercel Dashboard → Environment Variables
2. Verify `NEXT_PUBLIC_DEV_MODE` is set to `false` for Production
3. Redeploy: `git commit --allow-empty -m "Redeploy" && git push origin main`

### Issue: Wrong Supabase database in preview

**Check**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is different for Production vs Preview
2. Redeploy preview: `git push origin preview`

### Issue: Preview deployment not creating

**Check**:
1. Vercel Dashboard → Settings → Git
2. Ensure "Preview Deployments" is enabled
3. Check branch is pushed to GitHub: `git branch -r`

---

## Quick Commands Reference

```bash
# Switch to dev and push changes
git checkout dev
git push origin dev

# Promote dev to preview
git checkout preview
git merge dev
git push origin preview

# Promote preview to production
git checkout main
git merge preview
git push origin main

# Check current environment
git branch --show-current

# View all branches
git branch -a

# See deployment status
# Visit: https://vercel.com/dashboard
```

---

## Next Steps

1. **Create Staging Supabase Project** (if not done)
   - Go to https://supabase.com/dashboard
   - Create new project for staging
   - Copy connection details
   - Update Vercel Preview + Development environment variables

2. **Set up Branch Protection Rules**
   - Protect `main` branch
   - Protect `preview` branch (optional)
   - Leave `dev` unprotected

3. **Test the Workflow**
   - Push to `dev`
   - Verify dev deployment
   - Merge to `preview`
   - Test with real auth
   - Merge to `main`
   - Verify production

4. **Configure Domain** (if not done)
   - Add custom domain in Vercel
   - Point DNS to Vercel
   - Enable SSL

5. **Set up Monitoring**
   - Enable Vercel Analytics
   - Configure error tracking (Sentry, etc.)
   - Set up uptime monitoring

---

**See Also**: [VERCEL_ENVIRONMENTS.md](VERCEL_ENVIRONMENTS.md) for complete documentation
