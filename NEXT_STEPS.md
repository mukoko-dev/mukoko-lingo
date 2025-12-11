# Next Steps - Nyuchi Lingo AI-First Rebuild

**Current Status**: Phase 2 Complete ✅
**Date**: November 19, 2025

## Phase 2 Completion Summary

✅ **Database Rebuild**: Complete 14-table skills-based schema
✅ **Skills-Aware AI**: AI reads user proficiency for every interaction
✅ **Adaptive Prompts**: Vocabulary, grammar, scaffolding, corrections all adapt
✅ **Utility Functions**: 15+ helper functions for skills management
✅ **Documentation**: CLAUDE.md updated with AI-first architecture

## Immediate Next Steps

### 1. Verify Database Migration ⚠️ CRITICAL

Before any further development, confirm the database rebuild was successful:

```sql
-- Run these verification queries in Supabase Dashboard SQL Editor:

-- Should return 5 skills
SELECT name, display_name->>'en' as name
FROM skills
ORDER BY sort_order;

-- Should return 25 levels (5 per skill)
SELECT COUNT(*) FROM skill_levels;

-- Should return 5 standards
SELECT level, vocabulary_complexity, ai_scaffolding_level
FROM learning_standards
ORDER BY vocabulary_complexity;

-- Check all tables exist
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Should see: ai_conversations, ai_messages, assessments, bookmarks,
--             learning_standards, moderation_alerts, phrase_progress,
--             phrases, profiles, skills, skill_levels, study_sessions,
--             user_assessments, user_skills
```

**If any queries fail**: Re-run migration at `supabase/migrations/000_complete_database_rebuild_v2.sql`

### 2. Test AI Skills-Aware System

Create a test to verify AI adaptation:

**Test File**: `app/api/ai/test-skills/route.ts`

```typescript
import { buildSkillsAwarePrompt } from "@/lib/ai/skills-aware-prompts"
import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const url = new URL(req.url)
  const userId = url.searchParams.get('userId')

  if (!userId) {
    return NextResponse.json({ error: 'userId required' }, { status: 400 })
  }

  try {
    const prompt = await buildSkillsAwarePrompt(userId, 'practice', 'Shona')

    return NextResponse.json({
      success: true,
      promptLength: prompt.length,
      promptPreview: prompt.substring(0, 500),
      fullPrompt: prompt
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

**Test URL**: `http://localhost:3000/api/ai/test-skills?userId=<your-user-id>`

**Expected Response**:
- Success: true
- Prompt includes "USER PROFICIENCY PROFILE"
- Prompt includes "TEACHING APPROACH FOR [LEVEL]"
- Prompt includes adaptive vocabulary/grammar/scaffolding guidance

### 3. Create Diagnostic Assessment (Phase 3 Start)

Build the initial assessment flow so users can establish baseline proficiency.

**Required Components**:
1. Assessment UI component
2. Assessment submission API
3. Auto-scoring logic
4. user_skills initialization

**Priority**: HIGH (users can't use AI properly without proficiency data)

## Phase 3: Diagnostic Assessment System

### Goal
Enable users to establish baseline proficiency across all 5 skills through a comprehensive diagnostic assessment.

### Tasks

#### 3.1 Create Assessment Data Structures

**File**: `lib/data/diagnostic-assessment.ts`

Create diagnostic assessment with questions for all 5 skills:
- **Pronunciation**: Listen & repeat audio questions
- **Vocabulary**: Multiple choice word definitions
- **Grammar**: Fill in the blank sentence structure
- **Comprehension**: Read passage & answer questions
- **Conversation**: Scenario-based dialogue choices

**Format**:
```typescript
export const diagnosticAssessment = {
  id: 'diagnostic-001',
  title: { en: 'Diagnostic Assessment', shona: '...', ndebele: '...' },
  description: { en: 'Determine your baseline proficiency' },
  questions: [
    // 10 questions per skill = 50 total questions
    // Each skill tests beginner → fluent concepts
  ]
}
```

#### 3.2 Build Assessment UI

**Component**: `components/diagnostic-assessment.tsx`

Features:
- Multi-step wizard (one skill at a time)
- Progress indicator (e.g., "Pronunciation 1/10")
- Question types: multiple choice, fill blank, audio playback
- "Skip" option for questions user can't answer
- Timer (optional, for pacing)
- Submit button when all questions answered

#### 3.3 Create Assessment Submission API

**Endpoint**: `app/api/assessments/submit-diagnostic/route.ts`

Flow:
1. Receive answers for all 50 questions
2. Auto-score each question (correct/incorrect)
3. Calculate proficiency score per skill (0-100)
4. Determine proficiency level (beginner/elementary/intermediate/advanced/fluent)
5. Insert `user_assessments` record
6. Insert/update `user_skills` for all 5 skills
7. Return results summary

#### 3.4 Create Results Page

**Page**: `app/app/diagnostic-results/page.tsx`

Display:
- Overall proficiency level
- Breakdown by skill (e.g., "Vocabulary: Intermediate (68/100)")
- Visual progress bars
- Personalized recommendations
- "Start Learning" CTA to browse phrases

#### 3.5 Integrate into Onboarding

**Flow**:
1. User signs up
2. Redirect to `/app/diagnostic-assessment`
3. Complete assessment
4. Show results at `/app/diagnostic-results`
5. Initialize user_skills in database
6. Redirect to `/app/home` to start learning

### Success Criteria

- [x] Database supports assessments (migration complete)
- [x] AI adapts to proficiency (skills-aware prompts complete)
- [ ] Users can take diagnostic assessment
- [ ] Assessment auto-scores and updates user_skills
- [ ] AI uses diagnostic results for adaptive teaching
- [ ] Users see their proficiency levels in dashboard

## Phase 4: Skills Dashboard (After Diagnostic)

### Goal
Provide users with comprehensive view of their learning progress.

### Components

1. **Skills Overview** (`app/app/skills/page.tsx`)
   - Visual representation of all 5 skills
   - Progress bars showing level progression
   - "Take Assessment" buttons for each skill

2. **Skill Detail Pages** (`app/app/skills/[skillName]/page.tsx`)
   - Deep dive into one skill
   - Practice history
   - Recommended phrases for this skill
   - Next assessment unlock requirements

3. **Progress Tracking**
   - Total practice time
   - Phrases mastered per skill
   - Assessment history
   - Streak tracking

## Long-Term Roadmap

### Phase 5: Content Expansion
- Add more phrases (target: 1000+ phrases)
- Map all phrases to skills and difficulty
- Create skill-specific learning paths

### Phase 6: Advanced Assessments
- Formative assessments (during learning)
- Summative assessments (unlock new content)
- Adaptive assessments (AI-generated questions)
- Speaking assessments (voice recording)

### Phase 7: Social Features
- Leaderboards by skill
- Study groups
- Peer practice matching
- Achievement system

### Phase 8: Premium Features
- Personalized learning plans
- 1-on-1 AI tutoring sessions
- Advanced analytics
- Certificate generation

## Technical Debt to Address

1. **Deprecate learning-standards.ts**: Old system no longer used
2. **Add caching**: Cache user proficiency for 5 minutes
3. **Add error boundaries**: Better error handling for AI failures
4. **Add analytics**: Track AI adaptation effectiveness
5. **Optimize queries**: Add composite indexes for frequent joins
6. **Add tests**: Unit tests for skills utilities, integration tests for AI

## Documentation to Create

- [x] Phase 2 completion summary
- [x] AI-first architecture in CLAUDE.md
- [ ] User guide: "How to use AI Tutor effectively"
- [ ] Admin guide: "Creating and managing assessments"
- [ ] API documentation: Skills and assessment endpoints
- [ ] Database schema diagram (visual)

## Questions to Answer

1. **Assessment Difficulty**: How many questions per skill in diagnostic? (Recommendation: 10)
2. **Audio Questions**: Do we implement pronunciation assessment now or later? (Recommendation: Later - v2)
3. **Adaptive vs Fixed**: Should diagnostic be same for everyone or adapt based on early answers? (Recommendation: Fixed for v1)
4. **Re-assessment**: How often can users retake diagnostic? (Recommendation: Once per 30 days)
5. **Partial Completion**: Can users save progress and resume? (Recommendation: Yes - store in local state)

## Metrics to Track

### User Engagement
- % of users who complete diagnostic
- Average time to complete diagnostic
- Dropout rate by skill (which skill causes most quits?)

### AI Effectiveness
- User satisfaction with AI responses by proficiency level
- Assessment scores improvement over time
- Phrase mastery rate by proficiency level

### Technical Performance
- AI prompt generation time (target: < 100ms)
- Database query performance (target: < 50ms)
- Assessment submission processing time (target: < 200ms)

## Resources Needed

### For Phase 3 (Diagnostic Assessment)
- **Content Creation**: 50 diagnostic questions (10 per skill)
- **Audio Files**: Pronunciation question audio (if implementing)
- **Design**: Assessment UI mockups
- **Testing**: QA for assessment flow

### For Phase 4 (Skills Dashboard)
- **Design**: Dashboard UI/UX
- **Data Visualization**: Chart library (recharts recommended)
- **Copy**: Skill descriptions, progress explanations

---

## Getting Started on Phase 3

1. **Verify Database** (see Section 1 above)
2. **Create diagnostic questions** in `lib/data/diagnostic-assessment.ts`
3. **Build UI component** `components/diagnostic-assessment.tsx`
4. **Create submission API** `app/api/assessments/submit-diagnostic/route.ts`
5. **Test end-to-end** with real user account
6. **Integrate into app** add to onboarding flow

**Estimated Time**: 2-3 days for Phase 3 MVP

---

**Current Focus**: Test database migration, then begin Phase 3 diagnostic assessment development.
