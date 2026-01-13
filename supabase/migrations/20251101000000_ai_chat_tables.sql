-- =====================================================
-- ENHANCED CHAT TABLES (Migration 2)
-- =====================================================
-- This migration adds enhanced chat features:
-- - Chat settings per user
-- - Chat analytics tracking
-- - Enhanced conversation management
-- - Updated trigger to create chat settings for new users
-- =====================================================

-- IMPORTANT: This migration works WITH migration 1, not against it.
-- Migration 1 creates chat_sessions and chat_messages (session-based)
-- This migration adds chat_settings and chat_analytics (new tables)
-- =====================================================

-- =====================================================
-- STEP 1: Create New Chat Tables (Non-conflicting)
-- =====================================================

-- Chat Settings Table
-- Stores user preferences for AI behavior
-- NOTE: This is a NEW table, doesn't conflict with migration 1

CREATE TABLE IF NOT EXISTS public.chat_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  temperature DECIMAL(3, 2) DEFAULT 0.7,
  max_tokens INTEGER DEFAULT 1000,
  system_prompt TEXT DEFAULT 'You are KCA Connect AI, an intelligent assistant for KCA University students, lecturers, and administrators.',
  enable_streaming BOOLEAN DEFAULT TRUE,
  show_suggestions BOOLEAN DEFAULT TRUE,
  enable_voice BOOLEAN DEFAULT FALSE,
  preferred_model TEXT DEFAULT 'google/gemini-2.5-flash',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  
  CONSTRAINT chat_settings_unique_user UNIQUE (user_id)
);

-- Chat Analytics Table
-- Tracks chat usage statistics (separate from chat_sessions in migration 1)
-- NOTE: This is a NEW table, doesn't conflict with migration 1

CREATE TABLE IF NOT EXISTS public.chat_analytics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  ended_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- =====================================================
-- STEP 2: Create Indexes for New Tables
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_chat_settings_user_id ON public.chat_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_user_id ON public.chat_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_analytics_started_at ON public.chat_analytics(started_at DESC);

-- =====================================================
-- STEP 3: Enable RLS on New Tables
-- =====================================================

ALTER TABLE public.chat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_analytics ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 4: Create RLS Policies for New Tables
-- =====================================================

-- Chat Settings Policies
CREATE POLICY "Users can view own chat settings" ON public.chat_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own chat settings" ON public.chat_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert chat settings for new users" ON public.chat_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Chat Analytics Policies
CREATE POLICY "Users can view own chat analytics" ON public.chat_analytics
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat analytics" ON public.chat_analytics
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat analytics" ON public.chat_analytics
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- STEP 5: Create Utility Functions
-- =====================================================

-- Function to get user's chat settings
CREATE OR REPLACE FUNCTION public.get_chat_settings()
RETURNS SETOF public.chat_settings AS $$
  SELECT * FROM public.chat_settings
  WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to update chat settings
CREATE OR REPLACE FUNCTION public.update_chat_settings(
  p_temperature DECIMAL(3, 2),
  p_max_tokens INTEGER,
  p_system_prompt TEXT,
  p_enable_streaming BOOLEAN,
  p_show_suggestions BOOLEAN,
  p_enable_voice BOOLEAN,
  p_preferred_model TEXT
)
RETURNS public.chat_settings AS $$
DECLARE
  v_settings public.chat_settings;
BEGIN
  INSERT INTO public.chat_settings (user_id, temperature, max_tokens, system_prompt, enable_streaming, show_suggestions, enable_voice, preferred_model)
  VALUES (
    auth.uid(),
    COALESCE(p_temperature, 0.7),
    COALESCE(p_max_tokens, 1000),
    COALESCE(p_system_prompt, 'You are KCA Connect AI, an intelligent assistant for KCA University students, lecturers, and administrators.'),
    COALESCE(p_enable_streaming, TRUE),
    COALESCE(p_show_suggestions, TRUE),
    COALESCE(p_enable_voice, FALSE),
    COALESCE(p_preferred_model, 'google/gemini-2.5-flash')
  )
  ON CONFLICT (user_id) DO UPDATE SET
    temperature = COALESCE(p_temperature, EXCLUDED.temperature),
    max_tokens = COALESCE(p_max_tokens, EXCLUDED.max_tokens),
    system_prompt = COALESCE(p_system_prompt, EXCLUDED.system_prompt),
    enable_streaming = COALESCE(p_enable_streaming, EXCLUDED.enable_streaming),
    show_suggestions = COALESCE(p_show_suggestions, EXCLUDED.show_suggestions),
    enable_voice = COALESCE(p_enable_voice, EXCLUDED.enable_voice),
    preferred_model = COALESCE(p_preferred_model, EXCLUDED.preferred_model),
    updated_at = NOW()
  RETURNING * INTO v_settings;
  
  RETURN v_settings;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create a new chat analytics record
CREATE OR REPLACE FUNCTION public.start_chat_session(p_session_id UUID)
RETURNS public.chat_analytics AS $$
DECLARE
  v_analytics public.chat_analytics;
BEGIN
  INSERT INTO public.chat_analytics (user_id, session_id, started_at)
  VALUES (auth.uid(), p_session_id, NOW())
  RETURNING * INTO v_analytics;
  
  RETURN v_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to end chat session and update analytics
CREATE OR REPLACE FUNCTION public.end_chat_session(
  p_analytics_id UUID,
  p_message_count INTEGER DEFAULT 0,
  p_total_tokens INTEGER DEFAULT 0
)
RETURNS public.chat_analytics AS $$
DECLARE
  v_analytics public.chat_analytics;
BEGIN
  UPDATE public.chat_analytics
  SET 
    ended_at = NOW(),
    message_count = p_message_count,
    total_tokens = p_total_tokens
  WHERE id = p_analytics_id AND user_id = auth.uid()
  RETURNING * INTO v_analytics;
  
  RETURN v_analytics;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- STEP 6: Create Triggers for New Tables
-- =====================================================

-- Auto-update updated_at timestamp for settings
CREATE TRIGGER update_chat_settings_updated_at
  BEFORE UPDATE ON public.chat_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- NOTE: User signup triggers are handled in migration
-- 20251103000000_auth_triggers.sql
-- This migration ONLY creates chat tables and policies
-- =====================================================

-- =====================================================
-- STEP 7: Add Chat Messages Enhancement (Optional)
-- =====================================================
-- Add metadata column to existing chat_messages from migration 1
-- This enhances the table without breaking existing functionality

ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- =====================================================
-- STEP 8: Grant Permissions
-- =====================================================

GRANT EXECUTE ON FUNCTION public.get_chat_settings() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_chat_settings(DECIMAL, INTEGER, TEXT, BOOLEAN, BOOLEAN, BOOLEAN, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.start_chat_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.end_chat_session(UUID, INTEGER, INTEGER) TO authenticated;

