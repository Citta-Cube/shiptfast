-- Migration: Add REASSIGN/VOIDED order flow, quote statuses, history, and guards

-- 1) Ensure order_status enum has REASSIGN and VOIDED
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'order_status' AND e.enumlabel = 'REASSIGN'
  ) THEN
    ALTER TYPE public.order_status ADD VALUE 'REASSIGN';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'order_status' AND e.enumlabel = 'VOIDED'
  ) THEN
    ALTER TYPE public.order_status ADD VALUE 'VOIDED';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Ensure quote_status enum has WITHDRAWN and REVOKED
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'quote_status' AND e.enumlabel = 'WITHDRAWN'
  ) THEN
    ALTER TYPE public.quote_status ADD VALUE 'WITHDRAWN';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'quote_status' AND e.enumlabel = 'REVOKED'
  ) THEN
    ALTER TYPE public.quote_status ADD VALUE 'REVOKED';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Ensure document_entity_type enum has ORDER_QUOTE
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'document_entity_type' AND e.enumlabel = 'ORDER_QUOTE'
  ) THEN
    ALTER TYPE public.document_entity_type ADD VALUE 'ORDER_QUOTE';
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) Add status_history column to orders to track admin interventions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'orders' AND column_name = 'status_history'
  ) THEN
    ALTER TABLE public.orders ADD COLUMN status_history jsonb NOT NULL DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- 5) Guard: prevent creating quotes when order is REASSIGN or VOIDED
CREATE OR REPLACE FUNCTION public.prevent_quote_insert_in_blocked_status()
RETURNS trigger AS $$
DECLARE
  v_status public.order_status;
BEGIN
  SELECT status INTO v_status FROM public.orders WHERE id = NEW.order_id;
  IF v_status IN ('REASSIGN', 'VOIDED') THEN
    RAISE EXCEPTION 'Cannot add quotes when order status is %', v_status;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_quote_insert_in_blocked_status ON public.quotes;
CREATE TRIGGER trg_prevent_quote_insert_in_blocked_status
  BEFORE INSERT ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_quote_insert_in_blocked_status();

-- 6) Admin functions for REASSIGN and VOIDED flows (DB-side operations only)
-- Reassign: set order REASSIGN, withdraw selected quote, reopen others, remove ratings, clear selected_quote_id,
-- and append to status_history. Do NOT touch storage here (handled in app layer).
CREATE OR REPLACE FUNCTION public.admin_reassign_order(
  p_order_id uuid,
  p_actor_user_id uuid,
  p_reason text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_order RECORD;
  v_selected_quote uuid;
  v_history_entry jsonb;
BEGIN
  SELECT o.* INTO v_order FROM public.orders o WHERE o.id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status IS DISTINCT FROM 'CLOSED' THEN
    RAISE EXCEPTION 'Order must be CLOSED to perform REASSIGN';
  END IF;

  v_selected_quote := v_order.selected_quote_id;

  -- Withdraw selected quote if present
  IF v_selected_quote IS NOT NULL THEN
    UPDATE public.quotes
    SET status = 'WITHDRAWN', updated_at = NOW()
    WHERE id = v_selected_quote;
  END IF;

  -- Re-open other quotes to ACTIVE
  UPDATE public.quotes
  SET status = 'ACTIVE', updated_at = NOW()
  WHERE order_id = p_order_id AND id IS DISTINCT FROM v_selected_quote;

  -- Remove ratings created for this order (company averages auto-update via triggers)
  DELETE FROM public.company_ratings WHERE order_id = p_order_id;

  -- Append status history
  v_history_entry := jsonb_build_object(
    'type', 'REASSIGN',
    'at', NOW(),
    'by_user_id', p_actor_user_id,
    'reason', COALESCE(p_reason, '')
  );

  UPDATE public.orders
  SET status = 'PENDING',
      selected_quote_id = NULL,
      status_history = COALESCE(status_history, '[]'::jsonb) || jsonb_build_array(v_history_entry),
      updated_at = NOW()
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Voided: set order VOIDED, revoke all quotes, remove ratings, clear selected_quote_id, append history
CREATE OR REPLACE FUNCTION public.admin_void_order(
  p_order_id uuid,
  p_actor_user_id uuid,
  p_reason text DEFAULT NULL
) RETURNS void AS $$
DECLARE
  v_order RECORD;
  v_history_entry jsonb;
BEGIN
  SELECT o.* INTO v_order FROM public.orders o WHERE o.id = p_order_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Order not found';
  END IF;

  IF v_order.status NOT IN ('CLOSED', 'REASSIGN') THEN
    RAISE EXCEPTION 'Order must be CLOSED or REASSIGN to VOID';
  END IF;

  -- Revoke all quotes for this order
  UPDATE public.quotes
  SET status = 'REVOKED', updated_at = NOW()
  WHERE order_id = p_order_id;

  -- Remove ratings created for this order
  DELETE FROM public.company_ratings WHERE order_id = p_order_id;

  -- Append status history
  v_history_entry := jsonb_build_object(
    'type', 'VOIDED',
    'at', NOW(),
    'by_user_id', p_actor_user_id,
    'reason', COALESCE(p_reason, '')
  );

  UPDATE public.orders
  SET status = 'VOIDED',
      selected_quote_id = NULL,
      status_history = COALESCE(status_history, '[]'::jsonb) || jsonb_build_array(v_history_entry),
      updated_at = NOW()
  WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7) Helper: delete FINAL_INVOICE document rows for a quote (DB only, not storage)
CREATE OR REPLACE FUNCTION public.delete_final_invoice_docs_for_quote(p_quote_id uuid)
RETURNS integer AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.documents d
  WHERE d.entity_type = 'ORDER_QUOTE'
    AND d.entity_id = p_quote_id
    AND (d.metadata->>'type') = 'FINAL_INVOICE';
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
