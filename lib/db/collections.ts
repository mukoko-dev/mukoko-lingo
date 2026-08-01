/**
 * Typed per-collection accessors.
 * Route files call e.g. `const col = await phrases()` instead of the old
 * `supabase.from('phrase')`. No ODM — matches the raw-driver style already
 * used by the Python analytics side (api/analytics/_helpers.py).
 */

import { getDb } from './mongo'
import type {
  Person,
  LingoProfile,
  Phrase,
  PhraseProgress,
  Bookmark,
  PhraseView,
  PhraseEngagement,
  Skill,
  UserSkill,
  Assessment,
  UserAssessment,
  LearningStandard,
  ModerationAlert,
  ShamwariConversation,
  ShamwariMessage,
  SrsCard,
  UserXp,
  XpEvent,
  Class,
  ClassMembership,
  Assignment,
  AssignmentSubmission,
  OrganizationEnrollment,
  StudySession,
  SharedGuardrail,
  PlatformApiKey,
  UbuntuContribution,
} from './types'

/** identity.persons — shared ecosystem user record, not Lingo-owned. */
export const persons = async () => (await getDb('identity')).collection<Person>('persons')
/** Lingo-local extension of a person (role, learning prefs, push tokens). */
export const lingoProfiles = async () => (await getDb()).collection<LingoProfile>('learner_profiles')
export const phrases = async () => (await getDb()).collection<Phrase>('phrases')
export const phraseProgress = async () => (await getDb()).collection<PhraseProgress>('phrase_progress')
export const bookmarks = async () => (await getDb()).collection<Bookmark>('bookmarks')
export const phraseViews = async () => (await getDb()).collection<PhraseView>('phrase_views')
/**
 * Read-only view aggregating bookmarks/phrase_views by phrase_id — live,
 * not stored. Never write through this accessor. See Phase 4 of
 * docs/ECOSYSTEM_DATA_MIGRATION.md.
 */
export const phraseEngagementLive = async () =>
  (await getDb()).collection<PhraseEngagement>('phraseEngagementLive')
export const skills = async () => (await getDb()).collection<Skill>('skills')
export const userSkills = async () => (await getDb()).collection<UserSkill>('user_skills')
export const assessments = async () => (await getDb()).collection<Assessment>('assessments')
export const userAssessments = async () => (await getDb()).collection<UserAssessment>('user_assessments')
export const learningStandards = async () => (await getDb()).collection<LearningStandard>('learning_standards')
export const moderationAlerts = async () => (await getDb()).collection<ModerationAlert>('moderation_alerts')
/** shamwari.conversations — shared ecosystem AI conversation store, not Lingo-owned. */
export const shamwariConversations = async () => (await getDb('shamwari')).collection<ShamwariConversation>('conversations')
/** shamwari.messages — shared ecosystem AI message store, not Lingo-owned. */
export const shamwariMessages = async () => (await getDb('shamwari')).collection<ShamwariMessage>('messages')
export const srsCards = async () => (await getDb()).collection<SrsCard>('srs_cards')
export const userXp = async () => (await getDb()).collection<UserXp>('user_xp')
export const xpEvents = async () => (await getDb()).collection<XpEvent>('xp_events')
export const classes = async () => (await getDb()).collection<Class>('classes')
export const classMemberships = async () => (await getDb()).collection<ClassMembership>('class_memberships')
export const assignments = async () => (await getDb()).collection<Assignment>('assignments')
export const assignmentSubmissions = async () => (await getDb()).collection<AssignmentSubmission>('assignment_submissions')
export const organizationEnrollments = async () => (await getDb()).collection<OrganizationEnrollment>('organization_enrollments')
export const studySessions = async () => (await getDb()).collection<StudySession>('study_sessions')
/** shamwari.guardrails — shared ecosystem moderation policy, not Lingo-owned. */
export const sharedGuardrails = async () => (await getDb('shamwari')).collection<SharedGuardrail>('guardrails')
/** platform.apiKeys — shared ecosystem API-key registry, not Lingo-owned. */
export const platformApiKeys = async () => (await getDb('platform')).collection<PlatformApiKey>('apiKeys')
/** ubuntu.contributions — shared ecosystem trust/gamification ledger, not Lingo-owned. */
export const ubuntuContributions = async () => (await getDb('ubuntu')).collection<UbuntuContribution>('contributions')

export { getDb }
