# Mukoko Lingo — Layered Architecture

**Registry Standard**: 5-Layer Component Hierarchy (mandatory across all Mukoko apps)

## The 5 Layers

Components import from the layer directly below — never sideways or upward.

| Layer | Mobile (Expo/RN) | Web (Next.js) | Purpose |
|-------|------------------|---------------|---------|
| **L1 — Primitives** | `components/ui/` | `web/components/ui/` | Foundation: Button, Input, Card, Text |
| **L2 — Domain** | `components/lingo/` | `web/components/lingo/` | Feature-specific: PhraseCard, SkillBadge, LessonProgress |
| **L3 — Orchestrators** | `components/screens/` | `web/components/pages/` | Page sections: PhraseGrid, AssessmentFlow, ChatWindow |
| **L4 — Error Boundaries** | `components/RouteErrorBoundary.tsx` | `web/components/error-boundary.tsx` | Crash isolation per section |
| **L5 — Page Wrappers** | `app/(tabs)/*.tsx` | `web/app/*/page.tsx` | Data fetching, routing, SEO metadata |

## Import Rules

```
L5 (Pages) → imports from L3, L4
L4 (Error Boundaries) → imports from L1
L3 (Orchestrators) → imports from L1, L2
L2 (Domain) → imports from L1
L1 (Primitives) → imports nothing from app layers
```

**Never:** L2 → L3, L1 → L2, any layer → L5, sideways within same layer

## Directory Structure

### Mobile (`/`)
```
components/
├── ui/                  # L1: Primitives (shared, platform-agnostic)
│   └── Button.tsx
├── lingo/               # L2: Domain composites
│   └── PhraseCard.tsx
├── screens/             # L3: Page orchestrators (to be built)
├── RouteErrorBoundary.tsx    # L4
└── SectionErrorBoundary.tsx  # L4

app/(tabs)/              # L5: Page wrappers
├── index.tsx            # Learn screen
├── ai-practice.tsx      # Shamwari chat
├── insights.tsx         # Progress
└── profile.tsx          # Profile
```

### Web (`/web`)
```
web/components/
├── ui/                  # L1: Primitives (from registry.mukoko.com)
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   └── table.tsx
├── lingo/               # L2: Domain composites
│   ├── phrase-card.tsx
│   ├── skill-badge.tsx
│   └── stat-card.tsx
├── pages/               # L3: Page orchestrators
│   ├── phrase-grid.tsx
│   ├── moderation-queue.tsx
│   └── stats-dashboard.tsx
└── error-boundary.tsx   # L4

web/app/                 # L5: Page wrappers
├── learn/page.tsx
├── chat/page.tsx
├── admin/overview/page.tsx
└── admin/moderation/page.tsx
```

## Shared Layers (both platforms)

```
api/                     # Vercel serverless — shared backend
lib/                     # Shared business logic
├── ai/                  # AI service, moderation, skills prompts
├── db/                  # Supabase client, transform helpers
├── data/                # Hardcoded phrase seeds, assessment questions
├── hooks/               # Mobile-specific React hooks
├── services/            # API client (mobile)
├── storage/             # Local storage (mobile)
└── types/               # Shared TypeScript types
constants/               # Colors, theme tokens
```

## Data Layer Awareness

| Layer | Technology | What lives here |
|-------|-----------|-----------------|
| L2 | Supabase PostgreSQL | Metadata, FKs, state, RLS |
| L3 | ScyllaDB (future) | Content, streams |
| L7 | Doris (future) | Analytics, search, recommendations |

Supabase tables marked `TRANSITIONAL` currently hold content that will migrate to ScyllaDB.
Tables marked `DORIS DOMAIN` are read caches populated by the analytics pipeline.
