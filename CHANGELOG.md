# Changelog - Nyuchi Lingo

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [Unreleased]

### Planned
- Offline mode support for phrase browsing
- Push notifications for study reminders
- Gamification elements (badges, achievements)
- Social features (study groups, leaderboards)
- Audio pronunciation guides
- Cultural context lessons

---

## [3.0.0] - 2025-12-11

### Major Release - AI-First Skills-Based Architecture

This release transforms Nyuchi Lingo into an AI-first, skills-based learning platform where the AI tutor reads user proficiency from the database for every interaction.

### Added

#### Phase 2: Skills-Aware AI System
- **Skills-Aware AI Prompts** (`lib/ai/skills-aware-prompts.ts`) - AI reads user proficiency for every interaction
- **buildSkillsAwarePrompt()** function adapts teaching based on actual assessment scores
- **Adaptive Teaching Levels**:
  - Beginner (0-49): Simple vocabulary, present tense, maximum support
  - Elementary (50-64): Common vocabulary, basic tenses, high support
  - Intermediate (65-79): Varied vocabulary, all tenses, moderate support
  - Advanced (80-89): Sophisticated vocabulary, complex grammar, light support
  - Fluent (90-100): Native-level language, peer conversation
- **User Skills Utilities** (`lib/utils/user-skills.ts`) - 15+ helper functions for skills management

#### Phase 3: Diagnostic Assessment System
- **50-Question Diagnostic Assessment** (`lib/data/diagnostic-assessment.ts`)
  - 10 questions per skill covering beginner to fluent concepts
  - Shona language focus with cultural expressions
- **Assessment UI Component** (`components/diagnostic-assessment.tsx`)
  - Multi-step wizard interface
  - Skill-by-skill navigation
  - Progress tracking and skip functionality
- **Assessment Results View** (`components/diagnostic-results.tsx`)
  - Overall proficiency display
  - Individual skill breakdown with strongest/weakest badges
  - AI tutor personalization preview
- **Assessment Submission API** (`app/api/assessments/submit-diagnostic/route.ts`)
  - Auto-scoring and level calculation
  - Updates user_skills table for AI adaptation
- **Skills Dashboard** (`app/app/skills/page.tsx`)
  - Visual progress tracking across all skills
  - Overall statistics (practice time, phrases mastered, streak)
  - Action buttons for AI Tutor and Phrases

#### Database Migrations
- **Skills Taxonomy** (028): 5 core skills, 25 skill levels
- **Assessment System** (029): assessments, user_assessments tables with auto-update triggers
- **Phrases Integration** (030): Skills mapping for phrases
- **Complete Database Rebuild** (000_v2): Single comprehensive migration script

#### New Components
- `components/ui/radio-group.tsx` - Radix radio group for assessments
- `components/ui/skeleton.tsx` - Loading skeleton component

#### Navigation Updates
- Skills Dashboard added to sidebar navigation
- Target icon for skills route

### Changed

#### AI Integration
- AI chat API now uses `buildSkillsAwarePrompt()` instead of legacy `buildAISystemPrompt()`
- AI adapts vocabulary, grammar, scaffolding, and error correction based on user_skills table

#### Middleware
- Added onboarding check - new users redirected to diagnostic assessment
- Excludes diagnostic page and API routes from redirect

#### Documentation
- Updated CLAUDE.md with AI-first architecture documentation
- Added skills system, adaptive teaching levels, and utility functions

### Technical Details

- **Database Schema**: 14 tables with 40+ RLS policies
- **Skills System**: user_skills table read by AI for every interaction
- **Auto-Updates**: Triggers automatically update proficiency from assessments
- **Type Safety**: Comprehensive TypeScript types in `lib/types/skills.ts`

### Migration Notes

**Database**: Apply `000_complete_database_rebuild_v2.sql` via Supabase Dashboard SQL Editor

**New User Flow**:
1. Sign up → Login → Redirected to `/app/diagnostic`
2. Complete 50-question assessment (~15 minutes)
3. View results with skill breakdown
4. Start learning with personalized AI tutor

---

## [2.0.0] - 2025-11-10

### Major Release - Layout Standardization & Navigation Unification

This release represents a complete overhaul of the application's layout system and navigation architecture, providing a unified, responsive experience across all pages.

### Added

#### Layout System
- **SidebarLayout Component** - New responsive layout wrapper that automatically adjusts content margin based on sidebar collapse state
- **AdminLayout Component** - Centralized layout for all admin pages with consistent spacing and max-width constraints
- **Centered Layout Pattern** - All authenticated pages now use centered content with appropriate max-width constraints:
  - Forms/Reading: `max-w-4xl` (896px)
  - Interactive Content: `max-w-5xl` (1024px)
  - Data/Dashboards: `max-w-6xl` (1152px)

#### Navigation
- **Unified AppSidebar** - All authenticated pages now use AppSidebar for consistent navigation
- **Collapsible Sidebar** - Desktop users can collapse sidebar to icon-only mode (256px → 64px)
- **Responsive Sidebar** - Mobile users get overlay sidebar with hamburger menu
- **Theme Switcher in Sidebar** - Light/Dark/System theme control accessible everywhere
- **Language Switcher in Sidebar** - 4-language UI switcher (English, Shona, Ndebele, Chinese)

#### Hooks
- **useUILanguage()** - Centralized UI language state management with localStorage persistence
- **useSidebar()** - Global sidebar collapse state management

#### Documentation
- **DEPLOYMENT.md** - Comprehensive deployment guide with Vercel and Supabase instructions
- **SECURITY.md** - Complete security documentation covering all security layers
- **CHANGELOG.md** - This file for tracking version history
- **RELEASES.md** - Release management guidelines

### Changed

#### Page Updates
- **All App Pages** migrated from AppHeader to AppSidebar:
  - `/app/analytics` - Updated to use SidebarLayout with centered max-w-6xl
  - `/app/profile` - Updated to use SidebarLayout with centered max-w-4xl
  - `/app/ai-practice` - Updated to use SidebarLayout with centered max-w-5xl
  - `/app/progress` - Updated to use SidebarLayout with centered max-w-6xl
  - `/app/bookmarks` - Updated to use SidebarLayout with centered max-w-6xl

- **All Admin Pages** now use AdminLayout with consistent max-w-6xl:
  - `/admin/overview`
  - `/admin/users`
  - `/admin/phrases`
  - `/admin/standards`
  - `/admin/moderation`
  - `/admin/activity`

#### Component Refactoring
- **Removed conditional sidebar rendering** - Sidebar now always present on authenticated pages
- **Removed local language state** - All components now use `useUILanguage()` hook
- **Unified margin handling** - All pages use `SidebarLayout` instead of hardcoded `lg:ml-64`

#### User Experience
- **Consistent Navigation** - Same navigation pattern across all authenticated pages
- **Persistent Settings** - Theme and language preferences saved to localStorage
- **Smooth Transitions** - 300ms animations for sidebar collapse/expand
- **Mobile Optimization** - Improved mobile navigation with overlay sidebar

### Fixed
- **Sidebar Overlap Issues** - Content no longer overlaps with sidebar on any page
- **Language State Persistence** - UI language now persists across page navigation and refresh
- **Theme Accessibility** - Theme controls now accessible on all authenticated pages
- **Responsive Layout Issues** - Fixed content stretching on ultrawide monitors
- **Navigation Inconsistency** - All pages now have identical navigation patterns

### Documentation
- **Layout Migration Guides**:
  - SIDEBAR_LAYOUT_MIGRATION_COMPLETE.md - SidebarLayout implementation details
  - UNIFIED_LAYOUT_COMPLETE.md - Bookmarks and Progress page updates
  - APP_HEADER_TO_SIDEBAR_MIGRATION.md - AppHeader to AppSidebar migration
  - THEME_AND_LANGUAGE_CONTROLS_ADDED.md - Theme/language control integration
  - CENTERED_LAYOUT_APPLIED.md - Admin layout centering implementation

### Technical Details
- **Component Architecture**: Migrated from prop-based to context-based state management
- **Code Reduction**: Removed ~200 lines of duplicate code across components
- **Performance**: Improved re-render efficiency with centralized state
- **Accessibility**: Maintained WCAG 2.1 AA compliance throughout refactoring

---

## [1.5.0] - 2025-11-09

### Added - Brand Implementation & Database Improvements

#### Branding
- **Brand Logo** implementation across the application
- **Warm Purple** theme color (`#5f5873`) for light mode
- **Ubuntu Blue** theme color (`#7c73e6`) for dark mode
- **Brand Guidelines** documented in BRANDING.md

#### Database
- **Critical Fixes Migration (027)** applied:
  - Fixed column reference errors in RLS policies
  - Improved admin check functions
  - Enhanced activity summary function
  - Added proper error handling

#### Features
- **HelpScout Beacon** integration for customer support
- **Route-based Admin Navigation** - Converted admin to use dedicated routes
- **Collapsible Sidebar** - Added collapse/expand functionality

### Fixed
- **Hydration Errors** - Fixed theme switcher and conditional rendering issues
- **Mobile Usability** - Improved responsive design across all pages
- **Admin Navigation** - Integrated admin sections into AppSidebar

### Documentation
- BRAND_IMPLEMENTATION_COMPLETE.md
- MIGRATION_027_APPLIED.md
- HYDRATION_AND_RESPONSIVE_FIXES.md

---

## [1.4.0] - 2025-11-08

### Added - Learning Standards & Performance

#### Learning Standards
- **Learning Standards Management** - Admin UI for proficiency level definitions
- **AI-Guided Learning** - Standards inform AI teaching approach
- **Database Table**: `learning_standards` with 5 levels (beginner → fluent)

#### Performance Optimizations
- **Database Indexes** (Migration 025):
  - Indexes on frequently queried columns
  - Improved query performance by 50-70%
  - Optimized user lookup, phrase search, bookmark access

- **Table Partitioning** (Migration 026):
  - Partitioned `ai_messages` by date for better performance
  - User status tracking (active/suspended/deleted)
  - Prepared for scale (100k+ users)

#### Database Functions
- **Standardized Admin Checks** across all RLS policies
- **Activity Summary Function** for admin dashboard analytics
- **Automatic Study Streak Updates** via database trigger

### Fixed
- **User ID Column References** - Fixed inconsistent column naming (016-020)
- **RLS Policy Enforcement** - Ensured all tables properly enforce policies
- **Function Cascade Issues** - Proper DROP CASCADE before recreating functions

---

## [1.3.0] - 2025-11-05

### Added - AI Features & Content Moderation

#### AI Integration
- **Anthropic Claude Haiku 4.5** integration via Vercel AI Gateway
- **AI Chat** - Streaming conversation with practice/scenario/translation_help modes
- **Scenario Generation** - AI-generated practice scenarios based on proficiency
- **Phrase Recommendations** - AI-powered phrase suggestions

#### Content Moderation
- **AI-Powered Moderation** - Automatic content screening using Claude Haiku 4.5
- **Moderation Categories**: sexual, hate, harassment, violence, self-harm, abuse
- **Admin Moderation Queue** - Review flagged content at `/admin/moderation`
- **Moderation Alerts Table** - Database storage for flagged content

#### Database Tables
- `ai_conversations` - User AI chat sessions
- `ai_messages` - Individual chat messages
- `moderation_alerts` - Flagged content for review

### Changed
- **All AI Endpoints** now include moderation checks before processing
- **User Messages** automatically scanned before AI response generation

---

## [1.2.0] - 2025-11-01

### Added - Study Progress & Analytics

#### Progress Tracking
- **Phrase Progress** - Track learning status (learning/practiced/mastered)
- **Study Sessions** - Daily study session tracking
- **Study Streaks** - Consecutive day tracking with automatic updates
- **Database Tables**: `phrase_progress`, `study_sessions`

#### Analytics
- **User Analytics Dashboard** at `/app/analytics`
- **Admin Overview Dashboard** at `/admin/overview`
- **Activity Monitoring** at `/admin/activity`
- **Statistics**:
  - Total users, active users, new signups
  - Phrase views, bookmarks, progress
  - Study session analytics
  - AI conversation metrics

#### Admin Features
- **User Management** - View, edit roles, suspend/activate users
- **Activity Logs** - Monitor user actions and system events
- **Database Function**: `get_user_activity_summary()`

---

## [1.1.0] - 2025-10-28

### Added - Core Learning Features

#### Phrase Learning
- **200+ Phrases** in 4 languages (English, Shona, Ndebele, Chinese)
- **Categories**: Greetings, Travel, Business, Food, Emergency, Daily, Cultural
- **Phrase Details**: Translation, pronunciation guide, context, category
- **Search & Filter** functionality

#### User Features
- **Bookmarks** - Save favorite phrases for quick access
- **User Profiles** - Customizable user profiles with preferences
- **Profile Settings** at `/app/profile`
- **Database Tables**: `bookmarks`, `profiles`

#### User Experience
- **Responsive Design** - Mobile, tablet, and desktop optimized
- **Dark Mode** - Theme switching between light/dark/system
- **Internationalization** - UI in 4 languages

---

## [1.0.0] - 2025-10-25

### Initial Release - Foundation

#### Core Framework
- **Next.js 16** - React Server Components, App Router
- **React 19.2** - Latest React with server components
- **TypeScript** - Full type safety
- **Tailwind CSS 4.1** - Utility-first styling

#### Authentication
- **Supabase Auth** - Email/password authentication
- **Session Management** - HTTP-only cookies with auto-refresh
- **Dev Mode** - Development authentication bypass
- **Middleware Protection** - Route-based access control

#### Database
- **Supabase PostgreSQL** - Hosted database
- **Row Level Security** - User data isolation
- **Database Schema**: Initial tables (phrases, profiles)
- **Migration System** - SQL-based migrations in `/scripts/`

#### Infrastructure
- **Vercel Hosting** - Edge network deployment
- **Vercel Analytics** - Built-in analytics
- **Environment Configuration** - Secure environment variable management

#### UI Components
- **shadcn/ui** - Radix UI component library
- **Component Library**: Button, Card, Dialog, Input, Select, etc.
- **Design System** - Consistent styling and spacing

#### Pages
- **Landing Page** (`/`) - Public marketing page
- **Auth Pages** - Login, signup, callback
- **App Pages** - Profile, progress, bookmarks (initial versions)
- **Admin Pages** - User management, phrase management (initial versions)

#### Documentation
- **README.md** - Project overview and setup
- **CLAUDE.md** - Development guidelines
- **DEV_MODE.md** - Development mode documentation

---

## Version History Summary

| Version | Date | Focus |
|---------|------|-------|
| **2.0.0** | 2025-11-10 | Layout Standardization & Navigation Unification |
| **1.5.0** | 2025-11-09 | Brand Implementation & Database Improvements |
| **1.4.0** | 2025-11-08 | Learning Standards & Performance |
| **1.3.0** | 2025-11-05 | AI Features & Content Moderation |
| **1.2.0** | 2025-11-01 | Study Progress & Analytics |
| **1.1.0** | 2025-10-28 | Core Learning Features |
| **1.0.0** | 2025-10-25 | Initial Release - Foundation |

---

## Migration History

| Migration | Description |
|-----------|-------------|
| 001-002 | Initial phrases table and seed data |
| 003-004 | Profiles and preferences |
| 005-007 | Bookmarks and favorites |
| 008-009 | Progress tracking |
| 010-011 | AI conversations and moderation |
| 012-015 | AI features and learning standards |
| 016-020 | User ID column fixes |
| 021 | Phrase categories |
| 022-024 | Learning standards (final version) |
| 025 | Performance indexes |
| 026 | User status and partitioning |
| 027 | Critical fixes |

---

## Upgrade Notes

### Upgrading from 1.x to 2.0

**Breaking Changes**: None - all changes are additive and maintain backward compatibility.

**New Dependencies**:
- No new npm packages required
- All changes use existing dependencies

**Database Changes**: None required - all database work completed in 1.x series.

**Configuration Changes**:
- No environment variable changes needed
- Theme and language now stored in localStorage (automatic)

**Component Updates**:
- All app pages automatically use new layout system
- No manual migration needed for existing code
- Old patterns still work but deprecated

**What You Get**:
- ✅ Unified navigation across all pages
- ✅ Theme switcher in sidebar
- ✅ Language switcher in sidebar
- ✅ Collapsible sidebar (desktop)
- ✅ Responsive overlay sidebar (mobile)
- ✅ Centered content layouts
- ✅ Persistent user preferences

---

## Contributing

See [RELEASES.md](RELEASES.md) for guidelines on contributing to releases.

---

## Links

- **Documentation**: [CLAUDE.md](CLAUDE.md)
- **Deployment**: [DEPLOYMENT.md](DEPLOYMENT.md)
- **Security**: [SECURITY.md](SECURITY.md)
- **Releases**: [RELEASES.md](RELEASES.md)
- **Repository**: [GitHub](https://github.com/yourusername/nyuchi-lingo)

---

**Maintained by**: Claude Code
**Last updated**: November 10, 2025
