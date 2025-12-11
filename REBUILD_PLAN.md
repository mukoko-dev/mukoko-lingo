# Nyuchi Lingo Rebuild Plan - AI-First Skills-Based Architecture

**Date**: November 19, 2025
**Objective**: Rebuild application from scratch with AI as the core, skills-based learning, and lessons learned from v2.0
**Approach**: Incremental, tested, production-ready at each phase

---

## Core Principles (Learning from Mistakes)

### What We're Fixing

1. **AI as Afterthought** → **AI as Core Architecture**
   - Old: AI was bolted on as a chat feature
   - New: Every feature designed around AI tutor capabilities

2. **Generic Content** → **Skills-Based Progression**
   - Old: Random phrase browsing with categories
   - New: Phrases filtered by user's skill proficiency

3. **No Assessment** → **Continuous Skill Evaluation**
   - Old: No way to measure progress objectively
   - New: Diagnostic, formative, and summative assessments

4. **Monolithic Components** → **Modular Architecture**
   - Old: 43KB admin-dashboard.tsx
   - New: Small, focused, reusable components

5. **No Testing** → **Test-Driven Development**
   - Old: No automated tests
   - New: Unit tests, integration tests, E2E tests

6. **Build Warnings Ignored** → **Zero Tolerance**
   - Old: TypeScript/ESLint errors ignored
   - New: Strict mode, no warnings in production

7. **Duplicate Code** → **DRY Principle**
   - Old: `/api/ai/chat` and `/api/chat` identical
   - New: Single source of truth

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    USER EXPERIENCE LAYER                     │
├─────────────────────────────────────────────────────────────┤
│  Diagnostic Assessment → Skills Dashboard → Phrase Learning  │
│  ↓                       ↓                  ↓                │
│  Skill Levels Assigned   Progress Visible  AI Tutor Active  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    AI TUTOR CORE (Always Active)            │
├─────────────────────────────────────────────────────────────┤
│  - Reads user's skill proficiency from database             │
│  - Builds context-aware system prompts                      │
│  - Adapts vocabulary and explanations to skill level        │
│  - Suggests next learning steps                             │
│  - Generates skill-appropriate scenarios                    │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                    SKILLS ENGINE                            │
├─────────────────────────────────────────────────────────────┤
│  Skills → Proficiency Levels → Assessments → Progression   │
│                                                              │
│  Every phrase tagged with:                                  │
│  - Required skill_id                                        │
│  - Required proficiency level                               │
│  - Learning objectives                                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Foundation & Skills Infrastructure (Week 1-2)

### Goal
Create the skills-based database schema and core infrastructure that everything else depends on.

### Database Migrations

**Migration 028: Skills Taxonomy**
```sql
-- Core skills that learners progress through
CREATE TABLE skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'pronunciation', 'grammar', 'vocabulary', etc.
  display_name JSONB NOT NULL, -- {'en': 'Pronunciation', 'sn': '...', 'nd': '...', 'zh': '...'}
  description JSONB NOT NULL, -- Multi-language descriptions
  icon TEXT, -- Lucide icon name
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proficiency levels for each skill
CREATE TABLE skill_levels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  level TEXT NOT NULL, -- 'beginner', 'elementary', 'intermediate', 'advanced', 'fluent'
  display_name JSONB NOT NULL,
  description JSONB NOT NULL,
  min_score INTEGER NOT NULL, -- Minimum assessment score to achieve this level (0-100)
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE(skill_id, level)
);

-- User's current proficiency in each skill
CREATE TABLE user_skills (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  current_level TEXT NOT NULL DEFAULT 'beginner',
  current_score INTEGER DEFAULT 0, -- 0-100 based on assessments
  total_practice_time INTEGER DEFAULT 0, -- Seconds
  last_practiced_at TIMESTAMPTZ,
  level_achieved_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_id),
  FOREIGN KEY (skill_id, current_level) REFERENCES skill_levels(skill_id, level)
);

-- RLS Policies
ALTER TABLE user_skills ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own skills"
  ON user_skills FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own skills"
  ON user_skills FOR UPDATE
  USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER update_user_skills_updated_at
  BEFORE UPDATE ON user_skills
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Indexes
CREATE INDEX idx_user_skills_user_id ON user_skills(user_id);
CREATE INDEX idx_user_skills_skill_id ON user_skills(skill_id);
CREATE INDEX idx_user_skills_level ON user_skills(current_level);
```

**Migration 029: Assessment System**
```sql
-- Assessment templates (created by admins)
CREATE TABLE assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  skill_id UUID NOT NULL REFERENCES skills(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('diagnostic', 'formative', 'summative')),
  target_level TEXT NOT NULL, -- Level this assessment evaluates
  title JSONB NOT NULL, -- Multi-language titles
  description JSONB,
  questions JSONB NOT NULL, -- Array of question objects
  passing_score INTEGER NOT NULL DEFAULT 70, -- Percentage
  time_limit INTEGER, -- Seconds (null = no limit)
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  FOREIGN KEY (skill_id, target_level) REFERENCES skill_levels(skill_id, level)
);

-- User assessment attempts
CREATE TABLE user_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES skills(id),
  answers JSONB NOT NULL, -- Array of answer objects
  score INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),
  passed BOOLEAN NOT NULL,
  time_taken INTEGER, -- Seconds
  feedback JSONB, -- AI-generated feedback
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view active assessments"
  ON assessments FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage assessments"
  ON assessments FOR ALL
  USING (is_admin());

CREATE POLICY "Users can view own assessment results"
  ON user_assessments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own assessments"
  ON user_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX idx_assessments_skill ON assessments(skill_id);
CREATE INDEX idx_assessments_type ON assessments(type);
CREATE INDEX idx_user_assessments_user ON user_assessments(user_id);
CREATE INDEX idx_user_assessments_assessment ON user_assessments(assessment_id);
CREATE INDEX idx_user_assessments_completed ON user_assessments(completed_at DESC);
```

**Migration 030: Update Phrases for Skills**
```sql
-- Add skills columns to phrases
ALTER TABLE phrases
  ADD COLUMN skill_id UUID REFERENCES skills(id),
  ADD COLUMN required_level TEXT DEFAULT 'beginner',
  ADD COLUMN learning_objectives TEXT[],
  ADD COLUMN cultural_notes JSONB;

-- Add foreign key constraint
ALTER TABLE phrases
  ADD CONSTRAINT fk_phrases_skill_level
  FOREIGN KEY (skill_id, required_level)
  REFERENCES skill_levels(skill_id, level);

-- Create index for filtering
CREATE INDEX idx_phrases_skill_level ON phrases(skill_id, required_level);

-- Migration script to map existing categories to skills
-- This will be done after skills are seeded
```

### Seed Data: Core Skills Taxonomy

**File**: `scripts/seeds/001_skills_taxonomy.sql`
```sql
-- Insert core skills
INSERT INTO skills (name, display_name, description, icon, sort_order) VALUES
('pronunciation',
 '{"en": "Pronunciation", "sn": "Kunyora Mazwi", "nd": "Ukuphimisela", "zh": "发音"}'::jsonb,
 '{"en": "Master correct sound production, tone, and rhythm", "sn": "...", "nd": "...", "zh": "..."}'::jsonb,
 'volume-2', 1),

('vocabulary',
 '{"en": "Vocabulary", "sn": "Mazwi", "nd": "Amagama", "zh": "词汇"}'::jsonb,
 '{"en": "Build word knowledge and contextual usage", "sn": "...", "nd": "...", "zh": "..."}'::jsonb,
 'book-open', 2),

('grammar',
 '{"en": "Grammar", "sn": "Mutauro", "nd": "Uhlelo lwelimi", "zh": "语法"}'::jsonb,
 '{"en": "Understand sentence structure and language rules", "sn": "...", "nd": "...", "zh": "..."}'::jsonb,
 'list-checks', 3),

('comprehension',
 '{"en": "Comprehension", "sn": "Kunzwisisa", "nd": "Ukuqonda", "zh": "理解"}'::jsonb,
 '{"en": "Develop listening and reading understanding", "sn": "...", "nd": "...", "zh": "..."}'::jsonb,
 'ear', 4),

('conversation',
 '{"en": "Conversation", "sn": "Hurukuro", "nd": "Ingxoxo", "zh": "会话"}'::jsonb,
 '{"en": "Practice real-time dialogue and cultural context", "sn": "...", "nd": "...", "zh": "..."}'::jsonb,
 'message-circle', 5);

-- Insert proficiency levels for each skill
DO $$
DECLARE
  skill_record RECORD;
BEGIN
  FOR skill_record IN SELECT id FROM skills LOOP
    INSERT INTO skill_levels (skill_id, level, display_name, description, min_score, sort_order) VALUES
    (skill_record.id, 'beginner',
     '{"en": "Beginner", "sn": "Mutanguri", "nd": "Umqali", "zh": "初学者"}'::jsonb,
     '{"en": "Basic phrases and simple grammar", "sn": "...", "nd": "...", "zh": "..."}'::jsonb,
     0, 1),

    (skill_record.id, 'elementary',
     '{"en": "Elementary", "sn": "Wepakutanga", "nd": "Wesisekelo", "zh": "基础"}'::jsonb,
     '{"en": "Common expressions and guided practice", "sn": "...", "nd": "...", "zh": "..."}'::jsonb,
     50, 2),

    (skill_record.id, 'intermediate',
     '{"en": "Intermediate", "sn": "Wepakati", "nd": "Ophakathi", "zh": "中级"}'::jsonb,
     '{"en": "Conversational fluency with reduced support", "sn": "...", "nd": "...", "zh": "..."}'::jsonb,
     65, 3),

    (skill_record.id, 'advanced',
     '{"en": "Advanced", "sn": "Wepamusoro", "nd": "Ophezulu", "zh": "高级"}'::jsonb,
     '{"en": "Complex phrases and nuanced language", "sn": "...", "nd": "...", "zh": "..."}'::jsonb,
     80, 4),

    (skill_record.id, 'fluent',
     '{"en": "Fluent", "sn": "Nyanzvi", "nd": "Ophucukile", "zh": "流利"}'::jsonb,
     '{"en": "Native-like proficiency", "sn": "...", "nd": "...", "zh": "..."}'::jsonb,
     90, 5);
  END LOOP;
END $$;
```

### TypeScript Types

**File**: `lib/types/skills.ts`
```typescript
export type SkillName = 'pronunciation' | 'vocabulary' | 'grammar' | 'comprehension' | 'conversation'

export type ProficiencyLevel = 'beginner' | 'elementary' | 'intermediate' | 'advanced' | 'fluent'

export type AssessmentType = 'diagnostic' | 'formative' | 'summative'

export interface Skill {
  id: string
  name: SkillName
  display_name: Record<string, string>
  description: Record<string, string>
  icon?: string
  sort_order: number
  is_active: boolean
  created_at: string
}

export interface SkillLevel {
  id: string
  skill_id: string
  level: ProficiencyLevel
  display_name: Record<string, string>
  description: Record<string, string>
  min_score: number
  sort_order: number
}

export interface UserSkill {
  user_id: string
  skill_id: string
  current_level: ProficiencyLevel
  current_score: number
  total_practice_time: number
  last_practiced_at?: string
  level_achieved_at: string
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  type: 'multiple_choice' | 'fill_blank' | 'pronunciation' | 'listening'
  question: Record<string, string>
  options?: string[]
  correct_answer: string | string[]
  explanation?: Record<string, string>
  points: number
}

export interface Assessment {
  id: string
  skill_id: string
  type: AssessmentType
  target_level: ProficiencyLevel
  title: Record<string, string>
  description?: Record<string, string>
  questions: Question[]
  passing_score: number
  time_limit?: number
  is_active: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export interface UserAssessment {
  id: string
  user_id: string
  assessment_id: string
  skill_id: string
  answers: Array<{ question_id: string; answer: string | string[]; correct: boolean }>
  score: number
  passed: boolean
  time_taken?: number
  feedback?: Record<string, any>
  started_at: string
  completed_at: string
}
```

---

## Phase 2: AI-First Core (Week 3-4)

### Goal
Rebuild AI system with skills awareness as the foundation, not an add-on.

### Enhanced AI Configuration

**File**: `lib/ai/skills-aware-prompts.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import type { UserSkill, ProficiencyLevel } from '@/lib/types/skills'

/**
 * Build AI system prompt based on user's current skill proficiency
 * This is called for EVERY AI interaction
 */
export async function buildSkillsAwarePrompt(
  userId: string,
  conversationType: 'practice' | 'assessment' | 'explanation',
  language: string
): Promise<string> {
  const supabase = await createClient()

  // Fetch user's current skills
  const { data: userSkills } = await supabase
    .from('user_skills')
    .select(`
      *,
      skill:skills(*),
      level:skill_levels(*)
    `)
    .eq('user_id', userId)

  if (!userSkills || userSkills.length === 0) {
    // User hasn't taken diagnostic - default to beginner
    return buildBeginnerPrompt(conversationType, language)
  }

  // Analyze proficiency distribution
  const proficiencyMap = userSkills.reduce((acc, us) => {
    acc[us.skill.name] = {
      level: us.current_level,
      score: us.current_score
    }
    return acc
  }, {} as Record<string, { level: ProficiencyLevel; score: number }>)

  // Build adaptive prompt
  return `You are an expert language tutor for ${language === 'sn' ? 'Shona' : language === 'nd' ? 'Ndebele' : language === 'zh' ? 'Chinese' : 'English'}.

LEARNER PROFICIENCY PROFILE:
${Object.entries(proficiencyMap).map(([skill, data]) =>
  `- ${skill}: ${data.level} (${data.score}/100)`
).join('\n')}

TEACHING GUIDELINES BASED ON PROFICIENCY:

${buildSkillSpecificGuidelines(proficiencyMap)}

CONVERSATION TYPE: ${conversationType}

${conversationType === 'practice' ? `
Your role is to engage in natural conversation while:
1. Using vocabulary appropriate to the learner's levels
2. Gently correcting errors in weaker skills
3. Encouraging use of stronger skills
4. Suggesting phrases that bridge skill levels
5. Providing cultural context when relevant
` : conversationType === 'assessment' ? `
Your role is to evaluate the learner's proficiency by:
1. Asking questions that test specific skills
2. Adjusting difficulty based on responses
3. Providing constructive feedback
4. Identifying skill gaps for focused practice
` : `
Your role is to explain concepts by:
1. Using simpler terms for weaker skills
2. Providing more context for complex topics
3. Breaking down explanations step-by-step
4. Relating to phrases the learner knows
`}

IMPORTANT: Always respond in a supportive, encouraging tone. Celebrate progress and normalize mistakes as part of learning.`
}

function buildSkillSpecificGuidelines(
  proficiency: Record<string, { level: ProficiencyLevel; score: number }>
): string {
  let guidelines = ''

  // Pronunciation guidance
  if (proficiency.pronunciation) {
    const level = proficiency.pronunciation.level
    guidelines += `\nPRONUNCIATION (${level}): `
    switch (level) {
      case 'beginner':
        guidelines += 'Break down sounds phonetically. Use simple analogies to English sounds.'
        break
      case 'elementary':
        guidelines += 'Introduce tone variations. Provide audio-visual cues.'
        break
      case 'intermediate':
        guidelines += 'Focus on rhythm and intonation in sentences.'
        break
      case 'advanced':
        guidelines += 'Polish subtle distinctions. Work on native-like flow.'
        break
      case 'fluent':
        guidelines += 'Fine-tune regional accents and colloquial speech.'
        break
    }
  }

  // Vocabulary guidance
  if (proficiency.vocabulary) {
    const level = proficiency.vocabulary.level
    guidelines += `\nVOCABULARY (${level}): `
    switch (level) {
      case 'beginner':
        guidelines += 'Use only common, essential words (100-300 word vocabulary).'
        break
      case 'elementary':
        guidelines += 'Introduce everyday phrases and expressions (300-800 words).'
        break
      case 'intermediate':
        guidelines += 'Use conversational vocabulary with some idiomatic expressions.'
        break
      case 'advanced':
        guidelines += 'Include nuanced vocabulary, synonyms, and context-specific terms.'
        break
      case 'fluent':
        guidelines += 'Use full native vocabulary including slang and cultural references.'
        break
    }
  }

  // Grammar guidance
  if (proficiency.grammar) {
    const level = proficiency.grammar.level
    guidelines += `\nGRAMMAR (${level}): `
    switch (level) {
      case 'beginner':
        guidelines += 'Stick to present tense, simple sentences. Avoid complex structures.'
        break
      case 'elementary':
        guidelines += 'Introduce past/future tense. Use coordinating conjunctions.'
        break
      case 'intermediate':
        guidelines += 'Use complex sentences, conditional forms, subordinate clauses.'
        break
      case 'advanced':
        guidelines += 'All grammatical structures fair game. Focus on subtle usage.'
        break
      case 'fluent':
        guidelines += 'Native-level grammar including colloquial shortcuts.'
        break
    }
  }

  return guidelines
}

function buildBeginnerPrompt(
  conversationType: string,
  language: string
): string {
  return `You are an expert language tutor for ${language === 'sn' ? 'Shona' : language === 'nd' ? 'Ndebele' : language === 'zh' ? 'Chinese' : 'English'}.

LEARNER PROFICIENCY: Complete beginner (no diagnostic assessment taken yet)

TEACHING GUIDELINES:
- Use ONLY the most basic, essential phrases
- Speak slowly and clearly in your mind
- Break down every concept into smallest pieces
- Provide extensive examples and context
- Be extremely patient and encouraging
- Use visual descriptions and analogies

The learner will take a diagnostic assessment soon to determine their actual level. Until then, assume zero prior knowledge.`
}
```

### AI Chat API Rebuild

**File**: `app/api/ai/chat/route.ts` (Clean rebuild)
```typescript
import { streamText } from 'ai'
import { createServerClient } from '@/lib/supabase/server'
import { moderateContent } from '@/lib/ai/moderation'
import { haiku } from '@/lib/ai/config'
import { buildSkillsAwarePrompt } from '@/lib/ai/skills-aware-prompts'

export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { messages, conversationId, language } = await req.json()

    // 1. Content moderation
    const lastMessage = messages[messages.length - 1]
    if (lastMessage.role === 'user') {
      const moderation = await moderateContent(lastMessage.content)
      if (moderation.flagged) {
        return Response.json(
          { error: 'Message flagged for inappropriate content' },
          { status: 400 }
        )
      }
    }

    // 2. Build skills-aware system prompt (THIS IS THE KEY DIFFERENCE)
    const systemPrompt = await buildSkillsAwarePrompt(
      user.id,
      'practice',
      language
    )

    // 3. Stream AI response with proficiency-aware context
    const result = streamText({
      model: haiku,
      system: systemPrompt,
      messages,
      temperature: 0.8,
      maxTokens: 1000
    })

    // 4. Store conversation asynchronously
    const conversationPromise = storeConversation(
      user.id,
      conversationId,
      messages,
      await result.text
    )

    return result.toUIMessageStreamResponse()
  } catch (error) {
    console.error('[AI Chat Error]:', error)
    return Response.json({ error: 'Failed to process chat' }, { status: 500 })
  }
}

async function storeConversation(
  userId: string,
  conversationId: string | undefined,
  messages: any[],
  aiResponse: string
) {
  // Implementation here - async, non-blocking
}
```

---

## Phase 3: Assessment System (Week 5-6)

### Goal
Create diagnostic and formative assessments that accurately measure skill proficiency.

### Diagnostic Assessment Component

**File**: `components/assessments/diagnostic-assessment.tsx`
```typescript
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import type { Assessment, Question } from '@/lib/types/skills'

interface DiagnosticAssessmentProps {
  assessment: Assessment
  skillId: string
}

export function DiagnosticAssessment({ assessment, skillId }: DiagnosticAssessmentProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const router = useRouter()

  const questions = assessment.questions
  const question = questions[currentQuestion]

  async function handleSubmit() {
    setIsSubmitting(true)

    // Submit to API for scoring
    const response = await fetch('/api/assessments/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        assessment_id: assessment.id,
        skill_id: skillId,
        answers: Object.entries(answers).map(([q_id, answer]) => ({
          question_id: q_id,
          answer
        }))
      })
    })

    const result = await response.json()

    // Navigate to results page
    router.push(`/app/assessments/results/${result.user_assessment_id}`)
  }

  return (
    <div className="max-w-3xl mx-auto p-6">
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} of {questions.length}
          </span>
          <span className="text-sm font-medium">
            {Math.round(((currentQuestion + 1) / questions.length) * 100)}%
          </span>
        </div>
        <div className="h-2 bg-secondary rounded-full">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <Card className="p-8">
        <h2 className="text-2xl font-bold mb-6">
          {question.question.en}
        </h2>

        {question.type === 'multiple_choice' && (
          <div className="space-y-3">
            {question.options?.map((option, idx) => (
              <Button
                key={idx}
                variant={answers[question.id] === option ? 'default' : 'outline'}
                className="w-full justify-start text-left h-auto py-4"
                onClick={() => setAnswers({ ...answers, [question.id]: option })}
              >
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center mr-4">
                  {String.fromCharCode(65 + idx)}
                </span>
                {option}
              </Button>
            ))}
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-8">
          <Button
            variant="ghost"
            onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
            disabled={currentQuestion === 0}
          >
            Previous
          </Button>

          {currentQuestion < questions.length - 1 ? (
            <Button
              onClick={() => setCurrentQuestion(currentQuestion + 1)}
              disabled={!answers[question.id]}
            >
              Next
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={Object.keys(answers).length !== questions.length || isSubmitting}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Assessment'}
            </Button>
          )}
        </div>
      </Card>
    </div>
  )
}
```

---

## Phase 4: Skills Dashboard (Week 7-8)

### Goal
Visualize learner's proficiency across all skills with actionable next steps.

**File**: `app/app/skills/page.tsx`
```typescript
import { createClient } from '@/lib/supabase/server'
import { SkillsDashboardClient } from '@/components/skills/skills-dashboard-client'

export default async function SkillsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  // Fetch user's skills with related data
  const { data: userSkills } = await supabase
    .from('user_skills')
    .select(`
      *,
      skill:skills(*),
      level:skill_levels(*)
    `)
    .eq('user_id', user.id)
    .order('skill.sort_order')

  // Fetch recent assessments
  const { data: recentAssessments } = await supabase
    .from('user_assessments')
    .select(`
      *,
      assessment:assessments(
        title,
        type,
        skill:skills(name, display_name, icon)
      )
    `)
    .eq('user_id', user.id)
    .order('completed_at', { ascending: false })
    .limit(5)

  return (
    <SkillsDashboardClient
      userSkills={userSkills || []}
      recentAssessments={recentAssessments || []}
    />
  )
}
```

---

## Implementation Timeline

### Week 1-2: Foundation
- [ ] Create all database migrations (028-030)
- [ ] Seed skills taxonomy
- [ ] Create TypeScript types
- [ ] Write unit tests for types
- [ ] Deploy to staging

### Week 3-4: AI Core
- [ ] Build skills-aware prompt system
- [ ] Rebuild AI chat API
- [ ] Add proficiency tracking
- [ ] Test AI adaptation at different levels
- [ ] Deploy to staging

### Week 5-6: Assessments
- [ ] Create diagnostic assessment flow
- [ ] Build assessment UI components
- [ ] Implement scoring algorithm
- [ ] Add AI-generated feedback
- [ ] Test assessment accuracy

### Week 7-8: Dashboard & Integration
- [ ] Build skills dashboard
- [ ] Add progress visualization
- [ ] Integrate with phrase filtering
- [ ] E2E testing
- [ ] Production deployment

### Week 9-10: Migration & Polish
- [ ] Migrate existing phrases to skills
- [ ] User data migration
- [ ] Performance optimization
- [ ] Documentation
- [ ] User training materials

---

## Testing Strategy

### Unit Tests
```typescript
// Example: Skills-aware prompt tests
describe('buildSkillsAwarePrompt', () => {
  it('should use beginner vocabulary for beginner learners', async () => {
    const prompt = await buildSkillsAwarePrompt(
      'beginner-user-id',
      'practice',
      'sn'
    )
    expect(prompt).toContain('Use ONLY common, essential words')
  })

  it('should adapt to mixed proficiency levels', async () => {
    // User with advanced vocabulary but beginner grammar
    const prompt = await buildSkillsAwarePrompt(
      'mixed-user-id',
      'practice',
      'sn'
    )
    expect(prompt).toContain('VOCABULARY (advanced)')
    expect(prompt).toContain('GRAMMAR (beginner)')
  })
})
```

### Integration Tests
- Test full diagnostic flow from start to finish
- Verify user_skills table updates correctly
- Ensure AI prompt changes based on assessment results

### E2E Tests
- Complete learner journey: signup → diagnostic → learn → progress → unlock
- Test progressive unlock system
- Verify AI adaptation throughout

---

## Success Metrics

### Technical
- [ ] Zero build warnings/errors
- [ ] 100% TypeScript strict mode
- [ ] >80% test coverage
- [ ] <2s AI response time
- [ ] All RLS policies tested

### User Experience
- [ ] 100% of users complete diagnostic
- [ ] >70% of users show proficiency improvement within 30 days
- [ ] Assessment completion rate >80%
- [ ] AI interaction satisfaction >4.5/5

### Business
- [ ] 30% increase in daily active users
- [ ] 50% increase in phrases mastered per user
- [ ] 40% decrease in user churn

---

## Migration Strategy

### Phase 1: Parallel Systems
- Keep old system running
- New users go through new system
- Existing users can opt-in to diagnostic

### Phase 2: Gradual Migration
- Prompt existing users to take diagnostic
- Migrate phrase progress to skills-based model
- Maintain backward compatibility

### Phase 3: Full Cutover
- All users on new system
- Deprecate old code
- Remove technical debt

---

## Conclusion

This rebuild puts AI and skills-based learning at the absolute core of the architecture. Every feature, every database table, every API endpoint is designed around the principle that:

**The AI tutor must know the learner's proficiency to teach effectively.**

By starting from scratch with this principle, we avoid the mistakes of bolting AI on as an afterthought and create a truly adaptive, personalized language learning experience.
