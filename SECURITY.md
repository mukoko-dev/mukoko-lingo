# Security Policy

## Overview

Mukoko Lingo takes security seriously. This document outlines our security practices, how to report vulnerabilities, and our commitment to protecting user data.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 4.x.x   | :white_check_mark: |
| 3.x.x   | :x:                |
| < 3.0   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public issue
2. Email security concerns to: security@mukoko.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days.

## Security Architecture

### Authentication

- **WorkOS AuthKit**: All authentication handled by WorkOS's hosted sign-in page
- **Flow**: PKCE authorization-code exchange (email/password, magic auth, social — whatever the AuthKit environment has enabled)
- **Session Management**: Access/refresh tokens stored via SecureStore (native) or AsyncStorage (web)
- **Server Validation**: Access tokens verified locally against WorkOS's JWKS (`jose`), all API routes gated via `requireAuth()` middleware
- **Identity**: Users mapped to a document in the `profiles` MongoDB collection, keyed on the WorkOS `workos_user_id`

### Authorization

- **Role-Based Access Control (RBAC)**: Users have `user` or `admin` roles on `identity.person`
- **Server-Side Admin Check**: `requireAdmin()` validates both the WorkOS access token and admin role
- **Class-Level Roles**: Teachers and students have scoped access within classes
- **API Route Protection**: All admin routes enforce `requireAdmin()` before processing

### Data Protection

- **MongoDB**: Database with encryption at rest and in transit (Atlas managed)
- **Parameterized Queries**: All database operations use the MongoDB driver's query objects (no string-built queries)
- **Input Validation**: All user inputs validated in API routes before database operations
- **No Direct Client Access**: All data flows through authenticated Vercel serverless API routes
- **API Keys**: Organization API keys SHA-256 hashed at rest, plain key shown only once on creation

### AI Security

- **Server-Side Proxy**: Anthropic API key is server-side only (`/api/ai/chat`), never exposed to client bundle
- **Circuit Breaker**: 3 failures → 5 minute cooldown → half-open probe (Hystrix pattern)
- **Rate Limiting**: 30 requests/hour per user on AI chat endpoint
- **Request Timeout**: 15 second AbortController timeout on all Anthropic API calls
- **Prompt Injection Detection**: 14 regex patterns detect instruction manipulation attempts:
  - System override attempts ("ignore previous instructions")
  - Role confusion ("you are now", "pretend to be")
  - Data exfiltration ("reveal your system prompt")
  - Delimiter injection (JSON/control character abuse)
- **Content Moderation**: 6 core categories monitored (harassment, hate speech, sexual, violence, self-harm, off-topic)
- **Local + AI Moderation**: Fast local guardrails + server-side AI moderation via Claude

### CORS Policy

- Restricted to exact production domains (no wildcard subdomains)
- Allowed origins defined in `api/_lib/cors.ts`

### Environment Variables

Required environment variables (never commit actual values):

```
MONGODB_URI=                     # MongoDB connection string
WORKOS_API_KEY=                  # WorkOS API key (server-side, never expose)
WORKOS_CLIENT_ID=                # WorkOS Client ID (server-side)
ANTHROPIC_API_KEY=               # Anthropic key (server-side only)
EXPO_PUBLIC_WORKOS_CLIENT_ID=    # WorkOS Client ID (safe for client)
EXPO_PUBLIC_API_BASE_URL=        # API base URL
```

### Security Headers

Implemented via `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`

## Database Security

### MongoDB

- **Collections**: profiles, phrases, phrase_progress, bookmarks, skills, assessments, classes, and more (see README)
- **Encryption at Rest**: AES-256 via MongoDB Atlas
- **Encryption in Transit**: TLS for all connections
- **Service Role Key**: Server-side only, never exposed to client
- **Flexible Schema**: Phrases carry all language fields directly on one document

### Access Control Pattern

1. Client sends request with a WorkOS access token in the `Authorization` header
2. API middleware verifies the token's signature/expiry against WorkOS's JWKS, then resolves the user via `workos.userManagement.getUser()`
3. Middleware resolves `identity.person` by email, returns `personId` (UUID)
4. All queries scoped to `personId`
5. Admin routes verify `person.role === 'admin'`

### Table Access Control

| Table | Read | Write | Delete |
|-------|------|-------|--------|
| `identity.person` | Own or Admin | Own or Admin | Admin only |
| `lingo.phrase` | Public | Admin only | Admin only |
| `lingo.translation` | Public | Admin only | Admin only |
| `lingo.phrase_progress` | Own only | Own only | Own only |
| `lingo.study_session` | Own only | Own only | N/A |
| `lingo.ai_conversation` | Own only | Own only | N/A |
| `lingo.class` | Members only | Teacher only | Teacher only |
| `lingo.assignment` | Class members | Teacher only | Teacher only |
| `system.guardrail` | Admin only | Admin only | N/A |

## Mobile App Security

- **Secure Storage**: Session tokens use `expo-secure-store` (native) with AsyncStorage fallback (web)
- **No Client-Side API Keys**: Anthropic API key is server-side only via proxy
- **Deep Link Validation**: External URLs validated before navigation
- **Error Boundaries**: Route-level crash isolation prevents information leakage

## Incident Response

1. **Identification**: Monitor logs (`[mukoko]` prefix) for suspicious activity
2. **Containment**: Revoke compromised credentials, disable affected features
3. **Investigation**: Analyze structured logs, determine scope
4. **Recovery**: Restore from backups if needed, patch vulnerabilities
5. **Communication**: Notify affected users within 72 hours
6. **Post-mortem**: Document lessons learned

## Compliance

- **GDPR-friendly**: Users can request data export and deletion
- **Minimal Data Collection**: Only data necessary for learning functionality
- **No Third-Party Tracking**: No advertising or tracking pixels
- **Data Localization**: MongoDB Atlas region per deployment configuration
- **Technology Sovereignty**: No SSPL/proprietary database dependencies

---

Last updated: April 2026
