# Security Documentation - Nyuchi Lingo

**Last Updated**: November 10, 2025
**Version**: 2.0
**Security Level**: Production-Ready

---

## Table of Contents

1. [Security Overview](#security-overview)
2. [Authentication System](#authentication-system)
3. [Dev Mode Security](#dev-mode-security)
4. [Row Level Security (RLS)](#row-level-security-rls)
5. [Admin Access Control](#admin-access-control)
6. [AI Content Moderation](#ai-content-moderation)
7. [API Endpoint Security](#api-endpoint-security)
8. [Environment Variable Protection](#environment-variable-protection)
9. [Security Best Practices](#security-best-practices)
10. [Vulnerability Reporting](#vulnerability-reporting)

---

## Security Overview

### Security Architecture

Nyuchi Lingo implements a **defense-in-depth** security model with multiple layers:

1. **Application Layer**: Next.js middleware, authentication checks
2. **API Layer**: Route protection, request validation
3. **Database Layer**: Row Level Security (RLS) policies
4. **Content Layer**: AI-powered moderation
5. **Infrastructure Layer**: HTTPS, CORS, security headers

### Security Principles

- **Least Privilege**: Users access only their own data
- **Defense in Depth**: Multiple security layers
- **Zero Trust**: All requests validated, even authenticated ones
- **Secure by Default**: Security enabled unless explicitly disabled
- **Fail Secure**: Errors default to denying access

---

## Authentication System

### Supabase Auth

**Provider**: Supabase Authentication
**Method**: Email + Password
**Session Management**: HTTP-only cookies

#### Authentication Flow

```
1. User submits credentials
   ↓
2. Supabase validates credentials
   ↓
3. Session cookie set (HTTP-only, Secure, SameSite)
   ↓
4. User redirected to app
   ↓
5. Middleware validates session on each request
```

### Server-Side Authentication

**File**: `lib/supabase/server.ts`

```typescript
import { createClient } from '@/lib/supabase/server'

// In Server Component or API Route
const supabase = await createClient()
const { data: { user }, error } = await supabase.auth.getUser()

if (!user) {
  // Redirect to login or return 401
}
```

**Key Features**:
- Async cookie handling with `cookies()` from Next.js
- Automatic session refresh
- Secure cookie storage

### Client-Side Authentication

**File**: `lib/supabase/client.ts`

```typescript
import { createClient } from '@/lib/supabase/client'

// In Client Component
const supabase = createClient()
const { data: { user } } = await supabase.auth.getUser()
```

**Key Features**:
- Singleton pattern (one instance per app)
- Automatic token refresh
- Browser localStorage for session

### Middleware Protection

**File**: `middleware.ts`

```typescript
export async function middleware(request: NextRequest) {
  // 1. Check dev mode first (development only)
  // 2. Validate Supabase session
  // 3. Refresh session if needed
  // 4. Redirect unauthenticated users to /auth/login
  // 5. Allow authenticated users to proceed
}
```

**Protected Routes**:
- `/app/*` - Requires authentication
- `/admin/*` - Requires authentication + admin role
- `/api/*` - Varies by endpoint

**Public Routes**:
- `/` - Landing page
- `/about` - About page
- `/auth/login` - Login page
- `/auth/signup` - Signup page
- `/auth/callback` - OAuth callback

### Session Security

**Cookie Attributes**:
```
sb-access-token: {
  httpOnly: true,      // Not accessible via JavaScript
  secure: true,        // HTTPS only
  sameSite: 'lax',     // CSRF protection
  path: '/',
  maxAge: 3600         // 1 hour
}
```

**Session Expiry**:
- Access token: 1 hour
- Refresh token: 30 days
- Auto-refresh: Before expiry

**Session Invalidation**:
- User logout: Immediate
- Password change: All sessions invalidated
- Admin suspension: All sessions invalidated

---

## Dev Mode Security

### Overview

**File**: `lib/dev-mode.ts`

Dev mode is a **development-only** feature that bypasses authentication for local testing.

### Critical Security Warning

**NEVER ENABLE DEV MODE IN PRODUCTION**

```bash
# DANGEROUS - Never do this in production!
NEXT_PUBLIC_DEV_MODE=true
```

**Consequences if enabled in production**:
- ALL authentication bypassed
- EVERYONE becomes admin
- ALL data accessible to everyone
- Complete security breach

### How Dev Mode Works

When `NEXT_PUBLIC_DEV_MODE=true`:

1. Middleware skips authentication checks
2. Mock user injected:
   ```typescript
   {
     id: '00000000-0000-0000-0000-000000000000',
     email: 'dev@nyuchi.com',
     role: 'admin'
   }
   ```
3. All admin checks pass
4. RLS policies recognize dev UUID

### Dev Mode Protections

**Built-in Warnings**:

```typescript
// middleware.ts
if (process.env.NEXT_PUBLIC_DEV_MODE === 'true') {
  console.warn('⚠️ DEV MODE ENABLED - This should ONLY be used in development!')
}
```

**Environment Checks**:
```typescript
// Only allow in development
if (process.env.NODE_ENV === 'production' && isDevMode()) {
  throw new Error('Dev mode cannot be enabled in production!')
}
```

### Safe Development Practices

**Local Development**:
```bash
# .env.local (not committed)
NEXT_PUBLIC_DEV_MODE=true
```

**Production**:
```bash
# Vercel Environment Variables
# DO NOT ADD NEXT_PUBLIC_DEV_MODE
# Or explicitly set to false
NEXT_PUBLIC_DEV_MODE=false
```

**Git Ignore**:
```
.env.local
.env*.local
```

---

## Row Level Security (RLS)

### Overview

**Provider**: PostgreSQL Row Level Security via Supabase
**Default**: All tables have RLS enabled
**Principle**: Users can only access their own data

### RLS Policies by Table

#### `profiles` Table

```sql
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id OR is_admin());

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id OR is_admin());

-- Admins can view all profiles
-- Handled by is_admin() function
```

#### `phrases` Table

```sql
-- All authenticated users can read phrases
CREATE POLICY "Phrases are publicly readable"
ON phrases FOR SELECT
TO authenticated
USING (true);

-- Only admins can modify phrases
CREATE POLICY "Only admins can modify phrases"
ON phrases FOR ALL
USING (is_admin());
```

#### `bookmarks` Table

```sql
-- Users can only see their own bookmarks
CREATE POLICY "Users can view own bookmarks"
ON bookmarks FOR SELECT
USING (auth.uid() = user_id OR is_admin());

-- Users can create their own bookmarks
CREATE POLICY "Users can create own bookmarks"
ON bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own bookmarks
CREATE POLICY "Users can delete own bookmarks"
ON bookmarks FOR DELETE
USING (auth.uid() = user_id OR is_admin());
```

#### `phrase_progress` Table

```sql
-- Users can only see their own progress
CREATE POLICY "Users can view own progress"
ON phrase_progress FOR SELECT
USING (auth.uid() = user_id OR is_admin());

-- Users can update their own progress
CREATE POLICY "Users can update own progress"
ON phrase_progress FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can modify own progress"
ON phrase_progress FOR UPDATE
USING (auth.uid() = user_id);
```

#### `ai_conversations` & `ai_messages` Tables

```sql
-- Users can only access their own AI conversations
CREATE POLICY "Users can view own conversations"
ON ai_conversations FOR SELECT
USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Users can create own conversations"
ON ai_conversations FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Same for ai_messages
CREATE POLICY "Users can view own messages"
ON ai_messages FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM ai_conversations
    WHERE id = ai_messages.conversation_id
    AND user_id = auth.uid()
  ) OR is_admin()
);
```

#### `moderation_alerts` Table

```sql
-- Only admins can view moderation alerts
CREATE POLICY "Only admins can view moderation"
ON moderation_alerts FOR SELECT
USING (is_admin());

CREATE POLICY "Only admins can update moderation"
ON moderation_alerts FOR UPDATE
USING (is_admin());
```

### Admin Function

**File**: Database function `is_admin()`

```sql
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  -- Check for dev mode UUID
  IF auth.uid() = '00000000-0000-0000-0000-000000000000'::uuid THEN
    RETURN true;
  END IF;

  -- Check actual user role
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### Testing RLS Policies

```sql
-- Test as specific user
SET LOCAL role authenticated;
SET LOCAL request.jwt.claim.sub = 'user-uuid-here';

-- Try to access data
SELECT * FROM bookmarks; -- Should only see own bookmarks

-- Reset
RESET role;
```

---

## Admin Access Control

### Three-Layer Admin Protection

1. **Application Layer**: React component checks
2. **API Layer**: Route handler checks
3. **Database Layer**: RLS policies

### Application Layer

**File**: `lib/hooks/use-admin.ts`

```typescript
export function useAdmin() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    async function checkAdmin() {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        setIsAdmin(false)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      setIsAdmin(profile?.role === 'admin')
    }

    checkAdmin()
  }, [])

  return { isAdmin }
}
```

**Usage**:
```typescript
'use client'

export function AdminComponent() {
  const { isAdmin } = useAdmin()

  if (!isAdmin) {
    return <div>Access Denied</div>
  }

  return <AdminDashboard />
}
```

### API Layer

**File**: `lib/supabase/admin.ts`

```typescript
export async function isAdmin(): Promise<boolean> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return false

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return profile?.role === 'admin'
}

export async function requireAdmin() {
  const admin = await isAdmin()

  if (!admin) {
    throw new Error('Admin access required')
  }
}
```

**Usage in API Routes**:
```typescript
// app/api/admin/users/route.ts
import { requireAdmin } from '@/lib/supabase/admin'

export async function GET() {
  try {
    await requireAdmin() // Throws if not admin

    // Admin-only logic here
    const users = await fetchUsers()
    return Response.json(users)
  } catch (error) {
    return Response.json({ error: 'Unauthorized' }, { status: 403 })
  }
}
```

### Database Layer

Enforced via RLS policies (see above).

### Admin Routes

All protected admin routes:
- `/admin/overview` - Dashboard
- `/admin/users` - User management
- `/admin/phrases` - Content management
- `/admin/standards` - Learning standards
- `/admin/moderation` - Content moderation
- `/admin/activity` - Activity logs

### Admin API Routes

All require `requireAdmin()`:
- `/api/admin/learning-standards`
- `/api/admin/update-role`
- `/api/admin/user-action`
- `/api/admin/moderation/[id]`

---

## AI Content Moderation

### Overview

**Provider**: Anthropic Claude Haiku 4.5 via Vercel AI Gateway
**File**: `lib/ai/moderation.ts`
**Purpose**: Detect inappropriate user-generated content

### Moderation Categories

Content checked for:
- **Sexual Content**: Explicit or suggestive material
- **Hate Speech**: Targeting individuals or groups
- **Harassment**: Bullying or threatening behavior
- **Violence**: Graphic or threatening content
- **Self-Harm**: Content promoting harm to oneself
- **Abuse**: Inappropriate language or behavior

### Moderation Flow

```
1. User submits message
   ↓
2. moderateContent() called
   ↓
3. AI analyzes content
   ↓
4. Returns flagged categories (if any)
   ↓
5. If flagged: Create moderation_alert
   ↓
6. If safe: Proceed with request
```

### Implementation

```typescript
// lib/ai/moderation.ts
export async function moderateContent(content: string): Promise<ModerationResult> {
  const result = await streamText({
    model: anthropic('claude-haiku-4.5'),
    prompt: `Analyze this content for: sexual, hate, harassment, violence, self-harm, abuse.

Content: ${content}

Return JSON: { "flagged": boolean, "categories": [...] }`,
  })

  const analysis = await parseResult(result)

  if (analysis.flagged) {
    // Create moderation alert for admin review
    await createModerationAlert(content, analysis.categories)
  }

  return analysis
}
```

### Moderation Integration

**AI Chat Route** (`app/api/ai/chat/route.ts`):

```typescript
export async function POST(req: Request) {
  const { message } = await req.json()

  // Moderate user input
  const moderation = await moderateContent(message)

  if (moderation.flagged) {
    return Response.json({
      error: 'Message flagged for moderation',
      categories: moderation.categories
    }, { status: 400 })
  }

  // Proceed with AI response
  const response = await generateAIResponse(message)
  return response
}
```

### Admin Moderation Queue

**Route**: `/admin/moderation`

Admins can:
- View all flagged content
- Review flagged messages
- Approve or reject content
- Suspend users if needed

**API**: `/api/admin/moderation/[id]`

```typescript
// Approve content
PATCH /api/admin/moderation/123 { status: 'approved' }

// Reject and take action
PATCH /api/admin/moderation/123 {
  status: 'rejected',
  action: 'suspend_user'
}
```

---

## API Endpoint Security

### Authentication Required

Most API routes require authentication:

```typescript
// Check authentication
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  return Response.json({ error: 'Unauthorized' }, { status: 401 })
}
```

### Admin-Only Endpoints

```typescript
// Require admin role
await requireAdmin()
```

### Rate Limiting

**Vercel Built-in**:
- Automatic DDoS protection
- Rate limiting per IP
- Edge network distribution

**Custom Rate Limiting** (if needed):

```typescript
// Example: Rate limit AI chat
const rateLimit = new Map()

export async function POST(req: Request) {
  const ip = req.headers.get('x-forwarded-for')
  const requests = rateLimit.get(ip) || 0

  if (requests > 20) { // 20 requests per minute
    return Response.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  rateLimit.set(ip, requests + 1)
  setTimeout(() => rateLimit.delete(ip), 60000) // Reset after 1 minute

  // Process request
}
```

### Input Validation

**Using Zod**:

```typescript
import { z } from 'zod'

const messageSchema = z.object({
  message: z.string().min(1).max(1000),
  conversationId: z.string().uuid().optional(),
})

export async function POST(req: Request) {
  const body = await req.json()

  // Validate input
  const result = messageSchema.safeParse(body)

  if (!result.success) {
    return Response.json({
      error: 'Invalid input',
      details: result.error.issues
    }, { status: 400 })
  }

  // Process validated data
  const { message, conversationId } = result.data
}
```

### CORS Protection

**Next.js Automatic**:
- Same-origin requests allowed
- Cross-origin blocked by default

**Custom CORS** (if needed):

```typescript
export async function POST(req: Request) {
  // Set CORS headers
  const headers = {
    'Access-Control-Allow-Origin': 'https://yourdomain.com',
    'Access-Control-Allow-Methods': 'POST',
    'Access-Control-Allow-Headers': 'Content-Type',
  }

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers })
  }

  // Process request
  const response = await processRequest(req)
  return new Response(response, { headers })
}
```

---

## Environment Variable Protection

### Best Practices

1. **Never commit secrets to Git**
   ```gitignore
   .env.local
   .env*.local
   .env.production
   ```

2. **Use NEXT_PUBLIC_ prefix only for client-side variables**
   ```bash
   # Client-side (exposed in browser)
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...

   # Server-side (never exposed)
   SUPABASE_SERVICE_ROLE_KEY=... # If needed
   ```

3. **Different values per environment**
   ```bash
   # Development
   NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321

   # Production
   NEXT_PUBLIC_SUPABASE_URL=https://prod.supabase.co
   ```

### Supabase Keys

**Anon Key** (safe to expose):
- Public key for client-side usage
- Enforces RLS policies
- No special privileges

**Service Role Key** (NEVER expose):
- Bypasses RLS
- Full database access
- Only use server-side if absolutely necessary
- Currently NOT used in Nyuchi Lingo (good!)

### Vercel AI Gateway

**No API keys needed!**
- Vercel manages API keys
- Access controlled via Vercel dashboard
- No keys in environment variables
- Secure by default

---

## Security Best Practices

### For Developers

1. **Always validate user input**
   - Use Zod or similar for schema validation
   - Sanitize HTML input
   - Limit input length

2. **Never trust client-side data**
   - Validate on server
   - Re-check permissions
   - Verify user identity

3. **Use parameterized queries**
   ```typescript
   // Good - Supabase handles this
   await supabase.from('phrases').select('*').eq('id', phraseId)

   // Bad - SQL injection risk (don't do raw queries)
   await supabase.rpc('execute', { query: `SELECT * FROM phrases WHERE id = ${phraseId}` })
   ```

4. **Implement proper error handling**
   ```typescript
   try {
     const result = await riskyOperation()
     return result
   } catch (error) {
     console.error('Error:', error)
     // Don't expose internal errors to users
     return { error: 'Operation failed' }
   }
   ```

5. **Log security events**
   ```typescript
   // Log admin actions
   console.log('[ADMIN] User suspended:', { adminId, targetUserId })

   // Log moderation flags
   console.log('[MODERATION] Content flagged:', { userId, categories })
   ```

### For Admins

1. **Review moderation queue regularly**
2. **Monitor unusual user activity**
3. **Keep user list updated (remove inactive admins)**
4. **Review database backups**
5. **Test security policies periodically**

### For Users

1. **Use strong passwords** (8+ characters, mixed case, numbers)
2. **Don't share login credentials**
3. **Report inappropriate content**
4. **Log out on shared devices**

---

## Security Checklist

### Pre-Deployment

- [ ] Dev mode disabled in production
- [ ] Environment variables set correctly
- [ ] No secrets committed to Git
- [ ] RLS policies applied to all tables
- [ ] Admin checks in place on all admin routes
- [ ] Input validation on all API routes
- [ ] Error messages don't expose internals
- [ ] HTTPS enforced
- [ ] Security headers configured

### Post-Deployment

- [ ] Test authentication flow
- [ ] Verify RLS policies work
- [ ] Test admin access control
- [ ] Verify AI moderation works
- [ ] Check error logs for security issues
- [ ] Test unauthorized access attempts
- [ ] Verify session management
- [ ] Check for exposed secrets

---

## Vulnerability Reporting

### Responsible Disclosure

If you discover a security vulnerability:

1. **Do NOT** open a public GitHub issue
2. **Do NOT** share publicly before fix is deployed
3. **Contact**: [Your security email]
4. **Provide**:
   - Description of vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: Within 24 hours
- **Assessment**: Within 48 hours
- **Fix**: Within 7 days (for critical issues)
- **Public disclosure**: After fix is deployed + 30 days

### Security Updates

Subscribe to security updates:
- Watch GitHub repository
- Check CHANGELOG.md
- Monitor Vercel status page

---

## Compliance

### GDPR Considerations

- Users can delete their accounts (data deletion)
- Profile data is user-controlled
- No personal data shared with third parties (except Supabase, Vercel)
- Session cookies are secure and httpOnly

### Data Storage

- **User Data**: Supabase (SOC 2 compliant)
- **Application**: Vercel (ISO 27001 certified)
- **AI Processing**: Anthropic (via Vercel AI Gateway)

---

## Security Audit History

### November 10, 2025
- Initial security documentation created
- All security measures documented
- RLS policies verified
- Admin access control confirmed

### Future Audits
- Schedule: Quarterly
- Next audit: February 2026

---

**Document maintained by**: Security Team / Claude Code
**Last security review**: November 10, 2025
**Next review due**: February 10, 2026
**Security contact**: [Your email]
