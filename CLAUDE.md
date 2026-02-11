# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Mukoko Lingo is an AI-first, skills-based multilingual language learning platform** (English, Shona, Ndebele, Swahili, Chinese) with both web and mobile (Expo/React Native) applications, powered by MongoDB Atlas, Stytch Auth, Vercel Serverless Functions, and Anthropic Claude.

### Core Philosophy

**Phrase Learning is Primary**: The app's main purpose is to enable learners to become multilingual through native language phrase learning. AI serves as an intelligent tutor that supports and enhances the learning process, not replaces it.

**Skills-Based Progression**: Learning is organized around proficiency skills that naturally progress through assessments:
- **Skills** → Drive the learning structure
- **Categories** → Organized by skill level
- **Phrases** → Mapped to specific skill proficiencies
- **Assessments** → Measure skill mastery and unlock progression
- **Shamwari AI** → Adapts teaching based on demonstrated proficiency

### Shamwari - The AI Mascot

**Shamwari** (meaning "friend" in Shona) is the friendly AI language tutor mascot of Mukoko Lingo. Shamwari is:
- **Who users interact with**: All AI conversations are with Shamwari
- **Personality**: Warm, patient, encouraging, playful but professional
- **Voice**: Friendly but knowledgeable, like a supportive teacher
- **Mascot file**: `/public/Shamwari_logo_Mascot.svg`

When implementing AI features, the AI should:
- Introduce itself as "Shamwari"
- Use occasional bee/friend references naturally
- Be warm and personable while maintaining educational quality

### Key Features
1. **Native Phrase Learning** - Core learning experience focused on practical phrases with global language selector
2. **Shamwari AI Tutoring** - AI powered by Anthropic Claude, adapts to learner's proficiency level
3. **Skills-Based Assessments** - Assessment engine with question bank, diagnostic and skill-specific tests
4. **User Insights Dashboard** - Bookmarks, phrase mastery tracking, skill proficiency, study analytics
5. **Progressive Learning Path** - Skills naturally unlock as proficiency grows
6. **Content Moderation** - Local guardrails + AI-based moderation for safe learning
7. **Admin Content Management** - Manage phrases, categories, skills, and moderation

## Development Commands

```bash
# Development
npx expo start           # Start Expo dev server (mobile + web)
npx expo start --web     # Start web dev server only

# Build & Deploy
npm run build:web        # Export web build for Vercel
npm run build:ios        # Build iOS via EAS
npm run build:android    # Build Android via EAS

# Database (Prisma + MongoDB)
npm run prisma:generate  # Generate Prisma client
npm run prisma:push      # Push schema to MongoDB

# Testing
npm test                 # Run all tests (Jest + jest-expo)
npm run test:watch       # Run tests in watch mode
npm run test:coverage    # Run tests with coverage report

# Code Quality
npx tsc --noEmit         # TypeScript type checking
```

## Environment Setup

**Required Environment Variables**:

```bash
# MongoDB Atlas
MONGODB_URI=mongodb+srv://...@mukoko-lingo.xxxxx.mongodb.net/?retryWrites=true&w=majority

# Stytch Authentication (server-side)
STYTCH_PROJECT_ID=project-test-6add5f68-59c6-4086-88e8-8e0dc819a9a3
STYTCH_SECRET=your-stytch-secret-key

# Stytch (client-side - exposed to mobile app)
EXPO_PUBLIC_STYTCH_PROJECT_ID=project-test-6add5f68-59c6-4086-88e8-8e0dc819a9a3
EXPO_PUBLIC_STYTCH_PUBLIC_TOKEN=your-stytch-public-token

# API Base URL (Vercel serverless functions)
EXPO_PUBLIC_API_BASE_URL=https://your-api-domain.vercel.app

# Anthropic Claude API Key (for mobile AI tutor)
EXPO_PUBLIC_ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Vercel AI Gateway (for web API routes)
AI_GATEWAY_API_KEY=your_api_key_here
```

**Note**: See `.env.example` for complete configuration template.

### Local Development

1. Copy `.env.example` to `.env.local`
2. Fill in your MongoDB Atlas connection string
3. Fill in your Stytch project credentials from https://stytch.com/dashboard
4. Run `npm run prisma:generate` to generate the Prisma client
5. Run `npx expo start` to start the dev server

## Design System & Colors

### Background Colors
- **Light Theme**: `#FAF9F5` - Warm Cream
- **Dark Theme**: `#0A0A0A` - Charcoal base
- **Cards**: White (#FFFFFF) in light mode, #141414 (Charcoal surface) in dark mode
- **Surface**: `#F3F2EE` (light), `#1E1E1E` (dark elevated)

### Color Palette (Five African Minerals)

The brand uses the **Five African Minerals** palette defined in `constants/Colors.ts`:

```typescript
// Primary - Cobalt (trust, clarity)
primary-600: #0047AB  // Light mode primary (MAIN)
primary-400: #00B0FF  // Dark mode primary

// Secondary - Tanzanite (depth, creativity)
secondary-800: #4B0082  // Light mode secondary (MAIN)
secondary-300: #B388FF  // Dark mode secondary

// Accent - Gold (achievement, warmth)
accent-800: #5D4037   // Light mode accent (warm brown)
accent-300: #FFD740   // Dark mode accent (bright gold)

// Success - Army Green (semantic: mastery, progress)
success-500: #729B63  // Main green
success-400: #8FB47F  // Lighter (hover)
success-600: #5d804f  // Darker (active)
```

### Text Colors
- **Primary**: `#141413` (light) / `#F5F5F4` (dark)
- **Secondary**: `#52524E` (light) / `#A8A8A3` (dark)
- **Muted**: `#8C8B87` (light) / `#6B6B66` (dark)

### Button Colors (CRITICAL - Always follow these)

**Light Mode Buttons:**
- Primary: Cobalt `#0047AB` with white text
- Secondary: Tanzanite `#4B0082` with white text

**Dark Mode Buttons:**
- Primary: Cobalt Bright `#00B0FF` with white text
- Secondary: Tanzanite Bright `#B388FF` with white text

See [BRANDING.md](BRANDING.md) for complete brand guidelines.

## Architecture

### Authentication System

**Architecture:**
- **Stytch** for authentication (email/password, OTP, magic links)
  - Client: `lib/auth/stytch-client.ts` - Mobile/web auth client with secure storage
  - Server: `api/_lib/auth-middleware.ts` - Vercel API auth middleware
  - Session tokens stored via SecureStore (native) or AsyncStorage (web)
- **Vercel Serverless Functions** - Backend API validates sessions with Stytch SDK

**Flow**: Client stores Stytch session token → API requests include Bearer token → Server validates with Stytch SDK → MongoDB profile lookup

**Key Files**:
- [lib/auth/stytch-client.ts](lib/auth/stytch-client.ts) - Client-side auth (sign in, sign up, OTP, magic links)
- [api/_lib/auth-middleware.ts](api/_lib/auth-middleware.ts) - Server-side auth validation + admin checks
- [lib/hooks/useAdmin.ts](lib/hooks/useAdmin.ts) - `useAdmin()` client-side hook
- [lib/services/api-client.ts](lib/services/api-client.ts) - REST API client with auth headers

### Database Schema (MongoDB + Prisma ORM)

**Schema Location**: `prisma/schema.prisma` - 18 Prisma models mapped to MongoDB collections.

**Skills & Learning Collections**:
- `skills` - 5 core skills (pronunciation, vocabulary, grammar, comprehension, conversation)
- `skill_levels` - 25 proficiency levels (5 per skill: beginner → fluent)
- `user_skills` - ⚡ **READ BY AI TUTOR FOR EVERY INTERACTION** - Current user proficiency
- `assessments` - Assessment templates for measuring skill proficiency
- `user_assessments` - User test results
- `learning_standards` - AI tutor configuration by proficiency level

**Phrase Learning Collections**:
- `phrases` - 200+ phrases in 5 languages mapped to skills and proficiency levels
- `phrase_progress` - Learning status tracking (learning/practiced/mastered)
- `bookmarks` - User-saved phrases for review
- `phrase_views` - View tracking analytics

**User & Progress Collections**:
- `profiles` - User profiles linked to Stytch via `stytch_user_id`, with role and preferences
- `study_sessions` - Daily study session analytics

**AI Tutor Collections**:
- `ai_conversations` - Chat history with conversation type and language
- `ai_messages` - Individual messages with moderation flags
- `ai_generated_phrases` - AI-created practice phrases
- `ai_recommendations` - Phrase suggestions
- `moderation_alerts` - Flagged content from AI moderation for admin review
- `guardrails` - Content moderation rules

**Access Control**: API routes enforce auth via Stytch session validation. Admin routes check `profile.role === 'admin'` in the auth middleware.

**Architecture Note**: The app is transitioning to a full skills-based model where:
1. Skills define learning objectives
2. Categories map to skill proficiency levels
3. Phrases are tagged with required skill proficiency
4. Assessments measure skill mastery
5. AI adapts based on demonstrated proficiency

### Skills-Based Learning System

**Core Principle**: Learning progression is driven by demonstrated proficiency in specific skills, not just time or phrase count.

**Learning Flow**:
1. **Initial Assessment** → Determine baseline proficiency in each skill
2. **Phrase Learning** → Practice phrases appropriate to current skill level
3. **AI Tutoring** → Get contextual help from AI tutor adapted to proficiency
4. **Skill Assessment** → Periodically test skill mastery
5. **Progressive Unlock** → Access higher-level content as skills improve

**Proficiency Levels** (from `learning_standards` table):
- **Beginner** - Basic phrases, simple grammar, high AI support
- **Elementary** - Common expressions, guided practice
- **Intermediate** - Conversational fluency, reduced scaffolding
- **Advanced** - Complex phrases, nuanced language
- **Fluent** - Native-like proficiency, minimal AI intervention

**Skills Taxonomy** (Future Implementation):
- **Pronunciation** - Sound production, tone, rhythm
- **Grammar** - Sentence structure, verb forms, particles
- **Vocabulary** - Word knowledge, context usage
- **Comprehension** - Listening and reading understanding
- **Conversation** - Real-time dialogue, cultural context

**Assessment Types**:
- **Diagnostic** - Initial skill level determination
- **Formative** - Ongoing progress checks during learning
- **Summative** - Skill mastery verification before unlock
- **Adaptive** - AI-generated questions based on performance

**Progression Logic**:
```
User starts → Diagnostic assessment → Assigned skill levels
↓
Learn phrases at current level → AI provides appropriate scaffolding
↓
Complete formative assessments → Demonstrate improving proficiency
↓
Pass summative assessment → Unlock next skill level
↓
Repeat cycle with higher-level content
```

**AI Tutor Role in Skills**:
- Reads user's proficiency from database
- Adjusts vocabulary complexity to skill level
- Provides appropriate hints/explanations
- Suggests skill-appropriate practice scenarios
- Identifies when user is ready for assessment

### Component Architecture

**Server vs Client Pattern**:
- **Server Components**: Vercel API routes use Prisma ORM from `api/_lib/prisma.ts`
- **Client Components**: Marked with `"use client"`, fetch data via REST API client from `lib/services/api-client.ts`

**Directory Structure**:
- `components/ui/` - Radix UI primitives (shadcn/ui pattern)
- `components/admin/` - Admin feature components
- `components/` - Main feature components

**Large Files to Watch**:
- [components/admin-dashboard.tsx](components/admin-dashboard.tsx) (43KB) - Monolithic admin dashboard

### Layout System (v2.0+)

**Standardized Layout Pattern**: All authenticated pages use responsive layouts with sidebar integration.

**SidebarLayout Component** (`components/sidebar-layout.tsx`):
- Automatically adjusts content margin based on sidebar collapse state
- Desktop expanded: `lg:ml-64` (256px margin)
- Desktop collapsed: `lg:ml-16` (64px margin)
- Mobile: No margin (overlay sidebar)
- Smooth 300ms transition animation

**Usage Pattern**:
```tsx
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarLayout } from "@/components/sidebar-layout"

export function PageClient() {
  return (
    <div className="min-h-screen bg-background">
      <AppSidebar />
      <SidebarLayout>
        <main className="container mx-auto px-4 py-12 max-w-6xl">
          {/* Page content */}
        </main>
      </SidebarLayout>
    </div>
  )
}
```

**AdminLayout Component** (`components/admin/admin-layout.tsx`):
- Wraps all admin pages with consistent layout
- Includes SidebarLayout for responsive margins
- Centered content with `max-w-6xl` constraint
- Professional appearance across all admin sections

**Max-Width Strategy**:
- **Forms/Reading** (`max-w-4xl` / 896px): Profile, text-heavy pages
- **Interactive** (`max-w-5xl` / 1024px): AI Practice, chat interfaces
- **Data/Dashboards** (`max-w-6xl` / 1152px): Analytics, admin pages, tables

**Sidebar State Management**:
- `useSidebar()` hook from `lib/contexts/sidebar-context.tsx`
- Global state persisted to localStorage
- Returns `{ isCollapsed, setIsCollapsed }`
- Safe default when context unavailable

### Navigation System

**AppSidebar** (`components/app-sidebar.tsx`):
- Primary navigation for all authenticated pages
- Collapsible sidebar (desktop): 256px expanded, 64px collapsed
- Overlay sidebar (mobile): Hamburger menu
- Fixed position, full height, blur effect background

**Navigation Sections** (Web):
1. **Main**: Home, Browse Phrases, AI Tutor
2. **Learning**: My Progress, My Bookmarks, Analytics
3. **Account**: Profile Settings
4. **Administration** (admin only): Overview, Users, Phrases, Standards, Skills, Moderation, Activity

**Mobile Tab Navigation** (`app/(tabs)/`):
1. **Learn** - Phrase browsing with language selector, search, inline progress indicators
2. **Shamwari** - AI chat tutor powered by Anthropic Claude
3. **Insights** - Bookmarks, phrase mastery, skill proficiency, study analytics
4. **Skills** - Skills breakdown with progress bars and assessment entry points
5. **Profile** - User settings, preferences, stats summary

**Theme & Language Controls**:
- Located in sidebar footer above user menu
- **ThemeSwitcher**: Light/Dark/System theme selection
- **LanguageSwitcher**: English, Shona, Ndebele, Chinese UI
- `useUILanguage()` hook manages language state with localStorage persistence

**AppHeader** (legacy, public pages only):
- Used for unauthenticated pages (landing, about)
- Horizontal navigation bar
- Lighter weight for marketing pages

### Admin System

**Access Control**:
- Server-side: `requireAdmin()` from `api/_lib/auth-middleware.ts` validates Stytch session + admin role
- Client-side: `useAdmin()` hook from `lib/hooks/useAdmin.ts` checks role in profiles table
- Database-level: Prisma queries filtered by authenticated user ID

**Web Admin Routes** (`/admin/`):
- `/admin/overview` - Statistics dashboard
- `/admin/users` - User management (role updates, suspend/activate)
- `/admin/phrases` - Content CRUD
- `/admin/standards` - Learning standards editor
- `/admin/moderation` - Content moderation queue
- `/admin/activity` - Activity logs and monitoring

**Mobile Admin Routes** (`app/admin/`):

The mobile app includes a full admin dashboard with the following screens:

- `app/admin/overview/` - Dashboard with stats (users, phrases, views, bookmarks)
- `app/admin/users/` - User management with role toggling
- `app/admin/phrases/` - Phrase CRUD with dynamic category/difficulty filters
- `app/admin/standards/` - Learning standards management
- `app/admin/guardrails/` - Content moderation rules (6 core guardrails)
- `app/admin/moderation/` - Review flagged content queue
- `app/admin/skills/` - Skills & assessment management (toggle skills, view levels)

**Mobile Admin Features**:

- Admin access check in `app/admin/_layout.tsx`
- Admin link in AppHeader (visible only to admin users)
- All data fetched from MongoDB via API (no hardcoded data)
- Pull-to-refresh on all admin screens
- Confirmation dialogs for destructive actions

**Admin API Routes**:
- `/api/admin/learning-standards` - CRUD for proficiency standards
- `/api/admin/update-role` - Change user roles
- `/api/admin/user-action` - Suspend/activate users
- `/api/admin/moderation/[id]` - Review moderation alerts

All admin API routes use `requireAdmin()` check.

### AI Integration (AI-First Architecture) ⚡

**Philosophy**: Mukoko Lingo is an AI-first application. The AI tutor is the CORE of the learning experience, reading user proficiency from the database for EVERY interaction to provide adaptive, personalized teaching.

**Configuration** (`lib/ai/config.ts`):
- **API Key**: `AI_GATEWAY_API_KEY` environment variable (required)
- **Gateway**: Vercel AI Gateway
- **Model**: `anthropic/claude-haiku-4.5` (all AI operations)

**Core AI System** (`lib/ai/skills-aware-prompts.ts`):
- ⚡ **`buildSkillsAwarePrompt(userId, conversationType, language)`** - Called for EVERY AI interaction
- Reads `user_skills` table to get actual proficiency levels (0-100 score per skill)
- Builds adaptive system prompt with:
  - User proficiency profile (overall + individual skills)
  - Vocabulary complexity guidance (simple → native-level)
  - Grammar complexity guidance (present simple → full grammatical range)
  - Scaffolding level (maximum support → peer conversation)
  - Error correction approach (correct everything → no corrections)
  - Recent assessment performance context
  - Conversation type specific guidance

**Adaptive Teaching Levels**:
1. **Beginner (0-49)**: Simple vocabulary, present tense only, maximum support, correct every error
2. **Elementary (50-64)**: Common vocabulary, basic tenses, high support, correct major errors
3. **Intermediate (65-79)**: Varied vocabulary, all basic tenses, moderate support, correct significant errors
4. **Advanced (80-89)**: Sophisticated vocabulary, complex grammar, light support, minimal corrections
5. **Fluent (90-100)**: Native-level language, full grammatical range, peer conversation, no corrections

**API Endpoints**:
- `app/api/ai/chat/route.ts` - ⚡ Streaming chat with skills-aware adaptive teaching
- `app/api/ai/generate-scenario/route.ts` - Generate skill-appropriate practice scenarios
- `app/api/ai/recommend-phrases/route.ts` - AI-powered phrase recommendations based on proficiency
- `app/api/ai/test/route.ts` - Test endpoint to verify AI configuration

**AI Tutor Features**:
- ⚡ **Real Proficiency Reading**: AI reads actual assessment scores from database (not guesses)
- **Adaptive Vocabulary**: Adjusts word complexity from 1-2 syllables (beginner) to technical terms/slang (fluent)
- **Adaptive Grammar**: Adjusts from present simple only (beginner) to full grammatical range (fluent)
- **Adaptive Support**: From "explain word-by-word" (beginner) to "treat as peer" (fluent)
- **Adaptive Corrections**: From "correct everything gently" (beginner) to "no corrections" (fluent)
- **Performance Context**: AI sees last 5 assessment results to reinforce weak areas
- **Content Moderation**: Real-time moderation via `lib/ai/moderation.ts` using Claude Haiku 4.5
- **Conversation History**: All interactions stored in `ai_conversations` and `ai_messages` tables

**Skills-Aware Flow**:
1. User sends message → moderation check → reject if flagged
2. `buildSkillsAwarePrompt()` reads user_skills table for current proficiency
3. Builds adaptive system prompt (vocabulary, grammar, scaffolding, corrections)
4. Includes recent assessment performance for context
5. Stream Claude Haiku 4.5 response via Vercel AI Gateway
6. Store user + assistant messages asynchronously (doesn't block response)

**User Skills Utilities** (`lib/utils/user-skills.ts`):
- `getUserSkillsWithDetails(userId)` - Get all skills with full details
- `getUserSkillLevel(userId, skillName)` - Get proficiency for specific skill
- `getUserOverallProficiency(userId)` - Calculate average proficiency across all skills
- `getUserWeakestSkill(userId)` - Find skill needing most improvement
- `getUserStrongestSkill(userId)` - Find best performing skill
- `calculateProgressToNextLevel(userId, skillName)` - Progress percentage to next level
- `getRecommendedPhrases(userId, limit)` - Filter phrases by proficiency
- `getSkillsDashboardSummary(userId)` - Complete progress overview
- `shouldTakeDiagnosticAssessment(userId)` - Check if user needs initial assessment
- `initializeUserSkills(userId)` - Create user_skills entries for new users

**Example AI Adaptation**:
```typescript
// User with mixed proficiency:
// - Vocabulary: 68/100 (intermediate)
// - Grammar: 52/100 (elementary)
// - Conversation: 38/100 (beginner)

// AI adapts to WEAKEST skill (conversation):
// - Uses simple vocabulary (not overwhelming)
// - Uses basic grammar structures
// - Provides HIGH support with frequent checks
// - Gently corrects major errors
// - Encourages conversation practice
```

**Important**: The `AI_GATEWAY_API_KEY` must be set in environment variables. The AI SDK routes requests through Vercel AI Gateway for model access.

## Data Fetching Patterns

### API Client (All data flows through REST API)
```typescript
// In any component
import { phrasesApi, bookmarksApi, profilesApi } from '@/lib/services/api-client'

// Fetch data (auth token automatically included)
const { data: phrases } = await phrasesApi.listPhrases({ category: 'greetings' })
const { data: bookmarks } = await bookmarksApi.listBookmarks()
const { data: profile } = await profilesApi.getMyProfile()
```

### Server-Side (Vercel API Routes)
```typescript
// In api/ serverless functions - use Prisma directly
import prisma from '../_lib/prisma'
import { requireAuth, requireAdmin } from '../_lib/auth-middleware'

const user = await requireAuth(req)
const phrases = await prisma.phrase.findMany({ where: { category: 'greetings' } })
```

### Optimistic Updates
Bookmarks and progress use optimistic UI updates: update local state immediately, sync to API, revert on error.

## Database Schema Management

**Schema**: `prisma/schema.prisma` (Prisma ORM with MongoDB)

**Commands**:
```bash
npm run prisma:generate    # Generate Prisma client types
npm run prisma:push         # Push schema changes to MongoDB
npx prisma studio           # Open Prisma Studio (GUI for data)
```

## Key Utilities

**Core Libraries**:
- `lib/db/prisma.ts` - Prisma client singleton (MongoDB ORM)
- `lib/db/mongodb.ts` - Raw MongoDB client for direct queries
- `lib/auth/stytch-client.ts` - Stytch auth client (email, OTP, magic links, sessions)
- `lib/services/api-client.ts` - REST API client for all data operations
- `lib/ai/config.ts` - AI model configuration and Vercel AI Gateway setup
- `lib/ai/chat-service.ts` - Anthropic Claude API integration for Shamwari chatbot
- `lib/ai/moderation.ts` - Content moderation (local guardrails + AI-based via Claude Haiku)
- `lib/ai/skills-aware-prompts.ts` - Build adaptive AI prompts based on user proficiency
- `lib/data/phrases-data.ts` - 200+ phrases in 4 languages
- `lib/data/assessment-questions.ts` - Assessment question bank (20+ questions across 5 skills)
- `lib/data/translations.ts` - UI translations for 4 languages
- `lib/storage/database.d.ts` - Platform-agnostic storage interface
- `lib/storage/database.web.ts` - AsyncStorage implementation (web)
- `lib/storage/database.native.ts` - SQLite implementation (iOS/Android)
- `lib/types/skills.ts` - Skills system type definitions

**React Hooks** (Mobile):
- `lib/hooks/useLearningLanguage.tsx` - Global learning language state with AsyncStorage persistence
- `lib/hooks/useTheme.tsx` - Theme management (light/dark/system)
- `lib/hooks/useAdmin.ts` - Admin role checking (client-side)

**React Hooks** (Web):
- `lib/hooks/use-admin.ts` - Admin role checking (client-side)
- `lib/hooks/use-ui-language.ts` - UI language state management with localStorage
- `lib/contexts/sidebar-context.tsx` - Sidebar collapse state management with localStorage

## Special Considerations

### Authentication Security
Authentication is handled by Stytch. Session tokens are stored in SecureStore (native) or AsyncStorage (web). All API routes validate sessions via the Stytch SDK on the server side.

### Build Configuration
- Image optimization disabled (`unoptimized: true`)
- TypeScript/ESLint errors ignored during builds for rapid iteration
- This is intentional for fast prototyping but should be addressed for production

### Testing Infrastructure
- **Framework**: Jest with jest-expo preset, React Testing Library
- **Test count**: 87+ tests across 8 test suites
- **CI pipeline**: GitHub Actions runs tests on push (`npm test -- --ci`)
- **Coverage areas**:
  - `lib/data/__tests__/` - Phrase data integrity, translations, assessment questions
  - `lib/ai/__tests__/` - Chat service (simulated mode), content moderation
  - `lib/storage/__tests__/` - Database operations (bookmarks, progress, skills, sessions, streaks)
  - `lib/hooks/__tests__/` - Custom hooks (useLearningLanguage)
  - `components/__tests__/` - Component rendering

### Technical Debt
- Large monolithic components (especially `admin-dashboard.tsx`)
- Duplicate API routes: Both `/api/ai/chat` and `/api/chat` have identical implementations
- Limited error boundaries
- Some build warnings ignored

### Performance Notes
- Phrases limited to 100-200 per query
- Recent views capped at 20 items
- Analytics computed on-demand (not pre-aggregated)
- Client-side filtering for categories/search

## Common Workflows

### Implementing Skills-Based Features

When adding new skills-based functionality, follow this pattern:

1. **Database Schema** - Add/update tables for skills tracking:
   ```sql
   -- Example: Add skills table
   CREATE TABLE skills (
     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
     name TEXT NOT NULL,
     description TEXT,
     proficiency_levels TEXT[] -- ['beginner', 'intermediate', 'advanced']
   );

   -- Link phrases to skills
   ALTER TABLE phrases ADD COLUMN skill_id UUID REFERENCES skills(id);
   ALTER TABLE phrases ADD COLUMN required_proficiency TEXT;
   ```

2. **Update AI System Prompts** - Modify `lib/learning-standards.ts`:
   - Add skill-specific context to `buildAISystemPrompt()`
   - Include user's proficiency in each skill
   - Adjust AI behavior based on skill mastery

3. **Create Assessment Flow** - Build assessment components:
   - Diagnostic assessment (initial)
   - Formative assessment (ongoing)
   - Summative assessment (skill unlock)
   - Store results in `assessments` and `user_skills` tables

4. **Update Phrase Filtering** - Filter phrases by skill/proficiency:
   - Query phrases based on user's skill levels
   - Show only appropriate-level content
   - Progressive unlock as proficiency improves

5. **AI Tutor Integration** - Ensure AI adapts to skills:
   - AI reads user's skill proficiency
   - Adjusts response complexity
   - Suggests skill-appropriate exercises

### Adding a New App Page (Authenticated)
1. Create page in `app/app/[feature]/page.tsx` (Server Component)
2. Create client component in `components/[feature]-client.tsx`
3. Use standardized layout pattern:
   ```tsx
   "use client"
   import { AppSidebar } from "@/components/app-sidebar"
   import { SidebarLayout } from "@/components/sidebar-layout"
   import { useUILanguage } from "@/lib/hooks/use-ui-language"

   export function FeatureClient() {
     const { uiLanguage } = useUILanguage()

     return (
       <div className="min-h-screen bg-background">
         <AppSidebar />
         <SidebarLayout>
           <main className="container mx-auto px-4 py-12 max-w-6xl">
             {/* Your content */}
           </main>
         </SidebarLayout>
       </div>
     )
   }
   ```
4. Add navigation link to `components/app-sidebar.tsx`
5. Choose appropriate max-width: `max-w-4xl` (forms), `max-w-5xl` (interactive), `max-w-6xl` (data)

### Adding a New Admin Feature
1. Create component in `components/admin/`
2. Add route in `app/admin/[feature]/page.tsx`
3. Use AdminLayout wrapper:
   ```tsx
   import { AdminLayout } from "@/components/admin/admin-layout"

   export default function AdminFeaturePage() {
     return (
       <AdminLayout>
         {/* Your admin content */}
       </AdminLayout>
     )
   }
   ```
4. Create API route in `app/api/admin/` if needed
5. Add `requireAdmin()` check to API route
6. Update admin navigation in `components/app-sidebar.tsx`
7. Create database migration if schema changes needed

### Adding a New Phrase Category
1. Update `phrases` table data via admin UI or SQL
2. Categories are stored as strings, no schema change needed
3. Client-side filtering handles new categories automatically

### Modifying Learning Standards
1. Use admin UI at `/admin/standards`
2. Standards stored in `learning_standards` table
3. Changes affect AI conversation context via API routes
4. Standards define vocabulary complexity and explanation depth

### Working with AI Features
1. All AI endpoints in `app/api/ai/`
2. Add moderation check using `moderateContent()` from `lib/ai/moderation.ts`
3. Use Vercel AI SDK for streaming: `streamText()` from 'ai' package
4. Store conversations in `ai_conversations` and `ai_messages` tables
5. Failed moderation creates `moderation_alerts` for admin review

## Testing Locally

1. Configure environment variables (see Environment Setup above)
2. Start dev server: `npm run dev`
3. Sign up for a test account via `/auth/login`
4. To test admin features, update your user role in MongoDB:
   ```bash
   # Via Prisma Studio
   npx prisma studio
   # Find your profile and set role to 'admin'
   ```
5. Access admin dashboard at `http://localhost:3000/admin/overview`
6. Test AI features at `/app/ai-practice`
7. Check moderation queue at `/admin/moderation`
8. Test sidebar collapse/expand functionality
9. Test theme switching (light/dark/system)
10. Test language switching (4 languages)

**Note**: Admin access requires the `role` column in the `profiles` table to be set to `'admin'`.

---

## Documentation Structure

### Documentation Organization

All project documentation follows a clean, organized structure:

**Root Directory** (Essential documents only):
- **CLAUDE.md** - Developer guide (this file)
- **README.md** - Project overview and quick start
- **DEPLOYMENT.md** - Deployment instructions
- **SECURITY.md** - Security architecture
- **CHANGELOG.md** - Version history
- **RELEASES.md** - Release management
- **BRANDING.md** - Brand guidelines
- **DEV_MODE.md** - Development mode guide

**`/summaries/`** - Work completion summaries and migration documentation:
- Feature implementation summaries
- Migration completion reports
- Fix and improvement documentation
- Historical work records

**`/docs/`** - Technical documentation and guides:
- Design system documentation
- API documentation
- Architecture guides
- Developer references

**`/scripts/`** - Database migrations and utilities:
- All SQL migration files (numbered 001-027+)
- Migration application scripts
- Database utilities

**`/brand/`** - Brand assets and guidelines:
- Official brand guideline PDFs
- Logo files and variations
- Color palettes and typography
- Brand voice guidelines

### Creating New Documentation

**IMPORTANT**: When creating new completion summaries, migration docs, or work records:

1. **Always place in `/summaries/`** directory
2. Use descriptive filenames with uppercase and underscores (e.g., `FEATURE_IMPLEMENTATION_COMPLETE.md`)
3. Reference the summary in CLAUDE.md only if it introduces new patterns or workflows
4. Keep root directory clean - only essential, frequently-referenced documents belong there

**Example Workflow**:
```bash
# Good: Summary goes in summaries/
echo "Implementation complete" > summaries/NEW_FEATURE_COMPLETE.md
git add summaries/NEW_FEATURE_COMPLETE.md

# Bad: Don't clutter root
echo "Implementation complete" > NEW_FEATURE_COMPLETE.md  # ❌ Wrong location
```

### Related Documentation

### Core Documentation (Root)

- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide for Vercel and MongoDB Atlas
- **[SECURITY.md](SECURITY.md)** - Security architecture, Stytch auth, MongoDB access control
- **[CHANGELOG.md](CHANGELOG.md)** - Complete version history and release notes
- **[RELEASES.md](RELEASES.md)** - Release management and versioning guidelines
- **[DEV_MODE.md](DEV_MODE.md)** - Development mode setup and security warnings
- **[BRANDING.md](BRANDING.md)** - Brand guidelines, colors, typography, UI patterns
- **[LICENSE](LICENSE)** - MIT License

### Technical Documentation (/docs)
- **[docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md)** - Component library and design patterns

### Work Summaries (/summaries)
- **[summaries/SIDEBAR_LAYOUT_MIGRATION_COMPLETE.md](summaries/SIDEBAR_LAYOUT_MIGRATION_COMPLETE.md)** - v2.0 layout system implementation
- **[summaries/UNIFIED_LAYOUT_COMPLETE.md](summaries/UNIFIED_LAYOUT_COMPLETE.md)** - Unified layout across all pages
- **[summaries/APP_HEADER_TO_SIDEBAR_MIGRATION.md](summaries/APP_HEADER_TO_SIDEBAR_MIGRATION.md)** - Migration from AppHeader to AppSidebar
- **[summaries/THEME_AND_LANGUAGE_CONTROLS_ADDED.md](summaries/THEME_AND_LANGUAGE_CONTROLS_ADDED.md)** - Theme and language switcher integration
- **[summaries/CENTERED_LAYOUT_APPLIED.md](summaries/CENTERED_LAYOUT_APPLIED.md)** - Centered layout implementation
- **[summaries/BRAND_IMPLEMENTATION_COMPLETE.md](summaries/BRAND_IMPLEMENTATION_COMPLETE.md)** - Brand color implementation
- **[summaries/HYDRATION_AND_RESPONSIVE_FIXES.md](summaries/HYDRATION_AND_RESPONSIVE_FIXES.md)** - Hydration error fixes
- **[summaries/FIXES_SUMMARY.md](summaries/FIXES_SUMMARY.md)** - Summary of major fixes and improvements
- **[summaries/NAVIGATION_FIX_SUMMARY.md](summaries/NAVIGATION_FIX_SUMMARY.md)** - Navigation system improvements
- **[summaries/MOBILE_USABILITY_FIXES.md](summaries/MOBILE_USABILITY_FIXES.md)** - Mobile responsiveness fixes

---

## Project Status

**Current Version**: 3.0.0 (February 2026)
**Framework**: Expo/React Native, MongoDB Atlas, Prisma ORM, Stytch Auth, Vercel Serverless Functions
**Status**: Active development - migrated from Supabase to MongoDB + Stytch
**Architecture**: Skills-based learning system with Vercel API backend

**Strategic Direction**:
- **Primary Goal**: Native phrase learning for multilingual proficiency
- **AI Role**: Intelligent tutor that adapts to learner's skill level
- **Learning Model**: Skills-based progression with proficiency assessments
- **Content Organization**: Phrases mapped to skills and proficiency levels
- **Unlock System**: Progressive content access based on demonstrated mastery

**Next Phase** (Skills Implementation):
1. Create `skills`, `assessments`, and `user_skills` tables
2. Build diagnostic assessment flow
3. Implement skills-based phrase filtering
4. Add proficiency tracking dashboard
5. Enhance AI tutor with granular skill awareness

## Brand Colors (February 2026 — Five African Minerals)

### Brand Color Palette

| Color | Light Hex | Dark Hex | Usage |
|-------|-----------|----------|-------|
| **Cobalt (Primary)** | #0047AB | #00B0FF | Main CTAs, primary actions, trust |
| **Tanzanite (Secondary)** | #4B0082 | #B388FF | Depth, creativity, secondary actions |
| **Gold (Accent)** | #5D4037 | #FFD740 | Achievement, warmth, premium |
| **Army Green (Success)** | #729B63 | #8FB47F | Mastery, progress, success states |

### Implementation

Colors are defined in `constants/Colors.ts` and consumed via `lightTheme` / `darkTheme` objects. All styling uses React Native `StyleSheet` (no Tailwind/CSS).

```typescript
import { Colors, lightTheme, darkTheme } from '@/constants/Colors'

// Use theme objects for semantic colors
const theme = isDark ? darkTheme : lightTheme
style={{ backgroundColor: theme.primary }}  // #0047AB or #00B0FF

// Use Colors directly for specific shades
style={{ backgroundColor: Colors.primary[600] }}  // Always #0047AB
```

