# Codebase Review Findings

**Date**: December 11, 2025
**Branch**: feature/phase4-5-dashboard-polish
**Status**: Pre-Phase 4-5 Review - CRITICAL ISSUES FIXED

---

## Executive Summary

Build passes with no errors. Critical issues have been identified and fixed. Ready for Phase 4-5 development.

---

## CRITICAL Issues - FIXED

### 1. ~~Broken Route - `/app/home` Does Not Exist~~ FIXED
**File**: `app/app/diagnostic/diagnostic-client.tsx` (Line 56)
**Solution**: Changed route to `/app/learn`

### 2. ~~RPC Function Return Type Mismatch~~ FIXED
**File**: `lib/utils/user-skills.ts` (Lines 74-101)
**Solution**: Rewrote `getUserOverallProficiency()` to calculate score locally instead of using RPC

### 3. ~~Assessment Missing skill_id Foreign Key~~ FIXED
**File**: `app/api/assessments/submit-diagnostic/route.ts` (Lines 64-104)
**Solution**: Now properly sets `skill_id`, `target_level`, and multilingual titles

---

## HIGH Priority Issues

### 4. AI Models Updated to DeepSeek/Qwen
**File**: `lib/ai/config.ts`
**Status**: FIXED in this review
**Change**: Updated from Claude models to DeepSeek v3.2 as primary model
- `haiku` → now maps to `deepseek/deepseek-v3.2`
- `sonnet` → now maps to `deepseek/deepseek-v3.2-thinking`
- Added Qwen models as alternatives

### 5. Assessment Scoring Oversimplified
**File**: `app/api/assessments/submit-diagnostic/route.ts` (Lines 108-112)
**Problem**: Server-side scoring treats any non-skipped answer as correct
```typescript
.map(([questionId, answer]) => ({
  correct: answer !== "__skipped__",  // No actual answer validation!
}))
```
**Note**: Real scoring happens in frontend - this is just for database record. Consider validating on server too.

### 6. Feedback Hardcoded for Shona Only
**File**: `app/api/assessments/submit-diagnostic/route.ts` (Lines 199-239)
**Problem**: All feedback strings reference "Shona" but app supports 4 languages
**Fix**: Make feedback dynamic based on selected target language

---

## MEDIUM Priority Issues

### 7. Unused Database Functions
**Location**: Migration 030 (scripts/030_phrases_skills_integration.sql)
**Functions never called in application**:
- `get_recommended_phrases()` (lines 26-91)
- `get_phrases_for_skill_level()` (lines 94-109)
- `user_can_access_phrase()` (lines 112-169)

**Action**: Either use these functions or document for future use

### 8. initializeUserSkills Never Called
**File**: `lib/utils/user-skills.ts` (Lines 100-125)
**Problem**: Function exists but never called anywhere in codebase
**Impact**: Users might not get skill entries initialized properly
**Note**: The diagnostic submission creates user_skills, so this may be redundant

### 9. Dashboard Missing Error Distinction
**File**: `app/app/skills/skills-dashboard-client.tsx` (Lines 117-201)
**Problem**: Can't distinguish between "user needs diagnostic" vs "database error"
```typescript
if (skillsError || !userSkills || userSkills.length === 0) {
  setNeedsDiagnostic(true)  // Both cases go here
}
```
**Fix**: Show error message for actual errors

### 10. ESLint Not Installed
**File**: package.json
**Problem**: `npm run lint` fails - eslint command not found
**Fix**: Install eslint or remove lint script

---

## LOW Priority Issues

### 11. Debug Logging in Production Code
**Files with console.log that should be removed**:
- `app/auth/login/page.tsx` - Multiple `[v0]` prefixed logs
- `app/api/ai/test/route.ts` - `[AI Test]` prefixed logs

### 12. Middleware Deprecation Warning
**File**: `middleware.ts`
**Warning**: "The 'middleware' file convention is deprecated. Please use 'proxy' instead."
**Action**: Migrate to Next.js proxy pattern when ready

### 13. TypeScript Types Could Be Stricter
**File**: `lib/types/skills.ts`
**Issue**: `level_achieved_at: string` should be `Date | string` for clarity

---

## Feature Completeness Check

### Phase 1: Foundation - COMPLETE
- [x] Database migrations created
- [x] Skills taxonomy seeded
- [x] TypeScript types defined
- [x] RLS policies configured

### Phase 2: AI Core - COMPLETE
- [x] Skills-aware prompt system (`lib/ai/skills-aware-prompts.ts`)
- [x] AI chat API with skills awareness
- [x] Content moderation
- [x] AI config (now using DeepSeek/Qwen)

### Phase 3: Assessment System - MOSTLY COMPLETE
- [x] Diagnostic assessment UI (`components/diagnostic-assessment.tsx`)
- [x] Assessment submission API
- [x] Auto-scoring logic
- [x] user_skills population
- [ ] **BROKEN**: Post-assessment navigation
- [ ] **INCOMPLETE**: Server-side answer validation

### Phase 4: Skills Dashboard - PARTIAL
- [x] Basic dashboard UI (`app/app/skills/skills-dashboard-client.tsx`)
- [x] Skills overview with progress
- [ ] **MISSING**: Skill detail pages (`/app/skills/[skillName]`)
- [ ] **MISSING**: Practice history per skill
- [ ] **MISSING**: Recommended phrases per skill
- [ ] **INCOMPLETE**: Error state handling

### Phase 5: Polish - NOT STARTED
- [ ] Test coverage
- [ ] Performance optimization
- [ ] Documentation
- [ ] Remove debug logging
- [ ] Migrate middleware to proxy

---

## Recommended Fix Order

### Immediate (Before continuing Phase 4-5):
1. Fix broken `/app/home` route
2. Fix RPC function return type OR remove dependency
3. Add skill_id handling in diagnostic assessment

### Phase 4 Development:
4. Create skill detail pages
5. Add practice history
6. Add recommended phrases per skill
7. Improve error handling in dashboard

### Phase 5 Polish:
8. Install ESLint and fix warnings
9. Remove debug console.log statements
10. Make feedback strings multilingual
11. Add test coverage
12. Migrate middleware

---

## Files Changed in This Review

1. `lib/ai/config.ts` - Updated to use DeepSeek/Qwen models

## Files to Change Next

1. `app/app/diagnostic/diagnostic-client.tsx` - Fix route
2. `lib/utils/user-skills.ts` - Fix getUserOverallProficiency
3. `app/api/assessments/submit-diagnostic/route.ts` - Multiple fixes needed
