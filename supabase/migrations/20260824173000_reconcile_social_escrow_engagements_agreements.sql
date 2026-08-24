-- Privileged workflow layer for the eight tables introduced by
-- 20260824170500_reconcile_remaining_feature_tables.sql.
--
-- Forward-only except for replacing the named stakes_status_check constraint
-- with a strict superset that includes the refund state used by the sweeper.

-- Transaction ownership belongs to the migration runner. Keeping transaction
-- control outside this file also makes BEGIN ... ROLLBACK dry runs reliable.

DO $preflight$
DECLARE
  v_name TEXT;
BEGIN
  FOREACH v_name IN ARRAY ARRAY[
    'post_comments', 'follows', 'milestones', 'escrow_accounts',
    'escrow_events', 'engagements', 'board_agreements',
    'board_agreement_signatures', 'wallet_transactions'
  ] LOOP
    IF to_regclass('public.' || v_name) IS NULL THEN
      RAISE EXCEPTION 'required table public.% is missing', v_name;
    END IF;
  END LOOP;
  IF to_regprocedure('public.get_my_board_ids()') IS NULL THEN
    RAISE EXCEPTION 'required helper public.get_my_board_ids() is missing';
  END IF;
END
$preflight$;

ALTER TABLE public.stakes
  DROP CONSTRAINT IF EXISTS stakes_status_check;
DO $constraint_preflight$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.stakes'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%status%'
      AND pg_get_constraintdef(oid) NOT ILIKE '%refunded%'
  ) THEN
    RAISE EXCEPTION
      'an additional stakes status check still excludes refunded; reconcile it by name before applying';
  END IF;
END
$constraint_preflight$;
ALTER TABLE public.stakes
  ADD CONSTRAINT stakes_status_check
  CHECK (status IN ('active','funded','closed','cancelled','refunded'))
  NOT VALID;
ALTER TABLE public.stakes VALIDATE CONSTRAINT stakes_status_check;

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

REVOKE ALL ON FUNCTION close_expired_campaigns() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION close_expired_campaigns() TO service_role;

-- ── Read models for the UI ──
CREATE OR REPLACE FUNCTION fetch_campaign_milestones(p_campaign_id UUID)
RETURNS TABLE (
  id UUID, title TEXT, description TEXT, tranche NUMERIC, "position" INTEGER,
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


-- Trigger functions are not direct APIs.
REVOKE ALL ON FUNCTION public.update_post_comment_count()
  FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.open_escrow_on_funding()
  FROM PUBLIC, anon, authenticated;

-- Authenticated user workflows.
REVOKE ALL ON FUNCTION public.create_milestone(UUID,TEXT,TEXT,NUMERIC,DATE,INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_milestone(UUID,TEXT,TEXT,NUMERIC,DATE,INTEGER) TO authenticated;
REVOKE ALL ON FUNCTION public.submit_milestone(UUID,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_milestone(UUID,TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.verify_milestone(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_milestone(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.dispute_milestone(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dispute_milestone(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.rework_milestone(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rework_milestone(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.fetch_campaign_milestones(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_campaign_milestones(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.get_escrow_summary(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_escrow_summary(UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.accept_booking(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.accept_booking(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.decline_booking(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.decline_booking(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.deliver_engagement(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.deliver_engagement(UUID) TO authenticated;
REVOKE ALL ON FUNCTION public.rate_engagement(UUID,INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rate_engagement(UUID,INTEGER) TO authenticated;
REVOKE ALL ON FUNCTION public.fetch_my_engagements() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.fetch_my_engagements() TO authenticated;

REVOKE ALL ON FUNCTION public.create_board_agreement(UUID,TEXT,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_board_agreement(UUID,TEXT,TEXT) TO authenticated;
REVOKE ALL ON FUNCTION public.sign_board_agreement(UUID,TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.sign_board_agreement(UUID,TEXT) TO authenticated;

-- Scheduler-only workflow.
REVOKE ALL ON FUNCTION public.close_expired_campaigns()
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.close_expired_campaigns()
  TO service_role;
