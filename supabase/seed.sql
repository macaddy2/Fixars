-- Fixars Seed Data
-- Run this AFTER schema.sql to populate the database with sample data.
-- NOTE: Replace the UUIDs below with real user IDs from your auth.users table
-- after you've created some test accounts.

-- ============================================================
-- SAMPLE STAKES (VestDen)
-- ============================================================
-- These reference creator_id which must exist in profiles.
-- After signing up test users, run:

/*
INSERT INTO stakes (title, description, creator_id, creator_name, category, risk_level, target_amount, expected_returns, deadline)
VALUES
  ('AI-Powered Recipe Generator',
   'A mobile app that uses AI to generate personalized recipes based on dietary preferences, available ingredients, and nutritional goals.',
   '<USER_ID_1>', 'Test User 1', 'tech', 'medium', 15000, '2-4x', '2026-06-01'),

  ('Sustainable Fashion Marketplace',
   'A peer-to-peer platform for buying, selling, and renting pre-owned designer fashion items with verified authenticity.',
   '<USER_ID_2>', 'Test User 2', 'marketplace', 'low', 25000, '1.5-3x', '2026-05-15'),

  ('Remote Team Wellness Platform',
   'Enterprise SaaS for tracking and improving remote team wellness through gamified challenges and mental health resources.',
   '<USER_ID_1>', 'Test User 1', 'health', 'high', 50000, '3-6x', '2026-07-01');

-- ============================================================
-- SAMPLE IDEAS (ConceptNexus)
-- ============================================================
INSERT INTO ideas (title, description, creator_id, creator_name, category, impact_tags)
VALUES
  ('Community Solar Grid Network',
   'A decentralized network allowing neighborhoods to share solar energy production.',
   '<USER_ID_1>', 'Test User 1', 'sustainability', ARRAY['environmental', 'community', 'energy']),

  ('Skills-Based Volunteer Matching',
   'Platform connecting skilled professionals with non-profits that need their specific expertise.',
   '<USER_ID_2>', 'Test User 2', 'social-impact', ARRAY['social', 'skills', 'non-profit']);

-- ============================================================
-- SAMPLE BOARD (Collaboard)
-- ============================================================
-- Create a board
INSERT INTO boards (id, title, description, creator_id)
VALUES (uuid_generate_v4(), 'My First Board', 'A sample project board', '<USER_ID_1>');

-- Add creator as owner (use the board ID from above)
-- INSERT INTO board_members (board_id, user_id, role, name)
-- VALUES ('<BOARD_ID>', '<USER_ID_1>', 'owner', 'Test User 1');

-- Create default columns
-- INSERT INTO board_columns (board_id, title, position) VALUES
--   ('<BOARD_ID>', 'To Do', 0),
--   ('<BOARD_ID>', 'In Progress', 1),
--   ('<BOARD_ID>', 'Done', 2);

-- ============================================================
-- SAMPLE POST (Social)
-- ============================================================
INSERT INTO posts (author_id, author_name, content, source_app, visibility)
VALUES
  ('<USER_ID_1>', 'Test User 1',
   'Just launched my first project on Fixars! Excited to get started. 🚀',
   'fixars', 'public');
*/

-- ============================================================
-- QUICK START GUIDE
-- ============================================================
-- 1. Run schema.sql first
-- 2. Create 1-2 test accounts via the Fixars signup page
-- 3. Find their UUIDs in Supabase Dashboard → Auth → Users
-- 4. Replace <USER_ID_1> and <USER_ID_2> above with real UUIDs
-- 5. Uncomment the INSERT statements and run this file
