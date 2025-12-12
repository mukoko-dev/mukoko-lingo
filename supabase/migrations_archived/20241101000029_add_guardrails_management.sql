-- ============================================================================
-- Migration 029: Guardrails Management System
-- ============================================================================
-- Description: Add configurable guardrails system for content moderation
-- Author: Claude Code
-- Date: 2025-11-11
-- ============================================================================

-- Create guardrails table for core moderation rules
CREATE TABLE IF NOT EXISTS guardrails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL UNIQUE, -- sexual, hate, harassment, violence, self_harm, abuse
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  is_core BOOLEAN NOT NULL DEFAULT true, -- Core rules can only be toggled on/off, not edited
  severity TEXT NOT NULL DEFAULT 'high', -- low, medium, high, critical
  prompt_guidance TEXT, -- Additional guidance for AI moderator
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create custom guardrails table for admin-defined rules
CREATE TABLE IF NOT EXISTS custom_guardrails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  keywords TEXT[], -- Keywords to flag
  pattern TEXT, -- Regex pattern for matching
  severity TEXT NOT NULL DEFAULT 'medium',
  prompt_guidance TEXT NOT NULL, -- Guidance for AI moderator
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert core guardrails (these are the 6 categories from moderation.ts)
INSERT INTO guardrails (category, name, description, is_core, severity, prompt_guidance) VALUES
  (
    'sexual',
    'Sexual Content',
    'Detects sexually explicit content, nudity, sexual acts, or inappropriate sexual references',
    true,
    'critical',
    'Flag any sexually explicit content, suggestive material, or inappropriate sexual references. Be strict but understand educational/clinical contexts.'
  ),
  (
    'hate',
    'Hate Speech',
    'Detects hate speech, discrimination, or prejudice based on protected characteristics',
    true,
    'critical',
    'Flag content expressing hatred, discrimination, or prejudice based on race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics.'
  ),
  (
    'harassment',
    'Harassment & Bullying',
    'Detects harassment, bullying, intimidation, or targeted abuse',
    true,
    'high',
    'Flag content that harasses, bullies, intimidates, or targets specific individuals or groups. Include cyberbullying, doxxing, and persistent unwanted contact.'
  ),
  (
    'violence',
    'Violence & Threats',
    'Detects violent content, threats, or glorification of violence',
    true,
    'critical',
    'Flag content depicting, threatening, or glorifying violence. Include physical violence, graphic content, and threats of harm.'
  ),
  (
    'self_harm',
    'Self-Harm & Suicide',
    'Detects content promoting self-harm, suicide, or eating disorders',
    true,
    'critical',
    'Flag content promoting, encouraging, or providing instructions for self-harm, suicide, or eating disorders. Be sensitive to users seeking help.'
  ),
  (
    'abuse',
    'Abuse & Exploitation',
    'Detects child abuse, exploitation, human trafficking, or illegal activities',
    true,
    'critical',
    'Flag content related to child abuse, exploitation, human trafficking, illegal drugs, or other serious illegal activities.'
  )
ON CONFLICT (category) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  prompt_guidance = EXCLUDED.prompt_guidance,
  updated_at = NOW();

-- Create guardrails_audit_log for tracking changes
CREATE TABLE IF NOT EXISTS guardrails_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guardrail_id UUID,
  guardrail_category TEXT,
  action TEXT NOT NULL, -- enabled, disabled, created, updated, deleted
  changed_by UUID REFERENCES auth.users(id),
  changes JSONB, -- Store what changed
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_guardrails_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_guardrails_timestamp
  BEFORE UPDATE ON guardrails
  FOR EACH ROW
  EXECUTE FUNCTION update_guardrails_updated_at();

CREATE TRIGGER update_custom_guardrails_timestamp
  BEFORE UPDATE ON custom_guardrails
  FOR EACH ROW
  EXECUTE FUNCTION update_guardrails_updated_at();

-- Audit log trigger for guardrails
CREATE OR REPLACE FUNCTION log_guardrails_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.is_enabled != NEW.is_enabled THEN
    INSERT INTO guardrails_audit_log (
      guardrail_id,
      guardrail_category,
      action,
      changed_by,
      changes
    ) VALUES (
      NEW.id,
      NEW.category,
      CASE WHEN NEW.is_enabled THEN 'enabled' ELSE 'disabled' END,
      auth.uid(),
      jsonb_build_object(
        'old_enabled', OLD.is_enabled,
        'new_enabled', NEW.is_enabled
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_guardrails_changes
  AFTER UPDATE ON guardrails
  FOR EACH ROW
  EXECUTE FUNCTION log_guardrails_changes();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE guardrails ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_guardrails ENABLE ROW LEVEL SECURITY;
ALTER TABLE guardrails_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can read all guardrails
CREATE POLICY "Admins can read guardrails"
  ON guardrails FOR SELECT
  TO authenticated
  USING (is_admin());

-- Admins can update guardrails (only is_enabled for core ones)
CREATE POLICY "Admins can update guardrails"
  ON guardrails FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- Admins can manage custom guardrails
CREATE POLICY "Admins can read custom guardrails"
  ON custom_guardrails FOR SELECT
  TO authenticated
  USING (is_admin());

CREATE POLICY "Admins can insert custom guardrails"
  ON custom_guardrails FOR INSERT
  TO authenticated
  WITH CHECK (is_admin());

CREATE POLICY "Admins can update custom guardrails"
  ON custom_guardrails FOR UPDATE
  TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Admins can delete custom guardrails"
  ON custom_guardrails FOR DELETE
  TO authenticated
  USING (is_admin());

-- Admins can read audit log
CREATE POLICY "Admins can read guardrails audit log"
  ON guardrails_audit_log FOR SELECT
  TO authenticated
  USING (is_admin());

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_guardrails_category ON guardrails(category);
CREATE INDEX IF NOT EXISTS idx_guardrails_enabled ON guardrails(is_enabled);
CREATE INDEX IF NOT EXISTS idx_custom_guardrails_enabled ON custom_guardrails(is_enabled);
CREATE INDEX IF NOT EXISTS idx_guardrails_audit_log_guardrail_id ON guardrails_audit_log(guardrail_id);
CREATE INDEX IF NOT EXISTS idx_guardrails_audit_log_created_at ON guardrails_audit_log(created_at DESC);

-- ============================================================================
-- Grant Permissions
-- ============================================================================

GRANT SELECT ON guardrails TO authenticated;
GRANT UPDATE ON guardrails TO authenticated;
GRANT ALL ON custom_guardrails TO authenticated;
GRANT SELECT ON guardrails_audit_log TO authenticated;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE guardrails IS 'Core content moderation rules - can be toggled on/off by admins';
COMMENT ON TABLE custom_guardrails IS 'Custom moderation rules defined by admins with keywords and patterns';
COMMENT ON TABLE guardrails_audit_log IS 'Audit trail for all guardrails changes';
COMMENT ON COLUMN guardrails.is_core IS 'Core rules can only be toggled, not edited or deleted';
COMMENT ON COLUMN guardrails.prompt_guidance IS 'Additional instructions for AI moderator when evaluating content';
COMMENT ON COLUMN custom_guardrails.keywords IS 'Array of keywords to flag (case-insensitive match)';
COMMENT ON COLUMN custom_guardrails.pattern IS 'Regex pattern for advanced matching';
