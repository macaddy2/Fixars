-- Forward-only reconciliation for the eight feature tables absent from the
-- Fixars staging baseline captured on 2026-08-24.
--
-- This migration is intentionally additive. Privileged RPCs and the campaign
-- status widening are installed separately after these objects are verified.

DO $preflight$
DECLARE
  v_name TEXT;
BEGIN
  FOREACH v_name IN ARRAY ARRAY[
    'profiles', 'posts', 'stakes', 'boards', 'board_members',
    'skill_requests', 'talents', 'wallet_transactions'
  ] LOOP
    IF to_regclass('public.' || v_name) IS NULL THEN
      RAISE EXCEPTION 'required table public.% is missing', v_name;
    END IF;
  END LOOP;

  IF to_regprocedure('public.get_my_board_ids()') IS NULL THEN
    RAISE EXCEPTION 'required function public.get_my_board_ids() is missing';
  END IF;

  FOREACH v_name IN ARRAY ARRAY[
    'post_comments', 'follows', 'milestones', 'escrow_accounts',
    'escrow_events', 'engagements', 'board_agreements',
    'board_agreement_signatures'
  ] LOOP
    IF to_regclass('public.' || v_name) IS NOT NULL THEN
      RAISE EXCEPTION 'public.% already exists; reconcile before applying', v_name;
    END IF;
  END LOOP;
END
$preflight$;

ALTER TABLE public.talents
  ADD COLUMN IF NOT EXISTS proof_points INTEGER NOT NULL DEFAULT 0
    CHECK (proof_points >= 0),
  ADD COLUMN IF NOT EXISTS delivery_score NUMERIC(4,3) NOT NULL DEFAULT 0
    CHECK (delivery_score >= 0 AND delivery_score <= 1),
  ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS reputation INTEGER NOT NULL DEFAULT 500
    CHECK (reputation >= 0 AND reputation <= 1000);

CREATE TABLE public.post_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  content TEXT NOT NULL CHECK (char_length(content) <= 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.follows (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  follower_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (follower_id <> following_id),
  UNIQUE (follower_id, following_id)
);

CREATE TABLE public.milestones (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.stakes(id) ON DELETE CASCADE,
  board_id UUID REFERENCES public.boards(id) ON DELETE SET NULL,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  description TEXT,
  tranche NUMERIC(12,2) NOT NULL CHECK (tranche > 0),
  position INTEGER NOT NULL DEFAULT 0 CHECK (position >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending', 'in_progress', 'submitted',
      'verified', 'disputed', 'missed'
    )),
  due_date DATE,
  submitted_at TIMESTAMPTZ,
  submission_note TEXT
    CHECK (submission_note IS NULL OR char_length(submission_note) <= 2000),
  verified_at TIMESTAMPTZ,
  verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.escrow_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL UNIQUE
    REFERENCES public.stakes(id) ON DELETE CASCADE,
  founder_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  raised_amount NUMERIC(12,2) NOT NULL CHECK (raised_amount > 0),
  held NUMERIC(12,2) NOT NULL DEFAULT 0
    CHECK (held >= 0 AND held <= raised_amount),
  status TEXT NOT NULL DEFAULT 'held'
    CHECK (status IN ('held', 'released', 'frozen', 'refunded')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.escrow_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES public.stakes(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.milestones(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('fund', 'release', 'freeze', 'refund')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  actor UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.engagements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_id UUID UNIQUE REFERENCES public.skill_requests(id) ON DELETE SET NULL,
  board_id UUID REFERENCES public.boards(id) ON DELETE SET NULL,
  campaign_id UUID REFERENCES public.stakes(id) ON DELETE SET NULL,
  hirer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  talent_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role_title TEXT NOT NULL DEFAULT 'Project engagement',
  rate NUMERIC(10,2) CHECK (rate IS NULL OR rate >= 0),
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'offered'
    CHECK (status IN (
      'offered', 'accepted', 'active', 'delivered', 'rated', 'declined'
    )),
  delivered_at TIMESTAMPTZ,
  on_time BOOLEAN,
  rating INTEGER CHECK (rating IS NULL OR rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (hirer_id <> talent_user_id)
);

CREATE TABLE public.board_agreements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  board_id UUID NOT NULL REFERENCES public.boards(id) ON DELETE CASCADE,
  title TEXT NOT NULL CHECK (char_length(title) <= 200),
  body TEXT NOT NULL CHECK (char_length(body) <= 4000),
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.board_agreement_signatures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  agreement_id UUID NOT NULL
    REFERENCES public.board_agreements(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (agreement_id, user_id)
);

CREATE INDEX idx_post_comments_post
  ON public.post_comments (post_id);
CREATE INDEX idx_post_comments_created
  ON public.post_comments (created_at);
CREATE INDEX idx_follows_follower
  ON public.follows (follower_id);
CREATE INDEX idx_follows_following
  ON public.follows (following_id);
CREATE INDEX idx_milestones_campaign
  ON public.milestones (campaign_id, position);
CREATE INDEX idx_escrow_events_campaign
  ON public.escrow_events (campaign_id, created_at);
CREATE INDEX idx_engagements_talent
  ON public.engagements (talent_user_id);
CREATE INDEX idx_engagements_hirer
  ON public.engagements (hirer_id);
CREATE INDEX idx_engagements_board
  ON public.engagements (board_id) WHERE board_id IS NOT NULL;
CREATE INDEX idx_engagements_campaign
  ON public.engagements (campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX idx_agreements_board
  ON public.board_agreements (board_id);
CREATE INDEX idx_agreement_signatures_user
  ON public.board_agreement_signatures (user_id);

ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.engagements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_agreement_signatures ENABLE ROW LEVEL SECURITY;

CREATE POLICY post_comments_select ON public.post_comments
  FOR SELECT TO authenticated USING (true);
CREATE POLICY post_comments_insert ON public.post_comments
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT auth.uid()) = author_id);
CREATE POLICY post_comments_delete ON public.post_comments
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = author_id);

CREATE POLICY follows_select ON public.follows
  FOR SELECT TO authenticated USING (true);
CREATE POLICY follows_insert ON public.follows
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT auth.uid()) = follower_id
    AND follower_id <> following_id
  );
CREATE POLICY follows_delete ON public.follows
  FOR DELETE TO authenticated
  USING ((SELECT auth.uid()) = follower_id);

CREATE POLICY milestones_select ON public.milestones
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);
CREATE POLICY escrow_select ON public.escrow_accounts
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);
CREATE POLICY escrow_events_select ON public.escrow_events
  FOR SELECT TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

CREATE POLICY engagements_select ON public.engagements
  FOR SELECT TO authenticated
  USING (
    (SELECT auth.uid()) = hirer_id
    OR (SELECT auth.uid()) = talent_user_id
  );

CREATE POLICY agreements_select ON public.board_agreements
  FOR SELECT TO authenticated
  USING (board_id IN (SELECT public.get_my_board_ids()));
CREATE POLICY signatures_select ON public.board_agreement_signatures
  FOR SELECT TO authenticated
  USING (
    agreement_id IN (
      SELECT a.id
      FROM public.board_agreements AS a
      WHERE a.board_id IN (SELECT public.get_my_board_ids())
    )
  );

REVOKE ALL ON
  public.post_comments,
  public.follows,
  public.milestones,
  public.escrow_accounts,
  public.escrow_events,
  public.engagements,
  public.board_agreements,
  public.board_agreement_signatures
FROM PUBLIC, anon, authenticated;

GRANT SELECT, INSERT, DELETE ON
  public.post_comments,
  public.follows
TO authenticated;

GRANT SELECT ON
  public.milestones,
  public.escrow_accounts,
  public.escrow_events,
  public.engagements,
  public.board_agreements,
  public.board_agreement_signatures
TO authenticated;

GRANT ALL ON
  public.post_comments,
  public.follows,
  public.milestones,
  public.escrow_accounts,
  public.escrow_events,
  public.engagements,
  public.board_agreements,
  public.board_agreement_signatures
TO service_role;
