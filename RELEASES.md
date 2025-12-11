# Release Management

## Overview

This document describes the release process for Nyuchi Lingo, including versioning, release procedures, and deployment workflows.

## Versioning

Nyuchi Lingo follows [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes, significant architecture changes
- **MINOR**: New features, backwards-compatible enhancements
- **PATCH**: Bug fixes, security patches, minor improvements

### Current Version: 2.0.0

## Release Channels

### Production
- **Branch**: `main`
- **Environment**: Vercel Production
- **URL**: https://lingo.nyuchi.com
- **Database**: Supabase Production

### Staging (Future)
- **Branch**: `staging`
- **Environment**: Vercel Preview
- **Database**: Supabase Staging

### Development
- **Branch**: Feature branches
- **Environment**: Local / Vercel Preview
- **Database**: Local Supabase or shared dev instance

## Release Process

### 1. Pre-Release Checklist

- [ ] All tests pass (when implemented)
- [ ] No TypeScript errors (`npm run build`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] Security review for sensitive changes
- [ ] Database migrations tested
- [ ] Documentation updated (CLAUDE.md, CHANGELOG.md)
- [ ] Mobile compatibility verified

### 2. Creating a Release

```bash
# Ensure you're on main with latest changes
git checkout main
git pull origin main

# Create release branch
git checkout -b release/v2.1.0

# Update version in package.json
# Update CHANGELOG.md with release notes

# Commit version bump
git add .
git commit -m "chore: bump version to 2.1.0"

# Push and create PR
git push -u origin release/v2.1.0
```

### 3. Release Notes Template

```markdown
## [2.1.0] - YYYY-MM-DD

### Added
- New feature description

### Changed
- Modified behavior description

### Fixed
- Bug fix description

### Security
- Security improvement description

### Deprecated
- Deprecated feature (if any)

### Removed
- Removed feature (if any)
```

### 4. Database Migrations

For releases with database changes:

1. Create numbered migration file in `scripts/` (e.g., `032_new_feature.sql`)
2. Test migration on staging/development first
3. Apply to production via Supabase Dashboard SQL Editor
4. Verify migration success before deploying code

### 5. Deployment

**Web Deployment (Expo Web)**:

- Build with `npx expo export --platform web`
- Deploy to Vercel, Netlify, or any static hosting
- CI/CD workflow handles automatic builds on PRs

**Mobile Deployment (EAS)**:

- Preview builds: `npx eas build --profile preview --platform all`
- Production builds: `npx eas build --profile production --platform all`
- OTA updates: `npx eas update --branch production`

**Manual Steps**:
1. Merge release PR to `main`
2. Run EAS build for mobile platforms
3. Verify production functionality
4. Tag release in GitHub

```bash
# Tag the release
git tag -a v2.1.0 -m "Release version 2.1.0"
git push origin v2.1.0
```

### 6. Post-Release

- [ ] Verify production deployment
- [ ] Monitor error tracking (when implemented)
- [ ] Update documentation if needed
- [ ] Announce release (if significant)

## Hotfix Process

For urgent production fixes:

```bash
# Create hotfix branch from main
git checkout main
git pull origin main
git checkout -b hotfix/critical-bug-fix

# Make fix, commit, push
git add .
git commit -m "fix: critical bug description"
git push -u origin hotfix/critical-bug-fix

# Create PR, get review, merge immediately
# Tag as patch release (e.g., v2.0.1)
```

## Mobile App Releases

### Expo/React Native

The mobile app uses Expo for development and deployment:

**Development**:
```bash
npx expo start
```

**Preview Build**:
```bash
npx eas build --profile preview --platform all
```

**Production Build**:
```bash
npx eas build --profile production --platform all
```

**OTA Updates**:
```bash
npx eas update --branch production
```

### App Store Submissions

For iOS App Store and Google Play releases:

1. Update version in `app.json`
2. Create production build via EAS
3. Submit to respective stores
4. Monitor review process
5. Coordinate with backend release if needed

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 2.0.0 | Dec 2025 | Mobile app, Admin dashboard, Skills-based learning |
| 1.0.0 | Nov 2025 | Initial release with core learning features |

## Release Schedule

- **Major releases**: As needed for significant features
- **Minor releases**: Monthly or bi-weekly
- **Patch releases**: As needed for bug fixes
- **Security patches**: Immediate deployment

## Rollback Procedure

If a release causes issues:

1. **Vercel Rollback**: Use Vercel dashboard to redeploy previous version
2. **Database Rollback**: Have rollback SQL scripts ready for migrations
3. **Communication**: Notify users if service is affected
4. **Investigation**: Determine root cause before re-releasing

## Contact

For release-related questions:
- Engineering: dev@nyuchi.com
- Security issues: security@nyuchi.com

---

Last updated: December 2025
