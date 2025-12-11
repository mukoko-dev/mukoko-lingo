# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Nyuchi Lingo is an AI-first, skills-based multilingual language learning platform** (English, Shona, Ndebele, Chinese) built with Next.js 16, Supabase, Vercel, and AI Gateway with DeepSeek/Qwen models.

### Core Philosophy

**Phrase Learning is Primary**: The app's main purpose is to enable learners to become multilingual through native language phrase learning. AI serves as an intelligent tutor that supports and enhances the learning process, not replaces it.

**Skills-Based Progression**: Learning is organized around proficiency skills that naturally progress through assessments:
- **Skills** → Drive the learning structure
- **Categories** → Organized by skill level
- **Phrases** → Mapped to specific skill proficiencies
- **Assessments** → Measure skill mastery and unlock progression
- **Shamwari AI** → Adapts teaching based on demonstrated proficiency

### Shamwari - The AI Mascot

**Shamwari** (meaning "friend" in Shona) is the friendly AI language tutor mascot of Nyuchi Lingo. Shamwari is:
- **Who users interact with**: All AI conversations are with Shamwari
- **Personality**: Warm, patient, encouraging, playful but professional
- **Voice**: Friendly but knowledgeable, like a supportive teacher
- **Mascot file**: `/public/Shamwari_logo_Mascot.svg`

When implementing AI features, the AI should:
- Introduce itself as "Shamwari"
- Use occasional bee/friend references naturally
- Be warm and personable while maintaining educational quality

### Key Features
1. **Native Phrase Learning** - Core learning experience focused on practical phrases
2. **Shamwari AI Tutoring** - AI adapts to learner's proficiency level
3. **Skills-Based Assessments** - Track progress through proficiency evaluations
4. **Progressive Learning Path** - Skills naturally unlock as proficiency grows
5. **Admin Content Management** - Manage phrases, categories, and skill mappings

## Development Commands

```bash
# Development
npm run dev              # Start Next.js dev server (localhost:3000)

# Build & Deploy
npm run build            # Production build
npm run start            # Start production server

# Code Quality
npm run lint             # Run ESLint
```

## Environment Setup

**Required Environment Variables**:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key

# Cloudflare AI Gateway Configuration (Required for AI tutor features)
AI_GATEWAY_API_KEY=your_api_key_here

# Get your gateway API key from Cloudflare AI Gateway dashboard
# Note: Currently using Vercel AI SDK with Cloudflare gateway integration
```

**Note**: See `.env.example` for complete configuration template.

### Local Development

For local development, you must configure proper Supabase authentication:

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase credentials from the Supabase dashboard
3. Add your `AI_GATEWAY_API_KEY` from Vercel
4. Run `npm run dev`

**Dev Mode Removed**: As of recent security updates, development mode (which bypassed authentication) has been removed. All environments now require proper Supabase authentication. See [DEV_MODE.md](DEV_MODE.md) for historical context and security rationale.

## Design System & Colors

### Background Colors
- **Light Theme**: `#faf9f5` - Warm off-white, reduces eye strain, better contrast
- **Dark Theme**: `#101010` - Very dark for depth
- **Cards**: Always white (#ffffff) in light mode, #1a1a1a in dark mode for elevation

### Button Colors (CRITICAL - Always follow these)

**Light Mode Buttons:**
- Primary: `bg-primary-700` (#5f5873) with white text
- Secondary: `bg-secondary-500` (#729B63) with white text
- Hover: `bg-primary-600` / `bg-secondary-400`
- Active: `bg-primary-800` / `bg-secondary-600`

**Dark Mode Buttons:**
- Primary: `bg-primary-600` (#7c73e6 - Ubuntu blue) with white text
- Secondary: `bg-secondary-400` (#8FB47F) with white text
- Hover: `bg-primary-500` / `bg-secondary-300`

**NEVER use `bg-primary` without scale suffix (700/600/500)** - it references CSS variables that blend with backgrounds.

### Navigation Colors (CRITICAL - Sidebar & Menu)

**IMPORTANT**: Navigation items use hardcoded hex values (not CSS variables) for guaranteed WCAG compliance.

**Section Headers:**
```tsx
// Always use hardcoded hex values
className="text-[#6b6b6b] dark:text-[#a8a8a8]"  // 5.74:1 / 4.93:1 contrast
```

**Active Navigation Items:**
```tsx
// Active state - high contrast
className="bg-[#5f5873] text-white shadow-sm dark:bg-[#7c73e6]"  // 8.5:1 / 7.2:1 contrast
```

**Inactive/Hover Navigation Items:**
```tsx
// Default and hover states
className="text-[#6b6b6b] hover:bg-[#f0f0f0] hover:text-[#2a2a2a] dark:text-[#a8a8a8] dark:hover:bg-[#343434] dark:hover:text-[#faf9f5]"
```

**Why Hex Values?**
- CSS variables like `bg-primary` or `text-muted-foreground` can blend with backgrounds
- Hardcoded values guarantee WCAG AA/AAA contrast ratios (4.93:1 to 14.2:1)
- Same approach as Button component for consistency
- Next.js 16 + Turbopack compatibility

**Example Pattern** (AppSidebar):
```tsx
<Link
  className={cn(
    "flex items-center gap-3 rounded-lg transition-colors",
    isActive
      ? "bg-[#5f5873] text-white shadow-sm dark:bg-[#7c73e6]"
      : "text-[#6b6b6b] hover:bg-[#f0f0f0] hover:text-[#2a2a2a] dark:text-[#a8a8a8] dark:hover:bg-[#343434] dark:hover:text-[#faf9f5]"
  )}
>
  <Icon className="h-5 w-5 shrink-0" />
  <span className="text-sm font-medium">{label}</span>
</Link>
```

### Badge Colors
- Default: Same as primary buttons (bg-primary-700 light / bg-primary-600 dark)
- Success: `bg-secondary-500` (Army green) with white text
- Outline: `border-border bg-transparent` with foreground text

### Color Palette Reference
```typescript
// Primary - Warm Purple (Nyuchi Africa)
primary-700: #5f5873  // Main brand (buttons, badges)
primary-600: #7c73e6  // Ubuntu blue (dark mode, hover)
primary-500: #9186ae  // Lighter variant
primary-800: #4a4560  // Active states

// Secondary - Army Green (Success)
secondary-500: #729B63  // Main green
secondary-400: #8FB47F  // Lighter (hover)
secondary-600: #5d804f  // Darker (active)

// Accent - Sunset Gold
accent-500: #F6AD55  // Achievements, premium
```

See [BRANDING.md](BRANDING.md) for complete brand guidelines.

### Marketing Site Design System

**Visual Design Principles:**
- Use gradient backgrounds instead of plain white/colors
- Gradient text with `bg-gradient-to-r bg-clip-text text-transparent`
- Hover effects with scale transforms and shadow transitions
- Border-2 on cards with subtle hover states
- Rounded-xl (12px) for modern icon containers
- Leading-relaxed for improved readability

**Gradient Patterns:**
```tsx
// Hero Section
bg-gradient-to-br from-primary-700/10 via-background to-secondary-500/5

// Stats Bar
bg-gradient-to-r from-muted/50 via-muted/30 to-muted/50

// Solutions Section
bg-gradient-to-br from-secondary-500/5 via-background to-primary-700/5

// CTA Section
bg-gradient-to-br from-primary-700/10 via-secondary-500/5 to-accent-500/5
```

**Card Design:**
```tsx
// Feature Cards
<Card className="border-2 hover:border-primary-700/50 hover:shadow-lg transition-all duration-300 group bg-card">
  <CardContent className="p-6">
    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-700/20 to-primary-600/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
      <Icon className="w-6 h-6 text-primary-700" />
    </div>
  </CardContent>
</Card>
```

**Accessibility:**
- All gradients maintain WCAG AA contrast ratios
- Hover states work with keyboard navigation
- Semantic HTML with proper headings (h1 → h6)
- ARIA labels on interactive elements
- Focus visible states on all interactive elements

**Mobile Responsiveness:**
- Grid layouts: `grid-cols-2 md:grid-cols-4` for stats
- Text sizing: `text-4xl sm:text-5xl md:text-6xl` for headings
- Padding: `px-4 sm:px-6` for consistent spacing
- Buttons: `flex-col sm:flex-row` for stacked mobile layout

## Architecture

### Authentication System

**Architecture:**
- **Supabase Auth** with server/client separation (all environments)
  - Server: `lib/supabase/server.ts` (async cookies)
  - Client: `lib/supabase/client.ts` (singleton)
  - Middleware: `middleware.ts` refreshes sessions and protects routes
- **Previous Dev Mode**: Removed for security (see `.env.example` and [DEV_MODE.md](DEV_MODE.md))

**Flow**: Middleware validates Supabase session → refreshes if needed → redirects unauthenticated users to `/auth/login`

**Key Files**:
- [middleware.ts](middleware.ts) - Route protection and session refresh
- [lib/supabase/admin.ts](lib/supabase/admin.ts) - `isAdmin()` server-side check
- [lib/hooks/use-admin.ts](lib/hooks/use-admin.ts) - `useAdmin()` client-side hook
- [lib/dev-mode.ts](lib/dev-mode.ts) - Legacy file (no longer used)

### Database Schema (Skills-Based Architecture)

**Skills & Learning Tables** (Core):
- `skills` - 5 core skills (pronunciation, vocabulary, grammar, comprehension, conversation)
- `skill_levels` - 25 proficiency levels (5 per skill: beginner → fluent)
- `user_skills` - ⚡ **READ BY AI TUTOR FOR EVERY INTERACTION** - Current user proficiency
- `assessments` - Assessment templates for measuring skill proficiency
- `user_assessments` - User test results (auto-updates user_skills via trigger)
- `learning_standards` - AI tutor configuration by proficiency level (legacy, deprecated)

**Phrase Learning Tables**:
- `phrases` - 200+ phrases in 4 languages mapped to skills and proficiency levels
- `categories` - Organized by skill level (beginner phrases, intermediate, etc.)
- `phrase_progress` - Learning status tracking (learning/practiced/mastered)
- `bookmarks` - User-saved phrases for review

**User & Progress Tables**:
- `profiles` - User profiles with role (user/admin), current proficiency level, preferences
- `study_sessions` - Daily study session analytics
- `phrase_progress` - Individual phrase mastery tracking

**AI Tutor Tables**:
- `ai_conversations` - Chat history with conversation type and language
- `ai_messages` - Individual messages with moderation flags
- `moderation_alerts` - Flagged content from AI moderation for admin review

**Key Functions**:
- `is_admin()` / `check_is_admin()` - Role checking for admin access
- `update_study_streak()` - Trigger maintains daily streaks
- `get_user_activity_summary()` - Admin dashboard analytics
- `update_user_skill_from_assessment()` - Auto-updates user_skills when assessment completes
- `get_user_overall_proficiency(user_id)` - Calculate overall proficiency level

**Row Level Security**: All tables have RLS policies. Users access only their own data; admins have elevated access via role checks.

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
- **Server Components**: Fetch data server-side using `createClient()` from `lib/supabase/server.ts`, pass as props
- **Client Components**: Marked with `"use client"`, handle interactivity using singleton from `lib/supabase/client.ts`

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

**Navigation Sections**:
1. **Main**: Home, Browse Phrases, AI Tutor
2. **Learning**: My Progress, My Bookmarks, Analytics
3. **Account**: Profile Settings
4. **Administration** (admin only): Overview, Users, Phrases, Standards, Moderation, Activity

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
- Server-side: `await isAdmin()` from `lib/supabase/admin.ts`
- Client-side: `useAdmin()` hook checks role in profiles table
- Database-level: RLS policies + `is_admin()` function

**Admin Routes**:
- `/admin/overview` - Statistics dashboard
- `/admin/users` - User management (role updates, suspend/activate)
- `/admin/phrases` - Content CRUD
- `/admin/standards` - Learning standards editor
- `/admin/moderation` - Content moderation queue
- `/admin/activity` - Activity logs and monitoring

**Admin API Routes**:
- `/api/admin/learning-standards` - CRUD for proficiency standards
- `/api/admin/update-role` - Change user roles
- `/api/admin/user-action` - Suspend/activate users
- `/api/admin/moderation/[id]` - Review moderation alerts

All admin API routes use `requireAdmin()` check.

### AI Integration (AI-First Architecture) ⚡

**Philosophy**: Nyuchi Lingo is an AI-first application. The AI tutor is the CORE of the learning experience, reading user proficiency from the database for EVERY interaction to provide adaptive, personalized teaching.

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

### Server-Side (Preferred)
```typescript
// In Server Component (app/page.tsx)
import { createClient } from '@/lib/supabase/server'

const supabase = await createClient()
const { data } = await supabase.from('phrases').select('*')
return <ClientComponent data={data} />
```

### Client-Side (Interactive)
```typescript
// In Client Component
"use client"
import { createClient } from '@/lib/supabase/client'

const supabase = createClient() // singleton
const { data } = await supabase.from('bookmarks').select('*')
```

### Optimistic Updates
Bookmarks and progress use optimistic UI updates: update local state immediately, sync to database, revert on error.

## Database Migrations

**Location**: `scripts/` directory (27 SQL files numbered 001-027)

**Migration Types**:
- Schema changes (CREATE TABLE, ALTER TABLE)
- Row Level Security policies
- Database functions (PL/pgSQL)
- Database triggers
- Indexes for performance
- Data seeding

**Applying Migrations**:

1. **Create SQL file** in `scripts/` (e.g., `028_your_migration.sql`)
2. **Apply via Supabase Dashboard**:
   - Go to SQL Editor
   - Copy migration file contents
   - Paste and run
   - Verify success
3. **Or use Supabase CLI** (development):
   ```bash
   # Install CLI
   npm install -g supabase

   # Link project
   supabase link --project-ref your-project-ref

   # Apply all migrations
   supabase db push

   # Reset database (DESTRUCTIVE - Dev only!)
   supabase db reset
   ```

**Migration Order**: Critical! Apply in numerical order (001 → 027)

**Recent Migrations**:
- 001-002: Initial phrases and seed data
- 003-004: Profiles and preferences
- 005-007: Bookmarks and favorites
- 008-011: Progress tracking and AI features
- 012-015: AI conversations and moderation
- 016-020: User ID column fixes
- 022-024: Learning standards
- 025: Performance indexes
- 026: User status and partitioning
- 027: Critical RLS policy fixes

## Key Utilities

**Core Libraries**:
- `lib/supabase/` - Database client configurations
- `lib/ai/config.ts` - AI model configuration and Vercel AI Gateway setup
- `lib/ai/moderation.ts` - Content moderation with Claude Haiku
- `lib/learning-standards.ts` - Build AI system prompts based on user proficiency
- `lib/phrases-data.ts` - Phrase type definitions (59KB)
- `lib/translations.ts` - UI translations for 4 languages (16KB)
- `lib/seo-config.ts` - Metadata and structured data
- `lib/dev-mode.ts` - Legacy file (dev mode removed)

**React Hooks**:
- `lib/hooks/use-admin.ts` - Admin role checking (client-side)
- `lib/hooks/use-ui-language.ts` - UI language state management with localStorage
- `lib/contexts/sidebar-context.tsx` - Sidebar collapse state management with localStorage

## Special Considerations

### Authentication Security
**Dev mode has been removed** as of recent updates. All environments now require proper Supabase authentication. The previous dev mode (which used `NEXT_PUBLIC_DEV_MODE` and a mock UUID) has been deprecated for security reasons. See [DEV_MODE.md](DEV_MODE.md) and `.env.example` for details.

### Build Configuration
- Image optimization disabled (`unoptimized: true`)
- TypeScript/ESLint errors ignored during builds for rapid iteration
- This is intentional for fast prototyping but should be addressed for production

### Technical Debt
- Large monolithic components (especially `admin-dashboard.tsx`)
- Duplicate API routes: Both `/api/ai/chat` and `/api/chat` have identical implementations
- No automated testing visible in codebase
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
4. To test admin features, manually update your user role in Supabase:
   ```sql
   UPDATE profiles SET role = 'admin' WHERE email = 'your-test-email@example.com';
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
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Complete deployment guide for Vercel and Supabase
- **[SECURITY.md](SECURITY.md)** - Security architecture, RLS policies, authentication
- **[CHANGELOG.md](CHANGELOG.md)** - Complete version history and release notes
- **[RELEASES.md](RELEASES.md)** - Release management and versioning guidelines
- **[DEV_MODE.md](DEV_MODE.md)** - Development mode setup and security warnings
- **[BRANDING.md](BRANDING.md)** - Brand guidelines, colors, typography, UI patterns

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

**Current Version**: 2.0.0 (November 19, 2025)
**Framework**: Next.js 16, React 19, Supabase, Vercel, Cloudflare AI Gateway
**Status**: Production-ready with continuous deployment
**Architecture**: Transitioning to full skills-based learning system

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

## Brand Colors (November 11, 2025 Update)

### Button Color Implementation

**IMPORTANT**: Buttons use hardcoded hex values (not Tailwind classes) due to Next.js 16 + Turbopack compatibility.

### Available Button Variants

```tsx
// Primary (Purple #5f5873)
<Button>Primary Action</Button>
<Button variant="default">Primary Action</Button>

// Secondary (Green #729B63)
<Button variant="secondary">Secondary Action</Button>

// Sunset Deep (Orange #d4634a) - Premium/Highlights
<Button variant="gold">Premium Feature</Button>

// Warm Brown (#8B7355) - Cultural Content
<Button variant="warm-brown">Cultural Content</Button>

// Other Variants
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="destructive">Delete</Button>
<Button variant="success">Success</Button>
<Button variant="link">Link</Button>
```

### Brand Color Palette

| Color | Hex | Usage | Variant |
|-------|-----|-------|---------|
| **Primary Purple** | #5f5873 | Main CTAs, primary actions | `default` |
| **Secondary Green** | #729B63 | Success, secondary actions | `secondary` |
| **Sunset Deep** | #d4634a | Premium, highlights | `gold` |
| **Warm Brown** | #8B7355 | Cultural content | `warm-brown` |

### Why Hex Values?

Buttons use `bg-[#5f5873]` instead of `bg-primary-700` because Next.js 16 + Turbopack + CVA doesn't reliably generate dynamic Tailwind classes. Arbitrary value syntax guarantees colors render correctly.

### Accessibility

All button combinations meet WCAG 2.1 standards:
- Purple + White: 8.5:1 (AAA) ✅
- Green + White: 5.1:1 (AA) ✅
- Sunset + White: 4.8:1 (AA) ✅
- Brown + White: 4.9:1 (AA) ✅

**See**: [summaries/CONTRAST_FIXES_COMPLETE.md](summaries/CONTRAST_FIXES_COMPLETE.md) for complete contrast ratio documentation and navigation color patterns.

