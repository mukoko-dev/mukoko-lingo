# Security Policy

## Overview

Nyuchi Lingo takes security seriously. This document outlines our security practices, how to report vulnerabilities, and our commitment to protecting user data.

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 2.x.x   | :white_check_mark: |
| 1.x.x   | :x:                |

## Reporting a Vulnerability

If you discover a security vulnerability, please report it responsibly:

1. **Do NOT** open a public issue
2. Email security concerns to: security@nyuchi.com
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Any suggested fixes

We will acknowledge receipt within 48 hours and provide a detailed response within 7 days.

## Security Architecture

### Authentication

- **Supabase Auth**: All authentication is handled by Supabase with industry-standard security
- **Session Management**: JWT tokens with automatic refresh via middleware
- **No Dev Mode**: Development mode (which bypassed auth) has been permanently removed
- **Protected Routes**: Middleware validates sessions and redirects unauthenticated users

### Authorization

- **Role-Based Access Control (RBAC)**: Users have `user` or `admin` roles stored in profiles
- **Row Level Security (RLS)**: All database tables have RLS policies enabled
- **Admin Verification**: Admin access is checked both client-side and server-side
- **Database Functions**: `is_admin()` and `check_is_admin()` provide secure role verification

### Data Protection

- **RLS Policies**: Users can only access their own data unless they have admin privileges
- **Service Role Isolation**: Service role key is only used server-side, never exposed to client
- **Input Validation**: All user inputs are validated before database operations
- **SQL Injection Prevention**: Supabase client handles query parameterization

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
NEXT_PUBLIC_SUPABASE_URL=        # Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=   # Public anonymous key (safe for client)
SUPABASE_SERVICE_ROLE_KEY=       # Server-only, never expose to client
AI_GATEWAY_API_KEY=              # AI service API key
```

### Security Headers

The application implements standard security headers:
- Content Security Policy (CSP)
- X-Frame-Options
- X-Content-Type-Options
- Referrer-Policy

## Database Security

### Row Level Security Policies

All tables have RLS enabled with policies following these principles:

1. **Users access own data**: `auth.uid() = user_id`
2. **Admins can access all**: `is_admin()` or `check_is_admin(auth.uid())`
3. **Public data is readable**: Some tables (like phrases) allow public SELECT
4. **Mutations require auth**: INSERT, UPDATE, DELETE require authenticated users

### Key Tables and Their Policies

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| profiles | Own or Admin | System only | Own or Admin | Admin only |
| phrases | Public | Admin only | Admin only | Admin only |
| bookmarks | Own only | Own only | Own only | Own only |
| phrase_progress | Own only | Own only | Own only | Own only |
| learning_standards | Active or Admin | Admin only | Admin only | Admin only |
| guardrails | Admin only | N/A | Admin only | N/A |
| moderation_alerts | Admin only | System | Admin only | N/A |

### Sensitive Functions

These database functions use `SECURITY DEFINER` to execute with elevated privileges:

- `handle_new_user()` - Creates profile on signup
- `is_admin()` / `check_is_admin()` - Verifies admin role
- `update_study_streak()` - Updates user statistics
- `get_learning_standard()` - Retrieves proficiency levels

## Mobile App Security

### Expo/React Native Considerations

- **Secure Storage**: Sensitive data uses `@react-native-async-storage/async-storage` with encryption where available
- **No Hardcoded Secrets**: All API keys are loaded from environment variables
- **Deep Link Validation**: External URLs are validated before navigation
- **Supabase Client**: Singleton pattern ensures proper session management

### Admin Access

- Admin routes are protected at the layout level
- User role is verified from the `profiles` table on each admin page load
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

Nyuchi Lingo is designed with privacy in mind:

- **GDPR-friendly**: Users can request data export and deletion
- **Minimal Data Collection**: We only collect data necessary for functionality
- **No Third-Party Tracking**: No advertising or tracking pixels
- **Data Localization**: Database hosted in user-selected Supabase region

## Security Updates

Security patches are prioritized and deployed immediately. Subscribe to release notifications to stay informed about security updates.

## Questions

For security-related questions, contact: security@nyuchi.com

---

Last updated: December 2025
