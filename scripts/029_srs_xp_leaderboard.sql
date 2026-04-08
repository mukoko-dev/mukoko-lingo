-- ============================================================================
-- Migration 029: SRS, XP, and Leaderboard tables
-- Adds spaced repetition tracking, XP gamification, and weekly leaderboard
-- ============================================================================

-- SRS Card: Tracks spaced repetition state per user per phrase
CREATE TABLE IF NOT EXISTS lingo.srs_card (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES identity.person(id) ON DELETE CASCADE,
  phrase_id UUID NOT NULL REFERENCES lingo.phrase(id) ON DELETE CASCADE,
  easiness_factor NUMERIC(4,2) NOT NULL DEFAULT 2.5,
  interval_days INTEGER NOT NULL DEFAULT 0,
  repetition_count INTEGER NOT NULL DEFAULT 0,
  next_review_date DATE NOT NULL DEFAULT CURRENT_DATE,
  last_review_date DATE,
  last_quality INTEGER DEFAULT 0 CHECK (last_quality >= 0 AND last_quality <= 5),
  total_reviews INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, phrase_id)
);

CREATE INDEX IF NOT EXISTS idx_srs_card_user_next
  ON lingo.srs_card(user_id, next_review_date);
CREATE INDEX IF NOT EXISTS idx_srs_card_user_updated
  ON lingo.srs_card(user_id, updated_at);

-- User XP: Aggregate XP state per user
CREATE TABLE IF NOT EXISTS lingo.user_xp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES identity.person(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  daily_goal_xp INTEGER NOT NULL DEFAULT 50,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- XP Event Log: Individual XP award events for history and analytics
CREATE TABLE IF NOT EXISTS lingo.xp_event (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES identity.person(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN (
    'phrase_learned', 'quiz_correct', 'quiz_perfect', 'srs_review',
    'ai_chat', 'assessment_completed', 'assessment_passed',
    'daily_goal_bonus', 'streak_milestone'
  )),
  amount INTEGER NOT NULL DEFAULT 0,
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_event_user_date
  ON lingo.xp_event(user_id, event_date);
CREATE INDEX IF NOT EXISTS idx_xp_event_date
  ON lingo.xp_event(event_date);

-- Weekly Leaderboard: Materialized weekly rankings
CREATE TABLE IF NOT EXISTS lingo.leaderboard_weekly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES identity.person(id) ON DELETE CASCADE,
  week_start DATE NOT NULL,
  weekly_xp INTEGER NOT NULL DEFAULT 0,
  phrases_studied INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, week_start)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_week_xp
  ON lingo.leaderboard_weekly(week_start, weekly_xp DESC);

-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION lingo.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_srs_card_updated') THEN
    CREATE TRIGGER trg_srs_card_updated
      BEFORE UPDATE ON lingo.srs_card
      FOR EACH ROW EXECUTE FUNCTION lingo.update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_xp_updated') THEN
    CREATE TRIGGER trg_user_xp_updated
      BEFORE UPDATE ON lingo.user_xp
      FOR EACH ROW EXECUTE FUNCTION lingo.update_updated_at();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_leaderboard_updated') THEN
    CREATE TRIGGER trg_leaderboard_updated
      BEFORE UPDATE ON lingo.leaderboard_weekly
      FOR EACH ROW EXECUTE FUNCTION lingo.update_updated_at();
  END IF;
END $$;

-- RLS Policies (users can only access their own data)
ALTER TABLE lingo.srs_card ENABLE ROW LEVEL SECURITY;
ALTER TABLE lingo.user_xp ENABLE ROW LEVEL SECURITY;
ALTER TABLE lingo.xp_event ENABLE ROW LEVEL SECURITY;
ALTER TABLE lingo.leaderboard_weekly ENABLE ROW LEVEL SECURITY;

-- Service role has full access (API routes use service role key)
-- These policies ensure data isolation at the database level
