# Release Management

## Overview

This document describes the release process for Mukoko Lingo, including versioning, release procedures, and deployment workflows.

## Versioning

Mukoko Lingo follows [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH
```

- **MAJOR**: Breaking changes, significant architecture changes
- **MINOR**: New features, backwards-compatible enhancements
- **PATCH**: Bug fixes, security patches, minor improvements

### Current Version: 0.0.1

### Version Locations (must all match)

| File | Field |
|------|-------|
| `package.json` | `version` |
| `web/package.json` | `version` |
| `app.json` | `expo.version` |
| `constants/Version.ts` | `APP_VERSION` |
| `web/app/layout.tsx` | Footer text |
| `RELEASES.md` | Current Version |
| `CLAUDE.md` | Project Status |

## Release Channels

### Production
- **Branch**: `main`
- **Environment**: Vercel Production
- **URL**: https://lingo.mukoko.com (mobile web), TBD (Next.js web)
- **Database**: Supabase PostgreSQL (`yqmqdiudhztddiyeerig`)
- **Auth**: WorkOS AuthKit (Production environment)

### Development
- **Branch**: Feature branches
- **Environment**: Local / Vercel Preview
- **Database**: Same Supabase project (use with care)

## Release Process

### 1. Pre-Release Checklist

- [ ] All mobile tests pass (`npm test -- --ci`)
- [ ] No TypeScript errors (`npx tsc --noEmit`)
- [ ] Web app builds (`cd web && npm run build`)
- [ ] Security review for sensitive changes
- [ ] Documentation updated (CLAUDE.md, CHANGELOG.md, RELEASES.md)
- [ ] Version bumped in all locations (see table above)
- [ ] Mobile compatibility verified

### 2. Creating a Release

```bash
# Ensure you're on main with latest changes
git checkout main
git pull origin main

# Create release branch
git checkout -b release/v0.1.0

# Bump version in all locations
# Update CHANGELOG.md with release notes

# Commit version bump
git add .
git commit -m "chore: bump version to 0.1.0"

# Push and create PR
git push -u origin release/v0.1.0
```

### 3. After Merge

```bash
# Tag the release
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0

# Create GitHub Release from the tag
gh release create v0.1.0 --title "v0.1.0" --notes "See CHANGELOG.md"
```

### 4. Deployment

**Mobile Web (Expo)**:
- Auto-deploys to Vercel on merge to `main`
- Build: `npx expo export --platform web`

**Next.js Web App**:
- Auto-deploys to Vercel on merge to `main`
- Build: `cd web && npm run build`

**Mobile Native (EAS)**:
- Preview: `npx eas build --profile preview --platform all`
- Production: `npx eas build --profile production --platform all`
- OTA updates: `npx eas update --branch production`

## Version History

| Version | Date | Highlights |
|---------|------|------------|
| 0.0.1 | Apr 2026 | Initial release: Supabase migration, Next.js web app, school model, OneRoster, security hardening |

## Hotfix Process

```bash
git checkout main && git pull
git checkout -b hotfix/description
# Fix, commit, push, PR, merge
# Tag as patch (e.g., v0.0.2)
```

## Contact

- Engineering: dev@mukoko.com
- Security: security@mukoko.com

---

Last updated: April 2026
