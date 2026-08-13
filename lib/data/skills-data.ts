/**
 * The five core proficiency skills.
 *
 * This is the source of truth for `lingo.skills`, seeded via
 * `scripts/seed-skills.ts`. The collection has been empty since the
 * MongoDB migration, so `/api/skills` returned `[]` and nothing could hang
 * a proficiency off a real skill row.
 *
 * `_id`s are stable UUID strings, matching the id convention every other
 * `lingo` collection uses (phrases, scenarios, learningStandards) — never
 * ObjectIds. Re-seeding is therefore idempotent by `_id`.
 *
 * Level thresholds mirror `scoreToLevel()` in lib/ai/skills-aware-prompts.ts
 * exactly; the two must not drift, or the AI tutor and the skills API will
 * disagree about what level a score means.
 */

import type { ProficiencyLevel, SkillName } from '../types/skills'

/** UI language tags used across the app (see lib/data/translations.ts). */
export type SkillTextByLanguage = {
  en: string
  sn: string
  nd: string
  sw: string
  zh: string
}

export interface SeedSkillLevel {
  level: ProficiencyLevel
  name: string
  min_score: number
  sort_order: number
}

/**
 * Two axes live in this collection, told apart by `kind`:
 *
 * - `linguistic` — the five core abilities. These are what the AI tutor
 *   scaffolds against (see skills-aware-prompts.ts) and their names are
 *   the `SkillName` union.
 * - `domain` — what a learner is actually trying to do, derived from the
 *   real `lingo.scenarios` and phrase categories. These carry the content
 *   links (`scenario_ids`, `categories`) and are never used for tutor
 *   scaffolding.
 */
export type SkillKind = 'linguistic' | 'domain'

export interface SeedSkill {
  _id: string
  name: string
  kind: SkillKind
  display_name: SkillTextByLanguage
  description: SkillTextByLanguage
  icon: string
  sort_order: number
  is_active: boolean
  levels: SeedSkillLevel[]
  /** `lingo.scenarios._id` values this skill covers. Domain skills only. */
  scenario_ids?: string[]
  /** `lingo.phrases.category` values this skill draws from. Domain skills only. */
  categories?: string[]
}

/** Narrowed alias for the five core abilities, whose names are typed. */
export interface SeedLinguisticSkill extends SeedSkill {
  name: SkillName
  kind: 'linguistic'
}

/**
 * Shared across all five skills — the ladder is a property of proficiency,
 * not of the individual skill. Thresholds are the inclusive lower bound of
 * each band: 0-49, 50-64, 65-79, 80-89, 90-100.
 */
export const SKILL_LEVELS: SeedSkillLevel[] = [
  { level: 'beginner', name: 'Beginner', min_score: 0, sort_order: 1 },
  { level: 'elementary', name: 'Elementary', min_score: 50, sort_order: 2 },
  { level: 'intermediate', name: 'Intermediate', min_score: 65, sort_order: 3 },
  { level: 'advanced', name: 'Advanced', min_score: 80, sort_order: 4 },
  { level: 'fluent', name: 'Fluent', min_score: 90, sort_order: 5 },
]

export const linguisticSkills: SeedLinguisticSkill[] = [
  {
    _id: '01977100-0f30-7000-8000-000000000001',
    name: 'pronunciation',
    kind: 'linguistic',
    display_name: {
      en: 'Pronunciation',
      sn: 'Madudziro',
      nd: 'Ukubiza',
      sw: 'Matamshi',
      zh: '发音',
    },
    description: {
      en: 'Sound production, tone, and rhythm.',
      sn: 'Kududzira mazwi, mataurirwo nemagwaro.',
      nd: 'Ukukhuluma amagama ngendlela efaneleyo lokugcizelela.',
      sw: 'Utamkaji wa sauti, toni na mdundo.',
      zh: '发音、声调与节奏。',
    },
    icon: '🗣️',
    sort_order: 1,
    is_active: true,
    levels: SKILL_LEVELS,
  },
  {
    _id: '01977100-0f30-7000-8000-000000000002',
    name: 'vocabulary',
    kind: 'linguistic',
    display_name: {
      en: 'Vocabulary',
      sn: 'Mazwi',
      nd: 'Amagama',
      sw: 'Msamiati',
      zh: '词汇',
    },
    description: {
      en: 'Word knowledge and using words in context.',
      sn: 'Kuziva mazwi nekushandisa mazwi nenzvimbo yawo.',
      nd: 'Ukwazi amagama lokuwasebenzisa ngendlela efaneleyo.',
      sw: 'Kujua maneno na kuyatumia kulingana na muktadha.',
      zh: '词语知识与在语境中的运用。',
    },
    icon: '📚',
    sort_order: 2,
    is_active: true,
    levels: SKILL_LEVELS,
  },
  {
    _id: '01977100-0f30-7000-8000-000000000003',
    name: 'grammar',
    kind: 'linguistic',
    display_name: {
      en: 'Grammar',
      sn: 'Girama',
      nd: 'Uhlelo lolimi',
      sw: 'Sarufi',
      zh: '语法',
    },
    description: {
      en: 'Sentence structure, verb forms, and particles.',
      sn: 'Kuvakwa kwemitsara, zviito nezvimwe zvikamu zvemutauro.',
      nd: 'Ukwakhiwa kwemitsho lezenzo zolimi.',
      sw: 'Muundo wa sentensi, vitenzi na viambishi.',
      zh: '句子结构、动词形式与助词。',
    },
    icon: '📐',
    sort_order: 3,
    is_active: true,
    levels: SKILL_LEVELS,
  },
  {
    _id: '01977100-0f30-7000-8000-000000000004',
    name: 'comprehension',
    kind: 'linguistic',
    display_name: {
      en: 'Comprehension',
      sn: 'Kunzwisisa',
      nd: 'Ukuzwisisa',
      sw: 'Ufahamu',
      zh: '理解',
    },
    description: {
      en: 'Understanding what you hear and read.',
      sn: 'Kunzwisisa zvaunonzwa nezvaunoverenga.',
      nd: 'Ukuzwisisa lokho okuzwayo lokubalayo.',
      sw: 'Kuelewa unachosikia na unachosoma.',
      zh: '听力与阅读理解。',
    },
    icon: '👂',
    sort_order: 4,
    is_active: true,
    levels: SKILL_LEVELS,
  },
  {
    _id: '01977100-0f30-7000-8000-000000000005',
    name: 'conversation',
    kind: 'linguistic',
    display_name: {
      en: 'Conversation',
      sn: 'Nhaurirano',
      nd: 'Ingxoxo',
      sw: 'Mazungumzo',
      zh: '会话',
    },
    description: {
      en: 'Real-time dialogue and cultural context.',
      sn: 'Kutaurirana nevanhu uye tsika dzemutauro.',
      nd: 'Ukuxoxa labantu lokwazi amasiko olimi.',
      sw: 'Mazungumzo ya papo kwa papo na muktadha wa kitamaduni.',
      zh: '实时对话与文化语境。',
    },
    icon: '💬',
    sort_order: 5,
    is_active: true,
    levels: SKILL_LEVELS,
  },
]

/**
 * Domain skills — what a learner is actually trying to do.
 *
 * Every entry is grounded in real content: `scenario_ids` reference live
 * `lingo.scenarios` documents and `categories` reference real
 * `lingo.phrases.category` values. Between them the eight below cover all
 * 10 scenarios and all 13 categories, with no category left unclaimed.
 *
 * `sort_order` continues from the linguistic skills so the two axes never
 * collide when the catalogue is listed as one set.
 */
export const domainSkills: SeedSkill[] = [
  {
    _id: '01977100-0f31-7000-8000-000000000001',
    name: 'travel_arrival',
    kind: 'domain',
    display_name: {
      en: 'Arrival & Immigration',
      sn: 'Kusvika Munyika',
      nd: 'Ukufika Elizweni',
      sw: 'Kuwasili na Uhamiaji',
      zh: '入境与通关',
    },
    description: {
      en: 'Presenting documents and answering an immigration officer.',
      sn: 'Kuratidza magwaro nekupindura mibvunzo pakupinda munyika.',
      nd: 'Ukutshengisa amaphepha lokuphendula imibuzo yokungena elizweni.',
      sw: 'Kuonyesha hati na kujibu maswali ya uhamiaji.',
      zh: '出示证件并回答入境官员的提问。',
    },
    icon: '🛂',
    sort_order: 6,
    is_active: true,
    levels: SKILL_LEVELS,
    scenario_ids: ['01977100-0f02-7000-8000-000000000001'],
    categories: ['tourism'],
  },
  {
    _id: '01977100-0f31-7000-8000-000000000002',
    name: 'getting_around',
    kind: 'domain',
    display_name: {
      en: 'Getting Around',
      sn: 'Kufamba',
      nd: 'Ukuhamba',
      sw: 'Kusafiri Mjini',
      zh: '出行交通',
    },
    description: {
      en: 'Directions, fares and telling a driver where you are going.',
      sn: 'Nzira, mari yebhasi nekuudza mutyairi kwaunoenda.',
      nd: 'Indlela, imali yesithuthi lokutshela umtshayeli lapho oya khona.',
      sw: 'Maelekezo, nauli na kumwambia dereva unakoenda.',
      zh: '问路、车费与告诉司机目的地。',
    },
    icon: '🚕',
    sort_order: 7,
    is_active: true,
    levels: SKILL_LEVELS,
    scenario_ids: ['01977100-0f02-7000-8000-000000000002'],
    categories: ['transport'],
  },
  {
    _id: '01977100-0f31-7000-8000-000000000003',
    name: 'accommodation',
    kind: 'domain',
    display_name: {
      en: 'Accommodation',
      sn: 'Pekugara',
      nd: 'Indawo Yokuhlala',
      sw: 'Malazi',
      zh: '住宿',
    },
    description: {
      en: 'Checking in, asking about facilities and reporting a problem.',
      sn: 'Kunyoresa, kubvunza nezvezvinhu zviripo nekutaura dambudziko.',
      nd: 'Ukubhalisa, ukubuza ngezinto ezikhona lokubika inkinga.',
      sw: 'Kujisajili, kuuliza kuhusu huduma na kuripoti tatizo.',
      zh: '办理入住、询问设施与反映问题。',
    },
    icon: '🛏️',
    sort_order: 8,
    is_active: true,
    levels: SKILL_LEVELS,
    scenario_ids: ['01977100-0f02-7000-8000-000000000003'],
    categories: ['tourism'],
  },
  {
    _id: '01977100-0f31-7000-8000-000000000004',
    name: 'food_dining',
    kind: 'domain',
    display_name: {
      en: 'Food & Dining',
      sn: 'Chikafu Nekudya',
      nd: 'Ukudla',
      sw: 'Chakula na Mikahawa',
      zh: '餐饮',
    },
    description: {
      en: 'Ordering food, asking what a dish is and settling the bill.',
      sn: 'Kuraira chikafu, kubvunza kuti chikafu chii nekubhadhara.',
      nd: 'Ukuodola ukudla, ukubuza ukuthi kuyini lokubhadala.',
      sw: 'Kuagiza chakula, kuuliza kuhusu mlo na kulipa bili.',
      zh: '点餐、询问菜品与结账。',
    },
    icon: '🍽️',
    sort_order: 9,
    is_active: true,
    levels: SKILL_LEVELS,
    scenario_ids: ['01977100-0f02-7000-8000-000000000004', '01977100-0f02-7000-8000-00000000000a'],
    categories: ['food'],
  },
  {
    _id: '01977100-0f31-7000-8000-000000000005',
    name: 'money_bargaining',
    kind: 'domain',
    display_name: {
      en: 'Money & Bargaining',
      sn: 'Mari Nemitengo',
      nd: 'Imali Lokuthengiselana',
      sw: 'Pesa na Kupatana Bei',
      zh: '金钱与议价',
    },
    description: {
      en: 'Asking prices, negotiating politely and paying by mobile money.',
      sn: 'Kubvunza mitengo, kutenderana nekubhadhara nefoni.',
      nd: 'Ukubuza intengo, ukuthengiselana lokubhadala ngefoni.',
      sw: 'Kuuliza bei, kupatana kwa heshima na kulipa kwa simu.',
      zh: '询价、礼貌议价与手机支付。',
    },
    icon: '💰',
    sort_order: 10,
    is_active: true,
    levels: SKILL_LEVELS,
    scenario_ids: ['01977100-0f02-7000-8000-000000000005', '01977100-0f02-7000-8000-000000000007'],
    categories: ['money', 'shopping'],
  },
  {
    _id: '01977100-0f31-7000-8000-000000000006',
    name: 'health_emergencies',
    kind: 'domain',
    display_name: {
      en: 'Health & Emergencies',
      sn: 'Utano Nenjodzi',
      nd: 'Impilo Lezimo Eziphuthumayo',
      sw: 'Afya na Dharura',
      zh: '健康与急救',
    },
    description: {
      en: 'Describing symptoms, asking for help and following urgent instructions.',
      sn: 'Kutsanangura kurwara, kukumbira rubatsiro nekuteerera mirairo.',
      nd: 'Ukuchaza ukugula, ukucela usizo lokulandela iziqondiso.',
      sw: 'Kueleza dalili, kuomba msaada na kufuata maagizo ya haraka.',
      zh: '描述症状、求助与遵循紧急指示。',
    },
    icon: '🏥',
    sort_order: 11,
    is_active: true,
    levels: SKILL_LEVELS,
    scenario_ids: ['01977100-0f02-7000-8000-000000000006'],
    categories: ['health'],
  },
  {
    _id: '01977100-0f31-7000-8000-000000000007',
    name: 'business_professional',
    kind: 'domain',
    display_name: {
      en: 'Business & Professional',
      sn: 'Bhizinesi Nebasa',
      nd: 'Ibhizimusi Lomsebenzi',
      sw: 'Biashara na Kazi',
      zh: '商务与职场',
    },
    description: {
      en: 'Introductions, stating a position and confirming next steps.',
      sn: 'Kuzvizivisa, kutaura pfungwa yako nekusimbisa zvinotevera.',
      nd: 'Ukuzethula, ukuveza umbono lokuqinisa okulandelayo.',
      sw: 'Kujitambulisha, kutoa msimamo na kuthibitisha hatua zijazo.',
      zh: '自我介绍、表达立场与确认后续。',
    },
    icon: '💼',
    sort_order: 12,
    is_active: true,
    levels: SKILL_LEVELS,
    scenario_ids: ['01977100-0f02-7000-8000-000000000008', '01977100-0f02-7000-8000-000000000009'],
    categories: ['business', 'work'],
  },
  {
    _id: '01977100-0f31-7000-8000-000000000008',
    name: 'everyday_social',
    kind: 'domain',
    display_name: {
      en: 'Everyday Social',
      sn: 'Hukama Hwezuva Nezuva',
      nd: 'Ukuxhumana Kwansuku Zonke',
      sw: 'Mawasiliano ya Kila Siku',
      zh: '日常社交',
    },
    description: {
      en: 'Greetings, family, feelings and everyday small talk.',
      sn: 'Kukwazisana, mhuri, manzwiro nehurukuro dzezuva nezuva.',
      nd: 'Ukubingelelana, umuli, imizwa lengxoxo zansuku zonke.',
      sw: 'Salamu, familia, hisia na mazungumzo ya kila siku.',
      zh: '问候、家庭、情感与日常寒暄。',
    },
    icon: '🤝',
    sort_order: 13,
    is_active: true,
    levels: SKILL_LEVELS,
    categories: ['greetings', 'family', 'emotions', 'school', 'weather'],
  },
]

/** The full catalogue seeded into `lingo.skills`. */
export const skills: SeedSkill[] = [...linguisticSkills, ...domainSkills]
