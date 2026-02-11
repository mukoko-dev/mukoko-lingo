# Security Policy

## Overview

Mukoko Lingo takes security seriously. This document outlines our security practices, how to report vulnerabilities, and our commitment to protecting user data.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 3.x.x   | :white_check_mark: |
| 2.x.x   | :x:                |
| 1.x.x   | :x:                |

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

- **Stytch**: All authentication is handled by Stytch with industry-standard security
- **Methods Supported**: Email/password, OTP (email & WhatsApp), magic links
- **Session Management**: Stytch session tokens stored via SecureStore (native) or AsyncStorage (web)
- **Server Validation**: All API routes validate sessions via `requireAuth()` middleware using Stytch SDK
- **Protected Routes**: API middleware validates Stytch session tokens and rejects unauthenticated requests

### Authorization

- **Role-Based Access Control (RBAC)**: Users have `user` or `admin` roles stored in `profiles` collection
- **Server-Side Admin Check**: `requireAdmin()` middleware validates both Stytch session and admin role
- **Client-Side Admin Check**: `useAdmin()` hook checks role via API for UI gating
- **API Route Protection**: All admin API routes enforce `requireAdmin()` before processing

### Data Protection

- **MongoDB Atlas Security**: Database hosted on MongoDB Atlas with encryption at rest and in transit
- **Prisma ORM**: All database queries go through Prisma, preventing injection attacks
- **Input Validation**: All user inputs validated in API routes before database operations
- **No Direct Client Access**: All data flows through authenticated Vercel serverless API routes

### AI Content Moderation

- **Guardrails System**: 6 core content categories are monitored:
  - Sexual content
  - Hate speech
  - Harassment & bullying
  - Violence & threats
  - Self-harm & suicide
  - Abuse & exploitation
- **Real-time Moderation**: All AI conversations are moderated before responses are returned
- **Audit Logging**: Guardrail changes are logged with timestamps and user attribution
- **Admin Review Queue**: Flagged content is queued for human review

### Environment Variables

Required environment variables (never commit actual values):

```
MONGODB_URI=                     # MongoDB Atlas connection string
STYTCH_PROJECT_ID=               # Stytch project ID (server-side)
STYTCH_SECRET=                   # Stytch secret key (server-side, never expose)
EXPO_PUBLIC_STYTCH_PROJECT_ID=   # Stytch project ID (client-side)
EXPO_PUBLIC_STYTCH_PUBLIC_TOKEN= # Stytch public token (safe for client)
EXPO_PUBLIC_API_BASE_URL=        # API base URL
AI_GATEWAY_API_KEY=              # AI service API key (server-side)
EXPO_PUBLIC_ANTHROPIC_API_KEY=   # Anthropic key for mobile AI
```

### Security Headers

The application implements standard security headers via `vercel.json`:
- X-Content-Type-Options: nosniff
- X-Frame-Options: DENY
- X-XSS-Protection: 1; mode=block

## Database Security

### MongoDB Atlas

- **Encryption at Rest**: AES-256 encryption for stored data
- **Encryption in Transit**: TLS/SSL for all connections
- **Network Access**: IP allowlist configured in Atlas
- **Authentication**: Connection string with credentials, never exposed to client

### Access Control Pattern

All data access follows this pattern:

1. Client sends request with Stytch session token in `Authorization` header
2. API middleware (`auth-middleware.ts`) validates token with Stytch SDK
3. Authenticated user ID used to scope Prisma queries
4. Admin routes additionally verify `profile.role === 'admin'`

### Key Collections and Their Access

| Collection | Read | Write | Delete |
|------------|------|-------|--------|
| profiles | Own or Admin | Own or Admin | Admin only |
| phrases | Public | Admin only | Admin only |
| bookmarks | Own only | Own only | Own only |
| phrase_progress | Own only | Own only | Own only |
| learning_standards | Public | Admin only | Admin only |
| guardrails | Admin only | Admin only | N/A |
| moderation_alerts | Admin only | System | Admin only |
| user_skills | Own or AI system | System | N/A |

## Mobile App Security

### Expo/React Native Considerations

- **Secure Storage**: Session tokens use `expo-secure-store` (native) with AsyncStorage fallback (web)
- **No Hardcoded Secrets**: All API keys are loaded from environment variables
- **Deep Link Validation**: External URLs are validated before navigation
- **API Client**: Singleton pattern with automatic auth header injection

### Admin Access

- Admin routes are protected at the layout level
- User role is verified from the `profiles` collection on each admin page load
- Admin actions (role changes, content moderation) require confirmation dialogs

## Incident Response

In case of a security incident:

1. **Identification**: Monitor logs and alerts for suspicious activity
2. **Containment**: Revoke compromised credentials, disable affected features
3. **Investigation**: Analyze logs, determine scope and impact
4. **Recovery**: Restore from backups if needed, patch vulnerabilities
5. **Communication**: Notify affected users within 72 hours
6. **Post-mortem**: Document lessons learned and implement preventive measures

## Compliance

Mukoko Lingo is designed with privacy in mind:

- **GDPR-friendly**: Users can request data export and deletion
- **Minimal Data Collection**: We only collect data necessary for functionality
- **No Third-Party Tracking**: No advertising or tracking pixels
- **Data Localization**: Database hosted on MongoDB Atlas with configurable regions

## Security Updates

Security patches are prioritized and deployed immediately. Subscribe to release notifications to stay informed about security updates.

## Questions

For security-related questions, contact: security@mukoko.com

---

Last updated: February 2026
