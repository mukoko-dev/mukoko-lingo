# Brand Guidelines — Mukoko Lingo

Mukoko Lingo is a Nyuchi Africa product. _Mukoko_ is a beehive; the app is a
hive of languages, and **Shamwari** ("friend" in Shona) is the AI tutor who
lives in it.

The single source of truth for colour is [`constants/Colors.ts`](constants/Colors.ts).
This document explains what the values mean and when to reach for each; if the
two ever disagree, the code is right and this file is stale.

## Voice

Shamwari is **warm, patient, encouraging, playful but professional** — a
supportive teacher, not a cheerleader and not a textbook. In practice:

- Encourage effort, not just correctness. A learner who got it wrong tried.
- Say the thing plainly. Clarity is a form of respect for someone learning in
  their second or third language.
- Occasional hive and friendship references are welcome; forced ones are not.
- Never mock a mistake, an accent, or a language.

Product copy follows the same voice, minus the first person. UI strings live in
`lib/data/translations.ts` and must exist in all four languages — English,
Shona, Ndebele and Chinese — before they ship.

## Five African Minerals

Four mineral colours plus a neutral ground. Each has a light-mode and a
dark-mode value; they are not interchangeable, and the dark value is not a
"lighter version" — it is the shade that holds contrast on charcoal.

| Mineral        | Role      | Light     | Dark      | Use for                                              |
| -------------- | --------- | --------- | --------- | ---------------------------------------------------- |
| **Cobalt**     | Primary   | `#0047AB` | `#00B0FF` | Primary CTAs, links, active tab, focus rings         |
| **Tanzanite**  | Secondary | `#4B0082` | `#B388FF` | Secondary actions, depth, gradient partner to cobalt |
| **Gold**       | Accent    | `#5D4037` | `#FFD740` | Achievement, streaks, XP, premium moments            |
| **Army Green** | Success   | `#729B63` | `#8FB47F` | Mastery, progress, correct answers                   |

### Ground and text

| Token                    | Light                  | Dark                 |
| ------------------------ | ---------------------- | -------------------- |
| Background               | `#FAF9F5` (warm cream) | `#0A0A0A` (charcoal) |
| Card                     | `#FFFFFF`              | `#141414`            |
| Surface (dim / elevated) | `#F3F2EE`              | `#1E1E1E`            |
| Text primary             | `#141413`              | `#F5F5F4`            |
| Text secondary           | `#52524E`              | `#A8A8A3`            |
| Text muted               | `#8C8B87`              | `#6B6B66`            |

The dark theme is **charcoal, never slate**. A blue-grey dark mode fights the
cobalt and reads as a different product.

### Semantic colours

`#729B63` success · `#F6AD55` warning · `#ef4444` error · `#3b82f6` info.

Use these for state, not for decoration. Success in particular does double duty
as the mastery colour — that overlap is deliberate.

## Using colour in code

```typescript
import { Colors, lightTheme, darkTheme } from '@/constants/Colors'
import { useTheme } from '@/lib/hooks/useTheme'

// Semantic — the normal case. Follows the user's theme.
const theme = useTheme().isDark ? darkTheme : lightTheme
<View style={{ backgroundColor: theme.background }}>
  <Text style={{ color: theme.text }}>Mhoro!</Text>
  <Pressable style={{ backgroundColor: theme.primary }} />
</View>

// A specific shade, when the design calls for one regardless of theme
<View style={{ backgroundColor: Colors.primary[600] }} />
```

**Never hard-code a hex in a component.** A literal `#0047AB` is invisible to
the theme switch and to anyone auditing contrast later. The palette scales
(`50`–`900`) exist so you do not have to invent a tint.

## Typography

System stack on every platform — no bundled webfont, because a language app
must render Shona, Ndebele and Chinese glyphs correctly before it renders them
fashionably.

| Role                | Size | Weight |
| ------------------- | ---- | ------ |
| Screen title        | 28   | 700    |
| Section heading     | 20   | 600    |
| Body                | 16   | 400    |
| Secondary / caption | 14   | 400    |
| Label / metadata    | 12   | 500    |

Phrase text in a learning language may go larger (up to 32) — it is the content,
not chrome. Pronunciation guides are secondary text, never the same weight as
the phrase itself.

## Layout and interaction

- **48px minimum touch target** on every interactive element. Non-negotiable:
  a mistap in a lesson costs a streak.
- **16px** default screen padding, **12px** between related elements,
  **24px** between sections.
- **16px** card radius, **12px** button radius.
- Motion is short and functional (150–250ms). Celebration animations are the
  one place to be exuberant — see `components/CelebrationCard.tsx`.

## Shamwari

- The mascot lives at `assets/images/icon.png` and doubles as the app icon.
- Shamwari is always named, never "the AI" or "the assistant", in UI copy.
- Shamwari never claims to be human, and never pretends to certainty about a
  learner's progress that the data does not support.

## Applying the brand elsewhere

- **Email** — [docs/EMAIL_TEMPLATES.md](docs/EMAIL_TEMPLATES.md). Templates are
  configured in the WorkOS AuthKit dashboard; the palette above is what they
  use.
- **Web app** — the Tailwind config in `web/tailwind.config.ts` carries the same
  values. Change both or neither.
- **Parent brand** — Nyuchi Africa, [nyuchi.com](https://nyuchi.com). Mukoko
  Lingo's footer credits it; the product does not borrow its palette.

## Don't

- Don't introduce a fifth brand colour. Four minerals plus neutrals is the
  system; a new hue means a design conversation, not a commit.
- Don't use gold for errors or red for anything celebratory.
- Don't put cobalt text on tanzanite, or any pairing you have not checked for
  contrast. Target WCAG AA (4.5:1 body, 3:1 large text).
- Don't ship a colour that only exists in one theme.
