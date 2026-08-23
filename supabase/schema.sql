-- Fixars Superapp - Production Database Schema
-- Run this in your Supabase SQL Editor (Dashboard → SQL Editor → New Query → Paste & Run)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  points INTEGER DEFAULT 0,
  level TEXT DEFAULT 'Newcomer',
  skills TEXT[] DEFAULT '{}',
  connections INTEGER DEFAULT 0,
  projects INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 2. VESTDEN TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS stakes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  creator_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('tech', 'marketplace', 'health', 'finance', 'education', 'social', 'other')) DEFAULT 'other',
  risk_level TEXT CHECK (risk_level IN ('low', 'medium', 'high')) DEFAULT 'medium',
  target_amount DECIMAL(12,2) NOT NULL CHECK (target_amount > 0),
  current_amount DECIMAL(12,2) DEFAULT 0 CHECK (current_amount >= 0),
  expected_returns TEXT,
  deadline DATE,
  status TEXT CHECK (status IN ('active', 'funded', 'closed', 'cancelled')) DEFAULT 'active',
  linked_idea_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS stakers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stake_id UUID REFERENCES stakes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stake_id, user_id)
);

-- ============================================================
-- 3. CONCEPTNEXUS TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS ideas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  creator_name TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  validation_score INTEGER DEFAULT 0 CHECK (validation_score >= 0 AND validation_score <= 100),
  upvotes INTEGER DEFAULT 0 CHECK (upvotes >= 0),
  downvotes INTEGER DEFAULT 0 CHECK (downvotes >= 0),
  status TEXT CHECK (status IN ('draft', 'validating', 'validated', 'archived')) DEFAULT 'validating',
  impact_tags TEXT[] DEFAULT '{}',
  linked_stake_id UUID,
  linked_board_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS idea_votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  idea_id UUID REFERENCES ideas(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  vote TEXT CHECK (vote IN ('up', 'down')) NOT NULL,
  comment TEXT,
  badge TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(idea_id, user_id)
);

-- ============================================================
-- 4. COLLABOARD TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  linked_idea_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);

CREATE TABLE IF NOT EXISTS board_columns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  position INTEGER DEFAULT 0 CHECK (position >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  column_id UUID REFERENCES board_columns(id) ON DELETE CASCADE NOT NULL,
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  assignee_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  due_date DATE,
  labels TEXT[] DEFAULT '{}',
  completed_at TIMESTAMP WITH TIME ZONE,
  position INTEGER DEFAULT 0 CHECK (position >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 5. SKILLSCANVAS TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS talents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  hourly_rate DECIMAL(10,2) CHECK (hourly_rate IS NULL OR hourly_rate >= 0),
  availability TEXT CHECK (availability IN ('full-time', 'part-time', 'unavailable')) DEFAULT 'unavailable',
  portfolio JSONB DEFAULT '[]'::jsonb,
  completed_projects INTEGER DEFAULT 0 CHECK (completed_projects >= 0),
  rating DECIMAL(3,2) DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count INTEGER DEFAULT 0 CHECK (review_count >= 0),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skills (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  talent_id UUID REFERENCES talents(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  level TEXT CHECK (level IN ('beginner', 'intermediate', 'advanced', 'expert')) NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  talent_id UUID REFERENCES talents(id) ON DELETE CASCADE NOT NULL,
  reviewer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5) NOT NULL,
  content TEXT,
  project_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(talent_id, reviewer_id)
);

CREATE TABLE IF NOT EXISTS skill_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  talent_id UUID REFERENCES talents(id) ON DELETE CASCADE NOT NULL,
  message TEXT,
  status TEXT CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 6. SOCIAL TABLES
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  author_avatar TEXT,
  content TEXT NOT NULL CHECK (char_length(content) <= 5000),
  source_app TEXT DEFAULT 'fixars',
  linked_entity_type TEXT,
  linked_entity_id TEXT,
  linked_entity_name TEXT,
  visibility TEXT CHECK (visibility IN ('public', 'private')) DEFAULT 'public',
  comment_count INTEGER DEFAULT 0 CHECK (comment_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS post_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL CHECK (char_length(emoji) <= 10),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id, emoji)
);

CREATE TABLE IF NOT EXISTS post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (follower_id <> following_id),
  UNIQUE(follower_id, following_id)
);

-- Payment ledger. Rows are written exclusively by the payment provider
-- webhook / service role — there is deliberately NO insert policy for
-- authenticated clients.
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  stake_id UUID REFERENCES stakes(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT DEFAULT 'NGN',
  status TEXT CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')) DEFAULT 'pending',
  provider TEXT DEFAULT 'paystack',
  provider_ref TEXT UNIQUE,
  card_last4 TEXT,
  card_brand TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Naira wallet ledger. The balance is DERIVED (SUM of signed amounts) — it is
-- never stored, so it cannot drift. Rows are written exclusively by
-- SECURITY DEFINER functions (wallet_spend) or the payment webhook using the
-- service role; clients have NO insert/update policy.
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('deposit', 'stake', 'refund', 'payout', 'withdrawal')) DEFAULT 'deposit',
  label TEXT,
  app TEXT DEFAULT 'wallet',
  amount DECIMAL(12,2) NOT NULL CHECK (amount <> 0),
  ref TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Deterministic key for 1:1 DMs ("smaller-uuid:larger-uuid") that prevents
  -- duplicate conversations when both users message simultaneously.
  -- Uniqueness is enforced by ux_conversations_dm_key (see INDEXES).
  dm_key TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS conversation_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT NOT NULL,
  unread_count INTEGER DEFAULT 0 CHECK (unread_count >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(conversation_id, user_id)
);

CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 10000),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  source_app TEXT,
  linked_entity_type TEXT,
  linked_entity_id TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- 7. ACTIVITY LOG & POINTS
-- ============================================================
CREATE TABLE IF NOT EXISTS activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  user_name TEXT NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  app TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL,
  points INTEGER NOT NULL,
  label TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================
-- CROSS-TABLE FOREIGN KEYS (added after all tables exist)
-- ============================================================
ALTER TABLE stakes
  ADD CONSTRAINT fk_stakes_linked_idea FOREIGN KEY (linked_idea_id)
  REFERENCES ideas(id) ON DELETE SET NULL;

ALTER TABLE ideas
  ADD CONSTRAINT fk_ideas_linked_stake FOREIGN KEY (linked_stake_id)
  REFERENCES stakes(id) ON DELETE SET NULL;

ALTER TABLE ideas
  ADD CONSTRAINT fk_ideas_linked_board FOREIGN KEY (linked_board_id)
  REFERENCES boards(id) ON DELETE SET NULL;

ALTER TABLE boards
  ADD CONSTRAINT fk_boards_linked_idea FOREIGN KEY (linked_idea_id)
  REFERENCES ideas(id) ON DELETE SET NULL;

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_stakes_creator ON stakes(creator_id);
CREATE INDEX IF NOT EXISTS idx_stakes_status ON stakes(status);
CREATE INDEX IF NOT EXISTS idx_stakes_category ON stakes(category);
CREATE INDEX IF NOT EXISTS idx_stakers_stake ON stakers(stake_id);
CREATE INDEX IF NOT EXISTS idx_stakers_user ON stakers(user_id);

CREATE INDEX IF NOT EXISTS idx_ideas_creator ON ideas(creator_id);
CREATE INDEX IF NOT EXISTS idx_ideas_status ON ideas(status);
CREATE INDEX IF NOT EXISTS idx_idea_votes_idea ON idea_votes(idea_id);
CREATE INDEX IF NOT EXISTS idx_idea_votes_user ON idea_votes(user_id);

CREATE INDEX IF NOT EXISTS idx_boards_creator ON boards(creator_id);
CREATE INDEX IF NOT EXISTS idx_board_members_board ON board_members(board_id);
CREATE INDEX IF NOT EXISTS idx_board_members_user ON board_members(user_id);
CREATE INDEX IF NOT EXISTS idx_board_columns_board ON board_columns(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_column ON tasks(column_id);
CREATE INDEX IF NOT EXISTS idx_tasks_board ON tasks(board_id);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee_id);

CREATE INDEX IF NOT EXISTS idx_talents_user_id ON talents(user_id);
CREATE INDEX IF NOT EXISTS idx_talents_availability ON talents(availability);
CREATE INDEX IF NOT EXISTS idx_talents_is_active ON talents(is_active);
CREATE INDEX IF NOT EXISTS idx_skills_talent_id ON skills(talent_id);
CREATE INDEX IF NOT EXISTS idx_skills_name ON skills(name);
CREATE INDEX IF NOT EXISTS idx_reviews_talent_id ON reviews(talent_id);
CREATE INDEX IF NOT EXISTS idx_skill_requests_talent_id ON skill_requests(talent_id);
CREATE INDEX IF NOT EXISTS idx_skill_requests_requester_id ON skill_requests(requester_id);

CREATE INDEX IF NOT EXISTS idx_posts_author ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_reactions_post ON post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_created ON post_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stake ON payments(stake_id);
CREATE INDEX IF NOT EXISTS idx_wallet_user ON wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_created ON wallet_transactions(user_id, created_at DESC);
-- Unique (not just indexed) so concurrent DM creation can't produce duplicates;
-- a unique index works both for fresh and pre-existing deployments.
CREATE UNIQUE INDEX IF NOT EXISTS ux_conversations_dm_key ON conversations(dm_key);
CREATE INDEX IF NOT EXISTS idx_conv_participants_conv ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_conv_participants_user ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_created ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, read) WHERE read = false;
CREATE INDEX IF NOT EXISTS idx_activities_app ON activities(app);
CREATE INDEX IF NOT EXISTS idx_activities_created ON activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_history_user ON points_history(user_id);

-- ============================================================
-- HELPER FUNCTIONS (created AFTER tables, used by RLS policies)
-- These use SECURITY DEFINER to avoid self-referencing RLS recursion
-- ============================================================

-- Returns board IDs the current user has access to
CREATE OR REPLACE FUNCTION get_my_board_ids()
RETURNS SETOF UUID AS $$
  SELECT board_id FROM board_members WHERE user_id = auth.uid()
  UNION
  SELECT id FROM boards WHERE creator_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Returns conversation IDs the current user participates in
CREATE OR REPLACE FUNCTION get_my_conversation_ids()
RETURNS SETOF UUID AS $$
  SELECT conversation_id FROM conversation_participants WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE SET search_path = public;

-- Creates (or returns the existing) DM conversation between two users.
-- Uses a deterministic dm_key + upsert so two simultaneous first-messages
-- converge on ONE conversation instead of creating duplicates.
CREATE OR REPLACE FUNCTION create_dm_conversation(
  p_user_id UUID,
  p_user_name TEXT,
  p_recipient_id UUID,
  p_recipient_name TEXT
)
RETURNS UUID AS $$
DECLARE
  v_conv_id UUID;
  v_dm_key TEXT;
BEGIN
  v_dm_key := concat_ws(':',
    least(p_user_id::TEXT, p_recipient_id::TEXT),
    greatest(p_user_id::TEXT, p_recipient_id::TEXT)
  );

  INSERT INTO conversations (dm_key)
  VALUES (v_dm_key)
  ON CONFLICT (dm_key) DO UPDATE SET last_activity = NOW()
  RETURNING id INTO v_conv_id;

  -- Idempotent participant insert (both rows, bypassing RLS via DEFINER)
  INSERT INTO conversation_participants (conversation_id, user_id, user_name)
  VALUES
    (v_conv_id, p_user_id, p_user_name),
    (v_conv_id, p_recipient_id, p_recipient_name)
  ON CONFLICT (conversation_id, user_id) DO NOTHING;

  RETURN v_conv_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakes ENABLE ROW LEVEL SECURITY;
ALTER TABLE stakers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ideas ENABLE ROW LEVEL SECURITY;
ALTER TABLE idea_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE talents ENABLE ROW LEVEL SECURITY;
ALTER TABLE skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- ── Profiles ──
-- Row visibility is limited to authenticated users; profiles.email is
-- considered private (never selected by app queries for other users).
DROP POLICY IF EXISTS "profiles_select" ON profiles;
CREATE POLICY "profiles_select" ON profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "profiles_insert" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ── Stakes ──
CREATE POLICY "stakes_select" ON stakes
  FOR SELECT USING (true);
CREATE POLICY "stakes_insert" ON stakes
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "stakes_update" ON stakes
  FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "stakes_delete" ON stakes
  FOR DELETE USING (auth.uid() = creator_id AND status = 'active' AND current_amount = 0);

-- ── Stakers ──
CREATE POLICY "stakers_select" ON stakers
  FOR SELECT USING (true);
CREATE POLICY "stakers_insert" ON stakers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Ideas ──
CREATE POLICY "ideas_select" ON ideas
  FOR SELECT USING (true);
CREATE POLICY "ideas_insert" ON ideas
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "ideas_update" ON ideas
  FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "ideas_delete" ON ideas
  FOR DELETE USING (auth.uid() = creator_id AND status IN ('draft', 'validating'));

-- ── Idea Votes ──
CREATE POLICY "idea_votes_select" ON idea_votes
  FOR SELECT USING (true);
CREATE POLICY "idea_votes_insert" ON idea_votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Boards (uses helper function to avoid self-referencing RLS) ──
CREATE POLICY "boards_select" ON boards
  FOR SELECT USING (id IN (SELECT get_my_board_ids()));
CREATE POLICY "boards_insert" ON boards
  FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "boards_update" ON boards
  FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "boards_delete" ON boards
  FOR DELETE USING (auth.uid() = creator_id);

-- ── Board Members (uses helper function to avoid self-referencing RLS) ──
CREATE POLICY "board_members_select" ON board_members
  FOR SELECT USING (board_id IN (SELECT get_my_board_ids()));
CREATE POLICY "board_members_insert" ON board_members
  FOR INSERT WITH CHECK (
    board_id IN (SELECT id FROM boards WHERE creator_id = auth.uid())
    OR (auth.uid() = user_id AND board_id IN (SELECT get_my_board_ids()))
  );
CREATE POLICY "board_members_update" ON board_members
  FOR UPDATE USING (
    board_id IN (SELECT id FROM boards WHERE creator_id = auth.uid())
  );
CREATE POLICY "board_members_delete" ON board_members
  FOR DELETE USING (
    board_id IN (SELECT id FROM boards WHERE creator_id = auth.uid())
    OR auth.uid() = user_id
  );

-- ── Board Columns ──
CREATE POLICY "board_columns_select" ON board_columns
  FOR SELECT USING (board_id IN (SELECT get_my_board_ids()));
CREATE POLICY "board_columns_insert" ON board_columns
  FOR INSERT WITH CHECK (board_id IN (SELECT get_my_board_ids()));
CREATE POLICY "board_columns_update" ON board_columns
  FOR UPDATE USING (board_id IN (SELECT get_my_board_ids()));
CREATE POLICY "board_columns_delete" ON board_columns
  FOR DELETE USING (
    board_id IN (SELECT id FROM boards WHERE creator_id = auth.uid())
  );

-- ── Tasks ──
CREATE POLICY "tasks_select" ON tasks
  FOR SELECT USING (board_id IN (SELECT get_my_board_ids()));
CREATE POLICY "tasks_insert" ON tasks
  FOR INSERT WITH CHECK (board_id IN (SELECT get_my_board_ids()));
CREATE POLICY "tasks_update" ON tasks
  FOR UPDATE USING (board_id IN (SELECT get_my_board_ids()));
CREATE POLICY "tasks_delete" ON tasks
  FOR DELETE USING (board_id IN (SELECT get_my_board_ids()));

-- ── Talents ──
CREATE POLICY "talents_select" ON talents
  FOR SELECT USING (is_active = true OR auth.uid() = user_id);
CREATE POLICY "talents_insert" ON talents
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "talents_update" ON talents
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "talents_delete" ON talents
  FOR DELETE USING (auth.uid() = user_id);

-- ── Skills ──
CREATE POLICY "skills_select" ON skills
  FOR SELECT USING (true);
CREATE POLICY "skills_insert" ON skills
  FOR INSERT WITH CHECK (
    talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid())
  );
CREATE POLICY "skills_update" ON skills
  FOR UPDATE USING (
    talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid())
  );
CREATE POLICY "skills_delete" ON skills
  FOR DELETE USING (
    talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid())
  );

-- ── Reviews ──
CREATE POLICY "reviews_select" ON reviews
  FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "reviews_update" ON reviews
  FOR UPDATE USING (auth.uid() = reviewer_id);

-- ── Skill Requests ──
CREATE POLICY "skill_requests_select" ON skill_requests
  FOR SELECT USING (
    auth.uid() = requester_id OR
    talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid())
  );
CREATE POLICY "skill_requests_insert" ON skill_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "skill_requests_update" ON skill_requests
  FOR UPDATE USING (
    auth.uid() = requester_id OR
    talent_id IN (SELECT id FROM talents WHERE user_id = auth.uid())
  );

-- ── Posts ──
CREATE POLICY "posts_select" ON posts
  FOR SELECT USING (visibility = 'public' OR auth.uid() = author_id);
CREATE POLICY "posts_insert" ON posts
  FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "posts_update" ON posts
  FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "posts_delete" ON posts
  FOR DELETE USING (auth.uid() = author_id);

-- ── Post Reactions ──
CREATE POLICY "post_reactions_select" ON post_reactions
  FOR SELECT USING (true);
CREATE POLICY "post_reactions_insert" ON post_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_reactions_delete" ON post_reactions
  FOR DELETE USING (auth.uid() = user_id);

-- ── Post Comments ──
DROP POLICY IF EXISTS "post_comments_select" ON post_comments;
CREATE POLICY "post_comments_select" ON post_comments
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "post_comments_insert" ON post_comments;
CREATE POLICY "post_comments_insert" ON post_comments
  FOR INSERT WITH CHECK (auth.uid() = author_id);
DROP POLICY IF EXISTS "post_comments_delete" ON post_comments;
CREATE POLICY "post_comments_delete" ON post_comments
  FOR DELETE USING (auth.uid() = author_id);

-- ── Follows ──
DROP POLICY IF EXISTS "follows_select" ON follows;
CREATE POLICY "follows_select" ON follows
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "follows_insert" ON follows;
CREATE POLICY "follows_insert" ON follows
  FOR INSERT WITH CHECK (auth.uid() = follower_id AND follower_id <> following_id);
DROP POLICY IF EXISTS "follows_delete" ON follows;
CREATE POLICY "follows_delete" ON follows
  FOR DELETE USING (auth.uid() = follower_id);

-- ── Conversations (uses helper function to avoid self-referencing RLS) ──
CREATE POLICY "conversations_select" ON conversations
  FOR SELECT USING (id IN (SELECT get_my_conversation_ids()));
CREATE POLICY "conversations_insert" ON conversations
  FOR INSERT WITH CHECK (true);

-- ── Conversation Participants ──
CREATE POLICY "conv_participants_select" ON conversation_participants
  FOR SELECT USING (conversation_id IN (SELECT get_my_conversation_ids()));
CREATE POLICY "conv_participants_insert" ON conversation_participants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Messages ──
CREATE POLICY "messages_select" ON messages
  FOR SELECT USING (conversation_id IN (SELECT get_my_conversation_ids()));
CREATE POLICY "messages_insert" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    conversation_id IN (SELECT get_my_conversation_ids())
  );

-- ── Notifications ──
CREATE POLICY "notifications_select" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
-- Users may only create notifications for THEMSELVES (e.g. local echo of a
-- server-side event). Cross-user notification spam is impossible; real
-- cross-user notifications must be written via service role / triggers.
DROP POLICY IF EXISTS "notifications_insert" ON notifications;
CREATE POLICY "notifications_insert" ON notifications
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "notifications_update" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "notifications_delete" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- ── Activities ──
CREATE POLICY "activities_select" ON activities
  FOR SELECT USING (true);
CREATE POLICY "activities_insert" ON activities
  FOR INSERT WITH CHECK (true);

-- ── Points History ──
CREATE POLICY "points_history_select" ON points_history
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "points_history_insert" ON points_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── Payments ──
-- Read-only for owners; writes happen exclusively via the payment provider
-- webhook using the service role (which bypasses RLS).
CREATE POLICY "payments_select" ON payments
  FOR SELECT USING (auth.uid() = user_id);

-- ── Wallet Transactions ──
-- Read-only for owners. Balances change ONLY via wallet_spend() (SECURITY
-- DEFINER, server-validated) or the payment webhook (service role).
CREATE POLICY "wallet_select" ON wallet_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- FUNCTIONS & TRIGGERS
-- All trigger functions that modify other users' rows use
-- SECURITY DEFINER to bypass RLS.
-- ============================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY[
    'profiles', 'stakes', 'ideas', 'boards', 'tasks', 'talents', 'skill_requests'
  ]) LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS update_%s_updated_at ON %I', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER update_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at()',
      tbl, tbl
    );
  END LOOP;
END $$;

-- Update talent rating on new review (SECURITY DEFINER to bypass talent owner RLS)
CREATE OR REPLACE FUNCTION update_talent_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE talents
  SET
    rating = (SELECT COALESCE(AVG(rating), 0)::DECIMAL(3,2) FROM reviews WHERE talent_id = NEW.talent_id),
    review_count = (SELECT COUNT(*) FROM reviews WHERE talent_id = NEW.talent_id),
    updated_at = NOW()
  WHERE id = NEW.talent_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_review_insert ON reviews;
CREATE TRIGGER on_review_insert
  AFTER INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_talent_rating();

-- Recalculate idea validation score on vote (SECURITY DEFINER to update other users' ideas)
CREATE OR REPLACE FUNCTION update_idea_votes()
RETURNS TRIGGER AS $$
DECLARE
  up_count INTEGER;
  down_count INTEGER;
  total INTEGER;
  score INTEGER;
BEGIN
  SELECT
    COUNT(*) FILTER (WHERE vote = 'up'),
    COUNT(*) FILTER (WHERE vote = 'down')
  INTO up_count, down_count
  FROM idea_votes
  WHERE idea_id = NEW.idea_id;

  total := up_count + down_count;
  IF total > 0 THEN
    score := ROUND((up_count::DECIMAL / total) * 100);
  ELSE
    score := 0;
  END IF;

  UPDATE ideas
  SET
    upvotes = up_count,
    downvotes = down_count,
    validation_score = score,
    status = CASE
      WHEN score >= 75 AND total >= 10 THEN 'validated'
      ELSE status
    END,
    updated_at = NOW()
  WHERE id = NEW.idea_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_idea_vote ON idea_votes;
CREATE TRIGGER on_idea_vote
  AFTER INSERT ON idea_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_idea_votes();

-- Update stake current_amount on new staker (SECURITY DEFINER to update other users' stakes)
CREATE OR REPLACE FUNCTION update_stake_amount()
RETURNS TRIGGER AS $$
DECLARE
  new_total DECIMAL(12,2);
  target DECIMAL(12,2);
BEGIN
  SELECT SUM(amount) INTO new_total FROM stakers WHERE stake_id = NEW.stake_id;
  SELECT target_amount INTO target FROM stakes WHERE id = NEW.stake_id;

  UPDATE stakes
  SET
    current_amount = COALESCE(new_total, 0),
    status = CASE WHEN COALESCE(new_total, 0) >= target THEN 'funded' ELSE status END,
    updated_at = NOW()
  WHERE id = NEW.stake_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_staker_insert ON stakers;
CREATE TRIGGER on_staker_insert
  AFTER INSERT ON stakers
  FOR EACH ROW
  EXECUTE FUNCTION update_stake_amount();

-- Create profile on user signup (SECURITY DEFINER with locked search_path)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, display_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Update conversation last_activity on new message (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION update_conversation_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET last_activity = NOW()
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_message_insert ON messages;
CREATE TRIGGER on_message_insert
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_activity();

-- Keep posts.comment_count in sync with post_comments (SECURITY DEFINER so the
-- commenter doesn't need UPDATE rights on the author's post row)
CREATE OR REPLACE FUNCTION update_post_comment_count()
RETURNS TRIGGER AS $$
DECLARE
  v_new_count INTEGER;
  v_post_id UUID := COALESCE(NEW.post_id, OLD.post_id);
BEGIN
  SELECT COUNT(*) INTO v_new_count FROM post_comments WHERE post_id = v_post_id;

  UPDATE posts
  SET comment_count = v_new_count
  WHERE id = v_post_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_comment_insert ON post_comments;
CREATE TRIGGER on_comment_insert
  AFTER INSERT ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

DROP TRIGGER IF EXISTS on_comment_delete ON post_comments;
CREATE TRIGGER on_comment_delete
  AFTER DELETE ON post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comment_count();

-- ============================================================
-- SERVER-AUTHORITATIVE MONEY & POINTS (RPCs)
-- The client can NEVER send raw point amounts or stake totals.
-- Every mutation goes through these SECURITY DEFINER functions,
-- which enforce the rules server-side and are atomic.
-- ============================================================

-- Points level ladder (mirrors src/contexts/PointsContext.jsx LEVELS)
CREATE OR REPLACE FUNCTION get_level_for_points(p_points INTEGER)
RETURNS TEXT AS $$
  SELECT name FROM (VALUES
    ('Legend', 10000),
    ('Visionary', 5000),
    ('Trailblazer', 2500),
    ('Pioneer', 1000),
    ('Contributor', 500),
    ('Explorer', 100),
    ('Newcomer', 0)
  ) AS levels(name, min_points)
  WHERE p_points >= min_points
  ORDER BY min_points DESC
  LIMIT 1;
$$ LANGUAGE sql STABLE SET search_path = public;

-- Award points for a KNOWN action. The amount is resolved server-side from the
-- action key, so a tampered client cannot mint arbitrary points.
CREATE OR REPLACE FUNCTION award_points(p_action TEXT)
RETURNS INTEGER AS $$
DECLARE
  v_points INTEGER;
  v_new INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  v_points := CASE p_action
    WHEN 'DAILY_LOGIN' THEN 5
    WHEN 'SUBMIT_IDEA' THEN 10
    WHEN 'VALIDATE_IDEA' THEN 5
    WHEN 'IDEA_VALIDATED' THEN 50
    WHEN 'MAKE_STAKE' THEN 15
    WHEN 'COMPLETE_TASK' THEN 10
    WHEN 'GET_HIRED' THEN 25
    WHEN 'PROFILE_COMPLETE' THEN 20
    WHEN 'FIRST_MESSAGE' THEN 5
    WHEN 'REFERRAL' THEN 100
    WHEN 'POST_STATUS' THEN 3
    WHEN 'RECEIVE_REACTION' THEN 1
    -- Ecosystem-engine reasons (src/engine/effects.js POINTS)
    WHEN 'CONCEPT_VALIDATED' THEN 50
    WHEN 'CAMPAIGN_FUNDED' THEN 200
    WHEN 'MILESTONE_VERIFIED' THEN 75
    WHEN 'ENGAGEMENT_COMPLETED' THEN 60
    ELSE NULL
  END;

  IF v_points IS NULL THEN
    RAISE EXCEPTION 'unknown point action "%"', p_action;
  END IF;

  INSERT INTO points_history (user_id, action, points, label)
  VALUES (auth.uid(), p_action, v_points, NULL);

  UPDATE profiles
  SET points = points + v_points,
      level = get_level_for_points(points + v_points)
  WHERE id = auth.uid()
  RETURNING points INTO v_new;

  RETURN v_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Spend points atomically. Returns the new balance, or NULL when the balance
-- is insufficient (callers treat NULL as "declined").
CREATE OR REPLACE FUNCTION spend_points(p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_new INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;

  UPDATE profiles
  SET points = points - p_amount,
      level = get_level_for_points(points - p_amount)
  WHERE id = auth.uid() AND points >= p_amount
  RETURNING points INTO v_new;

  IF v_new IS NULL THEN
    RETURN NULL; -- insufficient balance
  END IF;

  INSERT INTO points_history (user_id, action, points, label)
  VALUES (auth.uid(), 'SPEND', -p_amount, NULL);

  RETURN v_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Place a stake server-side. Validates campaign state and refuses to
-- over-fund past the target. Amounts are summed from stakers rows by the
-- existing trigger; this function is the ONLY sanctioned write path.
CREATE OR REPLACE FUNCTION make_stake(p_stake_id UUID, p_amount NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
  v_status TEXT;
  v_target NUMERIC;
  v_current NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'stake amount must be positive'; END IF;

  SELECT status, target_amount, current_amount
  INTO v_status, v_target, v_current
  FROM stakes
  WHERE id = p_stake_id
  FOR UPDATE;

  IF NOT FOUND THEN RAISE EXCEPTION 'campaign not found'; END IF;
  IF v_status <> 'active' THEN RAISE EXCEPTION 'campaign is no longer active'; END IF;
  IF v_current + p_amount > v_target THEN
    RAISE EXCEPTION 'amount exceeds remaining funding target';
  END IF;

  -- Upsert: a backer staking again adds to their previous amount
  INSERT INTO stakers (stake_id, user_id, amount)
  VALUES (p_stake_id, auth.uid(), p_amount)
  ON CONFLICT (stake_id, user_id)
  DO UPDATE SET amount = stakers.amount + EXCLUDED.amount;

  RETURN v_current + p_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Wallet balance is derived from the ledger (never stored).
CREATE OR REPLACE FUNCTION wallet_balance()
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(amount), 0) FROM wallet_transactions WHERE user_id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- Debit the wallet atomically. Raises on insufficient funds; returns the new
-- balance. Credits (deposits/payouts) arrive via the payment webhook only.
CREATE OR REPLACE FUNCTION wallet_spend(
  p_amount NUMERIC,
  p_label TEXT DEFAULT NULL,
  p_app TEXT DEFAULT 'vestden',
  p_type TEXT DEFAULT 'stake',
  p_ref TEXT DEFAULT NULL
)
RETURNS NUMERIC AS $$
DECLARE
  v_balance NUMERIC;
  v_new NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_amount IS NULL OR p_amount <= 0 THEN RAISE EXCEPTION 'amount must be positive'; END IF;

  SELECT wallet_balance() INTO v_balance;
  IF v_balance < p_amount THEN
    RAISE EXCEPTION 'insufficient wallet balance';
  END IF;

  INSERT INTO wallet_transactions (user_id, type, label, app, amount, ref)
  VALUES (auth.uid(), p_type, p_label, p_app, -p_amount, p_ref)
  ON CONFLICT (ref) DO NOTHING
  RETURNING amount INTO v_new;

  IF v_new IS NULL THEN
    -- Idempotent replay (same ref already spent) — return current balance
    RETURN wallet_balance();
  END IF;

  RETURN v_balance + v_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ============================================================
-- M1: ESCROW & MILESTONES
-- Funded campaigns hold raised funds in escrow_accounts (mirror of the
-- wallet ledger, not a separate balance). Milestone verification releases
-- tranches from escrow into the founder's wallet_transactions — idempotently,
-- via ref-keyed inserts. Clients NEVER write these tables directly.
-- ============================================================

CREATE TABLE IF NOT EXISTS milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES stakes(id) ON DELETE CASCADE NOT NULL,
  board_id UUID REFERENCES boards(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  description TEXT,
  tranche NUMERIC(12,2) NOT NULL CHECK (tranche > 0),
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','submitted','verified','disputed','missed')),
  due_date DATE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  submission_note TEXT CHECK (submission_note IS NULL OR char_length(submission_note) <= 2000),
  verified_at TIMESTAMP WITH TIME ZONE,
  verified_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS escrow_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID UNIQUE REFERENCES stakes(id) ON DELETE CASCADE NOT NULL,
  founder_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  raised_amount NUMERIC(12,2) NOT NULL CHECK (raised_amount > 0),
  held NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (held >= 0),
  status TEXT NOT NULL DEFAULT 'held' CHECK (status IN ('held','released','frozen','refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Append-only audit trail; no UPDATE/DELETE policies ever.
CREATE TABLE IF NOT EXISTS escrow_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES stakes(id) ON DELETE CASCADE NOT NULL,
  milestone_id UUID REFERENCES milestones(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('fund','release','freeze','refund')),
  amount NUMERIC(12,2) NOT NULL,
  actor UUID REFERENCES profiles(id) ON DELETE SET NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE escrow_events ENABLE ROW LEVEL SECURITY;

-- Reads follow the stakes visibility model: any authenticated user can see
-- campaigns, so milestone/escrow state is readable too. ALL writes go through
-- SECURITY DEFINER RPCs below.
DROP POLICY IF EXISTS "milestones_select" ON milestones;
CREATE POLICY "milestones_select" ON milestones FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "escrow_select" ON escrow_accounts;
CREATE POLICY "escrow_select" ON escrow_accounts FOR SELECT USING (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "escrow_events_select" ON escrow_events;
CREATE POLICY "escrow_events_select" ON escrow_events FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_milestones_campaign ON milestones(campaign_id, position);
CREATE INDEX IF NOT EXISTS idx_escrow_events_campaign ON escrow_events(campaign_id, created_at);

-- ── Auto-open an escrow account when a campaign first becomes funded ──
CREATE OR REPLACE FUNCTION open_escrow_on_funding()
RETURNS TRIGGER AS $$
DECLARE v_founder UUID;
BEGIN
  IF NEW.status = 'funded' AND OLD.status IS DISTINCT FROM 'funded' THEN
    SELECT creator_id INTO v_founder FROM stakes WHERE id = NEW.id;
    INSERT INTO escrow_accounts (campaign_id, founder_id, raised_amount, held)
    VALUES (NEW.id, v_founder, NEW.current_amount, NEW.current_amount)
    ON CONFLICT (campaign_id) DO NOTHING;
    INSERT INTO escrow_events (campaign_id, type, amount)
    VALUES (NEW.id, 'fund', NEW.current_amount);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_stake_funded ON stakes;
CREATE TRIGGER on_stake_funded
  AFTER UPDATE ON stakes
  FOR EACH ROW EXECUTE FUNCTION open_escrow_on_funding();

-- ── Create a milestone (founder only; tranches may not exceed escrow) ──
CREATE OR REPLACE FUNCTION create_milestone(
  p_campaign_id UUID, p_title TEXT, p_description TEXT,
  p_tranche NUMERIC, p_due_date DATE DEFAULT NULL, p_position INTEGER DEFAULT 0
)
RETURNS UUID AS $$
DECLARE
  v_founder UUID; v_raised NUMERIC; v_committed NUMERIC; v_status TEXT; v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT creator_id, status INTO v_founder, v_status FROM stakes WHERE id = p_campaign_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'campaign not found'; END IF;
  IF v_founder <> auth.uid() THEN RAISE EXCEPTION 'only the campaign founder can add milestones'; END IF;
  IF v_status <> 'funded' THEN RAISE EXCEPTION 'milestones unlock when the campaign is fully funded'; END IF;
  IF p_tranche IS NULL OR p_tranche <= 0 THEN RAISE EXCEPTION 'tranche must be positive'; END IF;

  SELECT raised_amount INTO v_raised FROM escrow_accounts WHERE campaign_id = p_campaign_id;
  SELECT COALESCE(SUM(tranche),0) INTO v_committed FROM milestones WHERE campaign_id = p_campaign_id;
  IF v_committed + p_tranche > v_raised THEN
    RAISE EXCEPTION 'schedule exceeds escrow: committed % + % > raised %', v_committed, p_tranche, v_raised;
  END IF;

  INSERT INTO milestones (campaign_id, title, description, tranche, due_date, position)
  VALUES (p_campaign_id, p_title, NULLIF(p_description,''), p_tranche, p_due_date, p_position)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── Submit deliverables (founder or a member of the linked board) ──
CREATE OR REPLACE FUNCTION submit_milestone(p_milestone_id UUID, p_note TEXT)
RETURNS VOID AS $$
DECLARE v_campaign UUID; v_board UUID; v_status TEXT; v_founder UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT campaign_id, board_id, status INTO v_campaign, v_board, v_status FROM milestones WHERE id = p_milestone_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'milestone not found'; END IF;
  IF v_status NOT IN ('pending','in_progress','disputed') THEN RAISE EXCEPTION 'milestone is not submittable from state %', v_status; END IF;

  SELECT creator_id INTO v_founder FROM stakes WHERE id = v_campaign;
  IF v_founder <> auth.uid() THEN
    IF v_board IS NULL OR NOT EXISTS (
      SELECT 1 FROM board_members WHERE board_id = v_board AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'only the founder or linked board members can submit';
    END IF;
  END IF;

  UPDATE milestones
  SET status='submitted', submission_note=NULLIF(p_note,''), submitted_at=NOW(), updated_at=NOW()
  WHERE id = p_milestone_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── Verify → release tranche to founder wallet (backers verify, founder cannot) ──
CREATE OR REPLACE FUNCTION verify_milestone(p_milestone_id UUID)
RETURNS NUMERIC AS $$
DECLARE
  v_campaign UUID; v_status TEXT; v_tranche NUMERIC; v_founder UUID;
  v_held NUMERIC; v_released NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT m.campaign_id, m.status, m.tranche INTO v_campaign, v_status, v_tranche
  FROM milestones m WHERE m.id = p_milestone_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'milestone not found'; END IF;
  IF v_status = 'verified' THEN
    RETURN 0; -- idempotent replay
  END IF;
  IF v_status <> 'submitted' THEN RAISE EXCEPTION 'only submitted milestones can be verified'; END IF;

  SELECT creator_id INTO v_founder FROM stakes WHERE id = v_campaign;
  IF v_founder = auth.uid() THEN RAISE EXCEPTION 'the founder cannot verify their own milestone — a backer must'; END IF;
  IF NOT EXISTS (SELECT 1 FROM stakers WHERE stake_id = v_campaign AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'only backers of this campaign can verify milestones';
  END IF;

  SELECT held INTO v_held FROM escrow_accounts WHERE campaign_id = v_campaign FOR UPDATE;
  IF v_held IS NULL THEN RAISE EXCEPTION 'escrow account missing'; END IF;
  IF v_held < v_tranche THEN RAISE EXCEPTION 'escrow holds less than this tranche'; END IF;

  -- Idempotent money move: ref-unique credit, then conditional updates
  INSERT INTO wallet_transactions (user_id, type, label, app, amount, ref)
  VALUES (v_founder, 'payout', 'Milestone payout · ' || p_milestone_id, 'collaboard', v_tranche, 'escrow:' || p_milestone_id::TEXT)
  ON CONFLICT (ref) DO NOTHING
  RETURNING amount INTO v_released;

  IF v_released IS NOT NULL THEN
    UPDATE escrow_accounts SET held = held - v_tranche WHERE campaign_id = v_campaign;
    INSERT INTO escrow_events (campaign_id, milestone_id, type, amount, actor)
    VALUES (v_campaign, p_milestone_id, 'release', v_tranche, auth.uid());
  END IF;

  UPDATE milestones
  SET status='verified', verified_at=NOW(), verified_by=auth.uid(), updated_at=NOW()
  WHERE id = p_milestone_id;

  RETURN COALESCE(v_released, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── Dispute (backer, after submission) / rework (founder, after dispute) ──
CREATE OR REPLACE FUNCTION dispute_milestone(p_milestone_id UUID) RETURNS VOID AS $$
DECLARE v_campaign UUID; v_status TEXT;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT campaign_id, status INTO v_campaign, v_status FROM milestones WHERE id = p_milestone_id;
  IF v_status <> 'submitted' THEN RAISE EXCEPTION 'only submitted milestones can be disputed'; END IF;
  IF NOT EXISTS (SELECT 1 FROM stakers WHERE stake_id = v_campaign AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'only backers can dispute';
  END IF;
  UPDATE milestones SET status='disputed', updated_at=NOW() WHERE id=p_milestone_id;
  INSERT INTO escrow_events (campaign_id, milestone_id, type, amount, actor)
  SELECT campaign_id, p_milestone_id, 'freeze', 0, auth.uid() FROM milestones WHERE id=p_milestone_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION rework_milestone(p_milestone_id UUID) RETURNS VOID AS $$
DECLARE v_founder UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT s.creator_id INTO v_founder FROM milestones m JOIN stakes s ON s.id=m.campaign_id WHERE m.id=p_milestone_id;
  IF v_founder <> auth.uid() THEN RAISE EXCEPTION 'only the founder can send back for rework'; END IF;
  UPDATE milestones SET status='in_progress', updated_at=NOW() WHERE id=p_milestone_id AND status='disputed';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── Deadline sweeper (service role / scheduled Edge Function) ──
-- Refunds expired unfunded campaigns back to staker wallets (idempotent via
-- ref keys) and marks overdue in-flight milestones as missed.
CREATE OR REPLACE FUNCTION close_expired_campaigns()
RETURNS INTEGER AS $$
DECLARE
  r RECORD; s RECORD; v_count INTEGER := 0;
BEGIN
  FOR s IN SELECT id, current_amount FROM stakes WHERE status='active' AND deadline < CURRENT_DATE FOR UPDATE LOOP
    UPDATE stakes SET status='refunded', updated_at=NOW() WHERE id=s.id;
    FOR r IN SELECT stake_id, user_id, amount FROM stakers WHERE stake_id=s.id LOOP
      INSERT INTO wallet_transactions (user_id, type, label, app, amount, ref)
      VALUES (r.user_id, 'refund', 'Refund · expired campaign', 'vestden', r.amount,
              'refund:' || s.id::TEXT || ':' || r.user_id::TEXT)
      ON CONFLICT (ref) DO NOTHING;
    END LOOP;
    v_count := v_count + 1;
  END LOOP;

  UPDATE milestones SET status='missed', updated_at=NOW()
  WHERE status IN ('pending','in_progress') AND due_date < CURRENT_DATE
    AND campaign_id IN (SELECT id FROM stakes WHERE status='funded');

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── Read models for the UI ──
CREATE OR REPLACE FUNCTION fetch_campaign_milestones(p_campaign_id UUID)
RETURNS TABLE (
  id UUID, title TEXT, description TEXT, tranche NUMERIC, position INTEGER,
  status TEXT, due_date DATE, submission_note TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE, verified_at TIMESTAMP WITH TIME ZONE
) AS $$
  SELECT m.id, m.title, m.description, m.tranche, m.position, m.status,
         m.due_date, m.submission_note, m.submitted_at, m.verified_at
  FROM milestones m
  WHERE m.campaign_id = p_campaign_id
  ORDER BY m.position, m.created_at;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION get_escrow_summary(p_campaign_id UUID)
RETURNS TABLE (raised NUMERIC, held NUMERIC, released NUMERIC, status TEXT, is_backer BOOLEAN, is_founder BOOLEAN) AS $$
  SELECT e.raised_amount, e.held,
         (e.raised_amount - e.held),
         e.status,
         EXISTS (SELECT 1 FROM stakers WHERE stake_id=p_campaign_id AND user_id=auth.uid()),
         (e.founder_id = auth.uid())
  FROM escrow_accounts e WHERE e.campaign_id = p_campaign_id;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================================
-- M2: ENGAGEMENTS & REPUTATION (SkillsCanvas ⇄ CollaBoard loop)
-- A booking accepted becomes an engagement; delivering it earns the talent
-- proof points / delivery score and flips their verified badge. Hirers rate
-- delivered engagements, which moves reputation. All writes via RPCs.
-- ============================================================

ALTER TABLE talents
  ADD COLUMN IF NOT EXISTS proof_points INTEGER NOT NULL DEFAULT 0 CHECK (proof_points >= 0),
  ADD COLUMN IF NOT EXISTS delivery_score NUMERIC(4,3) NOT NULL DEFAULT 0 CHECK (delivery_score >= 0 AND delivery_score <= 1),
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reputation INTEGER NOT NULL DEFAULT 500 CHECK (reputation >= 0 AND reputation <= 1000);

CREATE TABLE IF NOT EXISTS engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID UNIQUE REFERENCES skill_requests(id) ON DELETE SET NULL,
  board_id UUID REFERENCES boards(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES stakes(id) ON DELETE SET NULL,
  hirer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  talent_user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  role_title TEXT NOT NULL DEFAULT 'Project engagement',
  rate NUMERIC(10,2),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'offered'
    CHECK (status IN ('offered','accepted','active','delivered','rated','declined')),
  delivered_at TIMESTAMP WITH TIME ZONE,
  on_time BOOLEAN,
  rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CHECK (hirer_id <> talent_user_id)
);

ALTER TABLE engagements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "engagements_select" ON engagements;
CREATE POLICY "engagements_select" ON engagements
  FOR SELECT USING (auth.uid() = hirer_id OR auth.uid() = talent_user_id);

CREATE INDEX IF NOT EXISTS idx_engagements_talent ON engagements(talent_user_id);
CREATE INDEX IF NOT EXISTS idx_engagements_hirer ON engagements(hirer_id);

-- Accept a pending booking as the talent: flips the request and opens the
-- engagement in one atomic, permission-checked step.
CREATE OR REPLACE FUNCTION accept_booking(p_request_id UUID)
RETURNS UUID AS $$
DECLARE v_request RECORD; v_talent_user UUID; v_engagement UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT * INTO v_request FROM skill_requests WHERE id = p_request_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'request not found'; END IF;
  IF v_request.status <> 'pending' THEN RAISE EXCEPTION 'request already handled'; END IF;

  SELECT user_id INTO v_talent_user FROM talents WHERE id = v_request.talent_id;
  IF v_talent_user <> auth.uid() THEN RAISE EXCEPTION 'only the requested talent can accept'; END IF;

  UPDATE skill_requests SET status='accepted', updated_at=NOW() WHERE id=p_request_id;

  INSERT INTO engagements (request_id, hirer_id, talent_user_id, status, role_title)
  VALUES (p_request_id, v_request.requester_id, auth.uid(), 'accepted',
          'Project engagement')
  RETURNING id INTO v_engagement;

  -- GET_HIRED points for the talent (self-award is safe: they performed the action)
  BEGIN
    PERFORM award_points('GET_HIRED');
  EXCEPTION WHEN OTHERS THEN NULL; -- never block acceptance on points
  END;

  RETURN v_engagement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION decline_booking(p_request_id UUID) RETURNS VOID AS $$
DECLARE v_talent_user UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT t.user_id INTO v_talent_user FROM skill_requests r JOIN talents t ON t.id=r.talent_id WHERE r.id=p_request_id;
  IF v_talent_user <> auth.uid() THEN RAISE EXCEPTION 'only the requested talent can decline'; END IF;
  UPDATE skill_requests SET status='rejected', updated_at=NOW() WHERE id=p_request_id AND status='pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Talent marks the work delivered. On-time feeds the delivery score; every
-- delivery earns a proof point and lights the verified badge.
CREATE OR REPLACE FUNCTION deliver_engagement(p_engagement_id UUID) RETURNS VOID AS $$
DECLARE
  v_talent UUID; v_status TEXT; v_due DATE; v_on_time BOOLEAN;
  v_deliveries INTEGER; v_ontime_count INTEGER; v_score NUMERIC;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT talent_user_id, status, due_date INTO v_talent, v_status, v_due FROM engagements WHERE id=p_engagement_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'engagement not found'; END IF;
  IF v_talent <> auth.uid() THEN RAISE EXCEPTION 'only the talent can deliver'; END IF;
  IF v_status NOT IN ('accepted','active') THEN RAISE EXCEPTION 'engagement is not deliverable'; END IF;

  v_on_time := (v_due IS NULL) OR (CURRENT_DATE <= v_due);

  UPDATE engagements
  SET status='delivered', delivered_at=NOW(), on_time=v_on_time, updated_at=NOW()
  WHERE id=p_engagement_id;

  INSERT INTO talents (user_id, proof_points, delivery_score, verified, is_active)
  SELECT auth.uid(), 1, CASE WHEN v_on_time THEN 1 ELSE 0 END, true, true
  WHERE NOT EXISTS (SELECT 1 FROM talents WHERE user_id=auth.uid())
  ON CONFLICT (user_id) DO NOTHING;

  UPDATE talents t
  SET proof_points = t.proof_points + 1,
      delivery_score = ROUND((((t.delivery_score * t.proof_points) + (CASE WHEN v_on_time THEN 1 ELSE 0 END)) / (t.proof_points + 1))::numeric, 3),
      verified = true,
      updated_at = NOW()
  WHERE user_id = auth.uid();

  BEGIN
    PERFORM award_points('ENGAGEMENT_COMPLETED');
  EXCEPTION WHEN OTHERS THEN NULL;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Hirer rates a delivered engagement → reputation move on the talent.
CREATE OR REPLACE FUNCTION rate_engagement(p_engagement_id UUID, p_rating INTEGER) RETURNS VOID AS $$
DECLARE v_hirer UUID; v_talent UUID; v_status TEXT; v_delta INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF p_rating BETWEEN 1 AND 5 IS NOT TRUE THEN RAISE EXCEPTION 'rating must be 1..5'; END IF;
  SELECT hirer_id, talent_user_id, status INTO v_hirer, v_talent, v_status FROM engagements WHERE id=p_engagement_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'engagement not found'; END IF;
  IF v_hirer <> auth.uid() THEN RAISE EXCEPTION 'only the hirer can rate'; END IF;
  IF v_status <> 'delivered' THEN RAISE EXCEPTION 'rate after delivery'; END IF;

  v_delta := CASE WHEN p_rating >= 4 THEN 5 WHEN p_rating = 3 THEN 0 ELSE -8 END;

  UPDATE engagements SET status='rated', rating=p_rating, updated_at=NOW() WHERE id=p_engagement_id;
  UPDATE talents
  SET reputation = GREATEST(0, LEAST(1000, reputation + v_delta)),
      updated_at = NOW()
  WHERE user_id = v_talent;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Read model: my engagements (both sides) with counterpart names.
CREATE OR REPLACE FUNCTION fetch_my_engagements()
RETURNS TABLE (
  id UUID, role TEXT, status TEXT, role_title TEXT, rate NUMERIC, due_date DATE,
  on_time BOOLEAN, rating INTEGER, created_at TIMESTAMP WITH TIME ZONE,
  counterpart_name TEXT
) AS $$
  SELECT e.id,
         CASE WHEN e.hirer_id = auth.uid() THEN 'hirer' ELSE 'talent' END,
         e.status, e.role_title, e.rate, e.due_date, e.on_time, e.rating, e.created_at,
         p.display_name
  FROM engagements e
  JOIN profiles p ON p.id = CASE WHEN e.hirer_id = auth.uid() THEN e.talent_user_id ELSE e.hirer_id END
  WHERE e.hirer_id = auth.uid() OR e.talent_user_id = auth.uid()
  ORDER BY e.created_at DESC;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ============================================================
-- M3: CROSS-USER NOTIFICATION FAN-OUT
-- SECURITY DEFINER triggers so one user''s action can notify another user
-- (client RLS deliberately forbids this). Actor never notifies themselves.
-- ============================================================

CREATE OR REPLACE FUNCTION notify_idea_owner_on_vote()
RETURNS TRIGGER AS $$
DECLARE v_creator UUID; v_title TEXT;
BEGIN
  SELECT creator_id, title INTO v_creator, v_title FROM ideas WHERE id = NEW.idea_id;
  IF v_creator IS NOT NULL AND v_creator <> NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, source_app, linked_entity_type, linked_entity_id)
    VALUES (v_creator, 'idea_voted',
            CASE WHEN NEW.vote='up' THEN '👍 Your idea got an upvote' ELSE 'Downvote on your idea' END,
            COALESCE(NEW.comment, v_title), 'conceptnexus', 'idea', NEW.idea_id::TEXT);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_idea_vote_notify ON idea_votes;
CREATE TRIGGER on_idea_vote_notify AFTER INSERT ON idea_votes
  FOR EACH ROW EXECUTE FUNCTION notify_idea_owner_on_vote();

CREATE OR REPLACE FUNCTION notify_stake_owner_on_backing()
RETURNS TRIGGER AS $$
DECLARE v_creator UUID; v_title TEXT; v_amt NUMERIC;
BEGIN
  SELECT creator_id, title INTO v_creator, v_title FROM stakes WHERE id = NEW.stake_id;
  SELECT amount INTO v_amt FROM stakes WHERE id = NEW.stake_id;
  IF v_creator IS NOT NULL AND v_creator <> NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, source_app, linked_entity_type, linked_entity_id)
    VALUES (v_creator, 'stake_received', '₦' || to_char(NEW.amount, 'FM999999999') || ' backed your campaign',
            v_title, 'vestden', 'stake', NEW.stake_id::TEXT);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_staker_notify ON stakers;
CREATE TRIGGER on_staker_notify AFTER INSERT ON stakers
  FOR EACH ROW EXECUTE FUNCTION notify_stake_owner_on_backing();

CREATE OR REPLACE FUNCTION notify_talent_on_request()
RETURNS TRIGGER AS $$
DECLARE v_talent_user UUID; v_requester TEXT;
BEGIN
  SELECT t.user_id INTO v_talent_user FROM talents t WHERE t.id = NEW.talent_id;
  SELECT display_name INTO v_requester FROM profiles WHERE id = NEW.requester_id;
  IF v_talent_user IS NOT NULL AND v_talent_user <> NEW.requester_id THEN
    INSERT INTO notifications (user_id, type, title, message, source_app, linked_entity_type, linked_entity_id)
    VALUES (v_talent_user, 'talent_request', 'New booking request from ' || COALESCE(v_requester,'a client'),
            LEFT(COALESCE(NEW.message,''), 140), 'skillscanvas', 'skill_request', NEW.id::TEXT);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_skill_request_notify ON skill_requests;
CREATE TRIGGER on_skill_request_notify AFTER INSERT ON skill_requests
  FOR EACH ROW EXECUTE FUNCTION notify_talent_on_request();

CREATE OR REPLACE FUNCTION notify_post_author_on_reaction()
RETURNS TRIGGER AS $$
DECLARE v_author UUID;
BEGIN
  SELECT author_id INTO v_author FROM posts WHERE id = NEW.post_id;
  IF v_author IS NOT NULL AND v_author <> NEW.user_id THEN
    INSERT INTO notifications (user_id, type, title, message, source_app, linked_entity_type, linked_entity_id)
    VALUES (v_author, 'reaction_received', NEW.emoji || ' Reaction on your post',
            NULL, 'fixars', 'post', NEW.post_id::TEXT);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_reaction_notify ON post_reactions;
CREATE TRIGGER on_reaction_notify AFTER INSERT ON post_reactions
  FOR EACH ROW EXECUTE FUNCTION notify_post_author_on_reaction();

CREATE OR REPLACE FUNCTION notify_engagement_lifecycle()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' THEN
    INSERT INTO notifications (user_id, type, title, message, source_app)
    VALUES (NEW.hirer_id, 'engagement_delivered',
            '📦 Work delivered — ready to rate',
            COALESCE(NEW.role_title,'Engagement'), 'skillscanvas');
  END IF;
  IF NEW.status = 'rated' AND OLD.status IS DISTINCT FROM 'rated' THEN
    INSERT INTO notifications (user_id, type, title, message, source_app)
    VALUES (NEW.talent_user_id, 'engagement_rated',
            '⭐ You were rated ' || NEW.rating || '/5',
            'Reputation updated.', 'skillscanvas');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_engagement_lifecycle ON engagements;
CREATE TRIGGER on_engagement_lifecycle AFTER UPDATE ON engagements
  FOR EACH ROW EXECUTE FUNCTION notify_engagement_lifecycle();

-- ============================================================
-- M4: KYC TIERS, BOARD AGREEMENTS, DATA SOVEREIGNTY
-- ============================================================

-- KYC tier on the public profile (mirrors engine KYC ladder: 0 none, 1 phone,
-- 2 NIN/BVN, 3 full). Tier 1 is self-asserted; tier 2 requires a reference
-- issued by the compliance port (server-side); tier 3 is ops-only.
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS kyc_tier INTEGER NOT NULL DEFAULT 0
  CHECK (kyc_tier BETWEEN 0 AND 3);

CREATE OR REPLACE FUNCTION set_kyc_tier(p_level INTEGER, p_ref TEXT DEFAULT NULL)
RETURNS INTEGER AS $$
DECLARE v_current INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT kyc_tier INTO v_current FROM profiles WHERE id = auth.uid();

  IF p_level = 1 THEN
    -- Self-asserted phone ownership (device OTP handled client-side today)
    UPDATE profiles SET kyc_tier = GREATEST(kyc_tier,1) WHERE id=auth.uid();
  ELSIF p_level = 2 THEN
    IF v_current < 1 THEN RAISE EXCEPTION 'complete tier-1 first'; END IF;
    IF p_ref IS NULL OR p_ref !~ '^kyc-' THEN RAISE EXCEPTION 'a valid kyc-… reference from the compliance port is required'; END IF;
    UPDATE profiles SET kyc_tier = GREATEST(kyc_tier,2) WHERE id=auth.uid();
  ELSE
    RAISE EXCEPTION 'tier % requires an operator', p_level;
  END IF;

  RETURN (SELECT kyc_tier FROM profiles WHERE id=auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── Board agreements: explicit team commitments with signatures ──
CREATE TABLE IF NOT EXISTS board_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID REFERENCES boards(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  body TEXT NOT NULL CHECK (char_length(body) <= 4000),
  created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS board_agreement_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agreement_id UUID REFERENCES board_agreements(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  signed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(agreement_id, user_id)
);

ALTER TABLE board_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE board_agreement_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "agreements_select" ON board_agreements;
CREATE POLICY "agreements_select" ON board_agreements
  FOR SELECT USING (board_id IN (SELECT get_my_board_ids()));
DROP POLICY IF EXISTS "signatures_select" ON board_agreement_signatures;
CREATE POLICY "signatures_select" ON board_agreement_signatures
  FOR SELECT USING (agreement_id IN (
    SELECT a.id FROM board_agreements a WHERE a.board_id IN (SELECT get_my_board_ids())
  ));

CREATE INDEX IF NOT EXISTS idx_agreements_board ON board_agreements(board_id);

CREATE OR REPLACE FUNCTION create_board_agreement(
  p_board_id UUID, p_title TEXT, p_body TEXT
)
RETURNS UUID AS $$
DECLARE v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  IF NOT EXISTS (
    SELECT 1 FROM boards WHERE id=p_board_id AND creator_id=auth.uid()
  ) AND NOT EXISTS (
    SELECT 1 FROM board_members WHERE board_id=p_board_id AND user_id=auth.uid() AND role IN ('owner','admin')
  ) THEN
    RAISE EXCEPTION 'only board owners/admins can draft agreements';
  END IF;

  INSERT INTO board_agreements (board_id, title, body, created_by)
  VALUES (p_board_id, p_title, p_body, auth.uid())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION sign_board_agreement(p_agreement_id UUID, p_name TEXT)
RETURNS VOID AS $$
DECLARE v_board UUID; v_signed BOOLEAN;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;
  SELECT board_id INTO v_board FROM board_agreements WHERE id=p_agreement_id;
  IF v_board IS NULL THEN RAISE EXCEPTION 'agreement not found'; END IF;
  IF NOT EXISTS (SELECT 1 FROM board_members WHERE board_id=v_board AND user_id=auth.uid()) THEN
    RAISE EXCEPTION 'only board members can sign';
  END IF;

  INSERT INTO board_agreement_signatures (agreement_id, user_id, name)
  VALUES (p_agreement_id, auth.uid(), COALESCE(NULLIF(p_name,''),'Member'))
  ON CONFLICT (agreement_id, user_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- ── Data sovereignty: export & content delete (FCL §sovereignty) ──
CREATE OR REPLACE FUNCTION export_my_data()
RETURNS JSONB AS $$
DECLARE out JSONB;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  SELECT jsonb_build_object(
    'exported_at', NOW(),
    'profile', (SELECT to_jsonb(p) FROM profiles p WHERE id=auth.uid()),
    'ideas', COALESCE((SELECT jsonb_agg(to_jsonb(i)) FROM ideas i WHERE creator_id=auth.uid()), '[]'::jsonb),
    'campaigns_owned', COALESCE((SELECT jsonb_agg(to_jsonb(s)) FROM stakes s WHERE creator_id=auth.uid()), '[]'::jsonb),
    'backed', COALESCE((SELECT jsonb_agg(to_jsonb(st)) FROM stakers st WHERE user_id=auth.uid()), '[]'::jsonb),
    'posts', COALESCE((SELECT jsonb_agg(to_jsonb(po)) FROM posts po WHERE author_id=auth.uid()), '[]'::jsonb),
    'comments', COALESCE((SELECT jsonb_agg(to_jsonb(c)) FROM post_comments c WHERE author_id=auth.uid()), '[]'::jsonb),
    'engagements', COALESCE((SELECT jsonb_agg(to_jsonb(e)) FROM engagements e WHERE hirer_id=auth.uid() OR talent_user_id=auth.uid()), '[]'::jsonb),
    'points_history', COALESCE((SELECT jsonb_agg(to_jsonb(ph)) FROM points_history ph WHERE user_id=auth.uid()), '[]'::jsonb),
    'wallet_entries', COALESCE((SELECT jsonb_agg(to_jsonb(w)) FROM wallet_transactions w WHERE user_id=auth.uid()), '[]'::jsonb)
  ) INTO out;
  RETURN out;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Deletes user-authored SOCIAL content only. Money/legal records (stakes,
-- engagements, wallet ledger, escrow events) are intentionally retained.
CREATE OR REPLACE FUNCTION delete_my_content()
RETURNS TABLE (posts_deleted INTEGER, comments_deleted INTEGER, votes_deleted INTEGER, notifications_deleted INTEGER) AS $$
DECLARE vp INTEGER; vc INTEGER; vv INTEGER; vn INTEGER;
BEGIN
  IF auth.uid() IS NULL THEN RAISE EXCEPTION 'not authenticated'; END IF;

  DELETE FROM posts WHERE author_id=auth.uid();
  GET DIAGNOSTICS vp = ROW_COUNT;
  DELETE FROM post_comments WHERE author_id=auth.uid();
  GET DIAGNOSTICS vc = ROW_COUNT;
  DELETE FROM idea_votes WHERE user_id=auth.uid();
  GET DIAGNOSTICS vv = ROW_COUNT;
  DELETE FROM notifications WHERE user_id=auth.uid();
  GET DIAGNOSTICS vn = ROW_COUNT;

  RETURN QUERY SELECT vp, vc, vv, vn;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
