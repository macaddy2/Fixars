-- Forward-only security boundary for Paystack settlement and the deadline RPC.
--
-- This migration intentionally does not attempt to reconcile the other missing
-- Fixars domains. It adds only the payment ledger objects that the settlement
-- transaction requires, then restricts both privileged RPCs to service_role.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  stake_id UUID REFERENCES public.stakes(id) ON DELETE SET NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency TEXT NOT NULL DEFAULT 'NGN' CHECK (currency = upper(currency)),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'succeeded', 'failed', 'refunded')),
  provider TEXT NOT NULL DEFAULT 'paystack',
  provider_ref TEXT NOT NULL UNIQUE,
  card_last4 TEXT,
  card_brand TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL DEFAULT 'deposit'
    CHECK (type IN ('deposit', 'stake', 'refund', 'payout', 'withdrawal')),
  label TEXT,
  app TEXT NOT NULL DEFAULT 'wallet',
  amount NUMERIC(12,2) NOT NULL CHECK (amount <> 0),
  ref TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user
  ON public.payments (user_id);
CREATE INDEX IF NOT EXISTS idx_payments_stake
  ON public.payments (stake_id);
CREATE INDEX IF NOT EXISTS idx_wallet_user
  ON public.wallet_transactions (user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_created
  ON public.wallet_transactions (user_id, created_at DESC);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DO $migration$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'payments'
      AND policyname = 'payments_select'
  ) THEN
    CREATE POLICY payments_select ON public.payments
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'wallet_transactions'
      AND policyname = 'wallet_select'
  ) THEN
    CREATE POLICY wallet_select ON public.wallet_transactions
      FOR SELECT TO authenticated
      USING ((SELECT auth.uid()) = user_id);
  END IF;
END
$migration$;

-- Called only after the server has independently verified the transaction
-- with Paystack. Row locking, amount/currency checks, payment state transition,
-- and ledger credit all occur in this single database transaction.
CREATE OR REPLACE FUNCTION public.settle_paystack_payment(
  p_provider_ref TEXT,
  p_provider_amount_minor BIGINT,
  p_currency TEXT,
  p_card_last4 TEXT DEFAULT NULL,
  p_card_brand TEXT DEFAULT NULL
)
RETURNS TABLE (
  payment_status TEXT,
  credited BOOLEAN,
  settled_amount NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $function$
DECLARE
  v_payment public.payments%ROWTYPE;
  v_expected_amount NUMERIC(12,2);
  v_ledger_id UUID;
  v_ledger_user_id UUID;
  v_ledger_amount NUMERIC(12,2);
  v_inserted_count INTEGER := 0;
  v_ledger_ref TEXT;
BEGIN
  IF p_provider_ref IS NULL OR btrim(p_provider_ref) = '' THEN
    RAISE EXCEPTION 'provider reference is required' USING ERRCODE = '22023';
  END IF;
  IF p_provider_amount_minor IS NULL OR p_provider_amount_minor <= 0 THEN
    RAISE EXCEPTION 'provider amount must be positive' USING ERRCODE = '22023';
  END IF;
  IF upper(coalesce(p_currency, '')) <> 'NGN' THEN
    RAISE EXCEPTION 'unsupported payment currency' USING ERRCODE = '22023';
  END IF;

  v_expected_amount := p_provider_amount_minor::NUMERIC / 100;

  SELECT p.*
    INTO v_payment
    FROM public.payments AS p
   WHERE p.provider_ref = p_provider_ref
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'payment not found' USING ERRCODE = 'P0002';
  END IF;
  IF v_payment.provider <> 'paystack' THEN
    RAISE EXCEPTION 'payment provider mismatch' USING ERRCODE = '22023';
  END IF;
  IF upper(v_payment.currency) <> upper(p_currency) THEN
    RAISE EXCEPTION 'payment currency mismatch' USING ERRCODE = '22023';
  END IF;
  IF v_payment.amount <> v_expected_amount THEN
    RAISE EXCEPTION 'payment amount mismatch' USING ERRCODE = '22023';
  END IF;
  IF v_payment.status IN ('failed', 'refunded') THEN
    RAISE EXCEPTION 'payment cannot be settled from status %', v_payment.status
      USING ERRCODE = '55000';
  END IF;

  v_ledger_ref := 'paid-' || v_payment.provider_ref;

  INSERT INTO public.wallet_transactions (
    user_id, type, label, app, amount, ref
  ) VALUES (
    v_payment.user_id,
    'deposit',
    CASE WHEN v_payment.stake_id IS NULL
      THEN 'Wallet top-up - checkout'
      ELSE 'Wallet top-up - campaign stake'
    END,
    'vestden',
    v_payment.amount,
    v_ledger_ref
  )
  ON CONFLICT (ref) DO NOTHING
  RETURNING id INTO v_ledger_id;

  GET DIAGNOSTICS v_inserted_count = ROW_COUNT;

  SELECT wt.user_id, wt.amount
    INTO v_ledger_user_id, v_ledger_amount
    FROM public.wallet_transactions AS wt
   WHERE wt.ref = v_ledger_ref;

  IF v_ledger_user_id IS DISTINCT FROM v_payment.user_id
     OR v_ledger_amount IS DISTINCT FROM v_payment.amount THEN
    RAISE EXCEPTION 'existing wallet credit does not match payment'
      USING ERRCODE = '23505';
  END IF;

  UPDATE public.payments
     SET status = 'succeeded',
         card_last4 = coalesce(p_card_last4, card_last4),
         card_brand = coalesce(p_card_brand, card_brand),
         metadata = coalesce(metadata, '{}'::jsonb)
           || jsonb_build_object('verified_at', now())
   WHERE id = v_payment.id;

  RETURN QUERY
  SELECT 'succeeded'::TEXT, (v_inserted_count = 1), v_payment.amount;
END
$function$;

COMMENT ON FUNCTION public.settle_paystack_payment(TEXT, BIGINT, TEXT, TEXT, TEXT)
  IS 'Atomically validates and settles a server-verified Paystack payment; service_role only.';

REVOKE ALL ON FUNCTION public.settle_paystack_payment(TEXT, BIGINT, TEXT, TEXT, TEXT)
  FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.settle_paystack_payment(TEXT, BIGINT, TEXT, TEXT, TEXT)
  TO service_role;

-- The deadline RPC is defined by the later milestone/escrow reconciliation.
-- Tighten it now when present; otherwise that migration must apply the same
-- grants immediately after creating the function.
DO $migration$
BEGIN
  IF to_regprocedure('public.close_expired_campaigns()') IS NOT NULL THEN
    REVOKE ALL ON FUNCTION public.close_expired_campaigns()
      FROM PUBLIC, anon, authenticated;
    GRANT EXECUTE ON FUNCTION public.close_expired_campaigns()
      TO service_role;
  END IF;
END
$migration$;

-- Read-only verification after applying in an isolated/staging project:
--
-- SELECT tablename, rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('payments', 'wallet_transactions');
--
-- SELECT routine_name, grantee, privilege_type
-- FROM information_schema.routine_privileges
-- WHERE specific_schema = 'public'
--   AND routine_name IN ('settle_paystack_payment', 'close_expired_campaigns')
-- ORDER BY routine_name, grantee;
--
-- In a transaction that is rolled back, insert a pending test payment and call
-- settle_paystack_payment twice with the same verified reference. Assert one
-- wallet row, succeeded status, exact NGN amount, and credited=true then false.
