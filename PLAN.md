# Mukoko Lingo UX Overhaul - Implementation Plan

## Overview

This plan addresses all 7 UX issues identified in the audit. The goal is to transform Mukoko Lingo from a disconnected collection of features into a cohesive, habit-forming language learning experience.

**Guiding Principle**: Every screen should answer "What should I do next?" for the learner.

---

## Phase 1: Navigation Restructure

### Problem (Issues #5, #6)
- 5 tabs + 5 marketing pages = too many destinations, unclear hierarchy
- Insights tab is an analytics dashboard, not a learner-friendly progress view
- Skills tab is separate from progress tracking

### Changes

#### 1.1 Reduce tabs: 5 → 4

**File: `app/(tabs)/_layout.tsx`**
- Remove Skills tab entirely
- Rename Insights tab → "Progress"
- New tab order: **Learn** | **Shamwari** | **Progress** | **Profile**
- Icons: BookOpen | MessageCircle | TrendingUp | User

#### 1.2 Merge Skills into Progress tab

**File: `app/(tabs)/insights.tsx`** (rename conceptually to "Progress")
- Replace 3 sub-tabs (Overview/Bookmarks/Progress) with 2: **Dashboard** | **Phrases**
- Dashboard: daily goal card, streak, skill breakdown (from skills.tsx), overall progress ring
- Phrases: bookmarked + in-progress phrases in one list
- Remove: category breakdown charts, activity timeline, stacked mastery bar (admin-level analytics)
- Keep: quick stats row, proficiency ring, skill progress bars

**File: `app/(tabs)/skills.tsx`** → DELETE (content merged into insights.tsx)

#### 1.3 Simplify Profile tab

**File: `app/(tabs)/profile.tsx`**
- Remove: 4 separate modals, stats container at top (duplicated from Progress)
- Keep: avatar/user info, preferences (language, theme), support links, sign out
- Simplify preferences to a clean list without modals - use inline selectors

#### 1.4 Consolidate marketing pages into welcome page

**File: `app/welcome/index.tsx`**
- Add scrollable sections that cover About, Features, Why content
- Sections: Hero → Stats → Features Grid → How It Works (3 steps) → Who It's For → CTA → Footer
- Remove redundant content that repeats across pages

**Files: `app/about/index.tsx`, `app/features/index.tsx`, `app/why/index.tsx`**
- Convert to thin wrappers that redirect to `/welcome` with a scroll anchor
- Or keep as simple pages but dramatically simplify (one card each with key message + "Learn more on our homepage" link)

#### 1.5 Simplify onboarding

**File: `app/onboarding/index.tsx`**
- Reduce from 4 slides to 2:
  1. "Pick your language" - interactive language selector (the first thing a learner cares about)
  2. "Meet Shamwari" - introduce the AI tutor with one conversation example
- Remove generic feature marketing slides
- The onboarding should DO something useful (set language preference), not just show text

---

## Phase 2: Transform Learn Tab

### Problem (Issues #1, #2, #4)
- Main tab is a flat phrase dictionary with passive browsing
- No learning loop: Learn → Practice → Feedback → Progress
- Skills don't affect what content is shown

### Changes

#### 2.1 Add Today's Lesson section

**File: `app/(tabs)/index.tsx`** - major rewrite
- Top section: **Today's Lesson** card
  - Shows daily goal progress ("3 of 5 phrases today")
  - Horizontal scrollable phrase flashcards (tap to flip: English ↔ target language)
  - Each card has: phrase text, tap indicator, progress dot
  - "Start Practice" button appears after viewing all cards → opens mini-quiz
- Below: **Browse All Phrases** (existing phrase list, collapsed by default or via tab toggle)

#### 2.2 Add interactive mini-quiz

**New file: `components/MiniQuiz.tsx`**
- Simple quiz triggered after viewing Today's Lesson phrases
- Format: Show English phrase → pick correct translation from 3 options
- 5 questions matching the day's phrases
- Immediate feedback (green/red highlight on selection)
- After completion: celebration card + skill score update + "Practice with Shamwari" prompt

#### 2.3 Smart phrase selection for daily lessons

**New file: `lib/services/daily-lesson.ts`**
- Select 5 phrases per day based on:
  1. Phrases not yet mastered (prioritize "learning" status)
  2. Phrases from weakest skill areas
  3. Phrases not recently practiced (spaced repetition-lite)
  4. Mix of categories for variety
- Track which phrases were shown today (AsyncStorage with date key)
- Reset daily

#### 2.4 Connect phrase mastery to skill scores

**File: `app/phrase/[id].tsx`**
- When marking a phrase as "Practiced": update relevant skill score (+2 points)
- When marking as "Mastered": update relevant skill score (+5 points)
- Map phrase categories to skills:
  - greetings/emotions → conversation
  - pronunciation-heavy → pronunciation
  - grammar patterns → grammar
  - vocabulary-focused → vocabulary
  - contextual phrases → comprehension

**File: `lib/storage/database.web.ts` + `database.native.ts`**
- Add `getDailyLesson()` / `setDailyLesson()` functions
- Add `getDailyGoalProgress()` / `updateDailyGoalProgress()` functions
- Add `getLastPracticed()` for spaced repetition tracking

---

## Phase 3: Contextualize Shamwari AI

### Problem (Issue #3)
- AI tutor is in its own tab, disconnected from phrase learning
- "Practice with Shamwari" from phrase detail just opens a blank chat

### Changes

#### 3.1 Pass phrase context to Shamwari

**File: `app/(tabs)/ai-practice.tsx`**
- Accept route params: `phraseContext` (the phrase to practice)
- When `phraseContext` is present:
  - Skip welcome card
  - Auto-send first message: "I'd like to practice using '[phrase]' in conversation"
  - Shamwari responds with a contextual scenario
- When no context: show existing welcome card + starters

**File: `app/phrase/[id].tsx`**
- "Practice with Shamwari" button passes phrase data via router params:
  ```
  router.push({ pathname: '/(tabs)/ai-practice', params: { phraseContext: phrase.english } })
  ```

#### 3.2 Add contextual conversation starters

**File: `lib/ai/chat-service.ts`**
- Add `getContextualStarters(phrase, language)` function
- Returns starters like:
  - "Use '[phrase]' in a greeting scenario"
  - "How would I say this differently in a formal setting?"
  - "What are common responses to '[phrase]'?"

#### 3.3 Post-quiz Shamwari prompt

**File: `components/MiniQuiz.tsx`**
- After quiz completion, show: "Want to practice these phrases with Shamwari?"
- Button navigates to Shamwari with context about the phrases just learned

---

## Phase 4: Add Emotional Hooks

### Problem (Issue #7)
- No habit formation: no celebrations, no daily goals, no progression feel
- Streak exists but isn't prominent or rewarding

### Changes

#### 4.1 Daily goal system

**File: `app/(tabs)/index.tsx`**
- Top of Learn tab: daily goal progress bar
- "Learn 5 phrases today" with fill progress (e.g., "3/5")
- When complete: celebration card with confetti-style visual + Shamwari quote
- Goal resets daily

**File: `lib/storage/database.web.ts` + `database.native.ts`**
- Add daily goal storage (date + count + completed boolean)

#### 4.2 Lesson completion celebration

**New file: `components/CelebrationCard.tsx`**
- Shown when daily goal is met or quiz is completed
- Content: Shamwari congrats message, streak count, XP/points earned
- "Continue Learning" or "Practice with Shamwari" buttons
- Animated entrance (scale + fade)

#### 4.3 Streak emphasis

**File: `app/(tabs)/_layout.tsx` or `app/(tabs)/index.tsx`**
- On app open, if streak > 1: show brief streak celebration banner
- "🔥 3 day streak! Keep it going!"
- Dismissible, non-blocking

#### 4.4 Shamwari encouragement

**File: `lib/ai/chat-service.ts`**
- Add streak-aware system prompt additions:
  - If streak > 3: "The learner has a 5-day streak! Acknowledge and encourage this."
  - If returning after break: "The learner hasn't practiced in a few days. Welcome them back warmly."

---

## Phase 5: File Changes Summary

### Files to CREATE (new)
| File | Purpose | Est. Lines |
|------|---------|-----------|
| `components/MiniQuiz.tsx` | Interactive mini-quiz after daily lesson | ~250 |
| `components/CelebrationCard.tsx` | Celebration/completion card component | ~120 |
| `components/DailyLessonCard.tsx` | Today's lesson flashcard carousel | ~200 |
| `components/FlashCard.tsx` | Individual flip-to-reveal phrase card | ~100 |
| `lib/services/daily-lesson.ts` | Smart phrase selection + daily tracking | ~150 |

### Files to MODIFY (significant changes)
| File | Changes | Impact |
|------|---------|--------|
| `app/(tabs)/_layout.tsx` | 5→4 tabs, rename Insights→Progress | Medium |
| `app/(tabs)/index.tsx` | Major rewrite: add daily lesson, goal, quiz flow | High |
| `app/(tabs)/ai-practice.tsx` | Accept phrase context, contextual starters | Medium |
| `app/(tabs)/insights.tsx` | Merge skills content, simplify to Dashboard+Phrases | High |
| `app/(tabs)/profile.tsx` | Simplify settings, remove redundant stats/modals | Medium |
| `app/welcome/index.tsx` | Consolidate marketing content into sections | Medium |
| `app/onboarding/index.tsx` | Reduce to 2 interactive slides | Medium |
| `app/phrase/[id].tsx` | Skill score updates, contextual Shamwari nav | Medium |
| `lib/ai/chat-service.ts` | Contextual starters, streak-aware prompts | Low |
| `lib/storage/database.web.ts` | Daily lesson/goal storage functions | Low |
| `lib/storage/database.native.ts` | Daily lesson/goal storage functions | Low |
| `lib/storage/database.d.ts` | New function type declarations | Low |
| `lib/data/translations.ts` | New translation keys for new UI text | Low |
| `constants/Colors.ts` | No changes needed | None |

### Files to DELETE/SIMPLIFY
| File | Action |
|------|--------|
| `app/(tabs)/skills.tsx` | DELETE - content merged into Progress tab |
| `app/about/index.tsx` | SIMPLIFY - thin page with link to welcome |
| `app/features/index.tsx` | SIMPLIFY - thin page with link to welcome |
| `app/why/index.tsx` | SIMPLIFY - thin page with link to welcome |

### Files to UPDATE (tests)
| File | Changes |
|------|---------|
| `lib/storage/__tests__/database.test.ts` | Add tests for daily lesson/goal functions |
| `lib/ai/__tests__/chat-service.test.ts` | Add tests for contextual starters |
| `lib/data/__tests__/translations.test.ts` | Verify new translation keys |
| `lib/hooks/__tests__/useLearningLanguage.test.tsx` | No changes needed |

### Files to UPDATE (docs)
| File | Changes |
|------|---------|
| `CLAUDE.md` | Update navigation, tab descriptions, new components, learning flow |
| `CHANGELOG.md` | Add v3.2.0 entry documenting the UX overhaul |

---

## Phase 6: Implementation Order

Execute in this order to minimize broken states:

### Step 1: Storage + Services layer (no UI changes yet)
1. Add daily lesson/goal functions to `database.d.ts`, `database.web.ts`, `database.native.ts`
2. Create `lib/services/daily-lesson.ts`
3. Add tests for new storage functions

### Step 2: New components (not yet integrated)
4. Create `components/FlashCard.tsx`
5. Create `components/DailyLessonCard.tsx`
6. Create `components/MiniQuiz.tsx`
7. Create `components/CelebrationCard.tsx`

### Step 3: Tab restructure
8. Update `app/(tabs)/_layout.tsx` (5→4 tabs)
9. Merge skills content into `app/(tabs)/insights.tsx` (Progress tab)
10. Delete `app/(tabs)/skills.tsx`
11. Simplify `app/(tabs)/profile.tsx`

### Step 4: Learn tab overhaul
12. Rewrite `app/(tabs)/index.tsx` with daily lesson + browse toggle

### Step 5: Shamwari contextualization
13. Update `app/phrase/[id].tsx` (skill updates + contextual nav)
14. Update `app/(tabs)/ai-practice.tsx` (accept context)
15. Update `lib/ai/chat-service.ts` (contextual starters)

### Step 6: Marketing consolidation
16. Update `app/welcome/index.tsx` (consolidated content)
17. Simplify `app/about/index.tsx`, `app/features/index.tsx`, `app/why/index.tsx`
18. Simplify `app/onboarding/index.tsx` (2 slides)

### Step 7: Emotional hooks
19. Add daily goal UI to Learn tab
20. Add celebration/streak components
21. Add streak-aware AI prompts

### Step 8: Translations + Tests + Docs
22. Add new translation keys to all 5 languages
23. Update all affected tests
24. Update CLAUDE.md and CHANGELOG.md

---

## Expected Outcome

After implementation, the user journey becomes:

1. **First visit** → Landing page (consolidated) → Pick language (onboarding) → Meet Shamwari
2. **Daily open** → See streak banner → Today's Lesson (5 flashcards) → Mini-quiz
3. **Complete quiz** → Celebration → "Practice with Shamwari?" → Contextual AI chat
4. **Check progress** → Progress tab shows daily goal, skills, recent phrases
5. **Deep dive** → Browse all phrases, take formal assessments, adjust settings

The app now has a clear answer to "What do I do?" at every step.
