
-- =====================================================
-- EU-KONFORMES MITARBEITER-AUSKUNFTSSYSTEM - KOMPLETT
-- =====================================================

-- Enums erstellen (falls nicht existieren)
DO $$ BEGIN
  CREATE TYPE public.info_request_type AS ENUM (
    'salary_band_position',
    'salary_criteria',
    'career_progression',
    'pay_gap_category',
    'qualification_requirements'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.request_processing_status AS ENUM (
    'submitted', 'validating', 'approved', 'processing',
    'ready', 'viewed', 'expired', 'rejected', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.rejection_reason AS ENUM (
    'rate_limit_exceeded', 'insufficient_data', 'employee_not_found',
    'no_assignment', 'privacy_threshold', 'system_error'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Haupttabelle: Auskunftsanfragen
CREATE TABLE IF NOT EXISTS public.employee_info_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  requester_user_id UUID NOT NULL,
  requester_employee_id UUID REFERENCES public.employees(id),
  request_type public.info_request_type NOT NULL,
  request_number SERIAL,
  status public.request_processing_status NOT NULL DEFAULT 'submitted',
  rejection_reason public.rejection_reason,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ,
  viewed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  ip_address INET,
  user_agent TEXT,
  request_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indizes (nur wenn nicht existieren)
CREATE INDEX IF NOT EXISTS idx_emp_info_req_user ON public.employee_info_requests(requester_user_id);
CREATE INDEX IF NOT EXISTS idx_emp_info_req_status ON public.employee_info_requests(status);
CREATE INDEX IF NOT EXISTS idx_emp_info_req_company ON public.employee_info_requests(company_id);

-- Antwort-Tabelle
CREATE TABLE IF NOT EXISTS public.info_request_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES public.employee_info_requests(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  response_data JSONB NOT NULL,
  anonymization_applied JSONB NOT NULL DEFAULT '{"min_group_size": 5, "rounding_precision": 100}'::JSONB,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  generated_by TEXT NOT NULL DEFAULT 'system',
  response_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(request_id, version_number)
);

-- Rate-Limiting Tabelle
CREATE TABLE IF NOT EXISTS public.request_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  request_type public.info_request_type NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMPTZ NOT NULL DEFAULT date_trunc('month', now()),
  max_requests_per_month INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, company_id, request_type, window_start)
);

-- RLS aktivieren
ALTER TABLE public.employee_info_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.info_request_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.request_rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Employees view own requests" ON public.employee_info_requests;
CREATE POLICY "Employees view own requests"
  ON public.employee_info_requests FOR SELECT
  USING (requester_user_id = auth.uid());

DROP POLICY IF EXISTS "Employees create requests" ON public.employee_info_requests;
CREATE POLICY "Employees create requests"
  ON public.employee_info_requests FOR INSERT
  WITH CHECK (requester_user_id = auth.uid());

DROP POLICY IF EXISTS "System update requests" ON public.employee_info_requests;
CREATE POLICY "System update requests"
  ON public.employee_info_requests FOR UPDATE
  USING (true);

DROP POLICY IF EXISTS "HR view all requests" ON public.employee_info_requests;
CREATE POLICY "HR view all requests"
  ON public.employee_info_requests FOR SELECT
  USING (verify_tenant_access(company_id) AND has_any_permission(ARRAY['info_requests.view', 'audit.view']));

DROP POLICY IF EXISTS "View own responses" ON public.info_request_responses;
CREATE POLICY "View own responses"
  ON public.info_request_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.employee_info_requests req
    WHERE req.id = request_id AND req.requester_user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "System creates responses" ON public.info_request_responses;
CREATE POLICY "System creates responses"
  ON public.info_request_responses FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "View own rate limits" ON public.request_rate_limits;
CREATE POLICY "View own rate limits"
  ON public.request_rate_limits FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS "System manages rate limits" ON public.request_rate_limits;
CREATE POLICY "System manages rate limits"
  ON public.request_rate_limits FOR ALL USING (true) WITH CHECK (true);

-- Trigger
DROP TRIGGER IF EXISTS update_emp_info_requests_updated_at ON public.employee_info_requests;
CREATE TRIGGER update_emp_info_requests_updated_at
  BEFORE UPDATE ON public.employee_info_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rate_limits_updated_at ON public.request_rate_limits;
CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON public.request_rate_limits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Funktionen
CREATE OR REPLACE FUNCTION public.check_request_rate_limit(_request_type public.info_request_type)
RETURNS TABLE (allowed BOOLEAN, current_count INTEGER, max_allowed INTEGER, next_reset TIMESTAMPTZ)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _user_id UUID; _company_id UUID; _window_start TIMESTAMPTZ; _count INTEGER; _max INTEGER;
BEGIN
  _user_id := auth.uid();
  _company_id := get_user_company_id();
  _window_start := date_trunc('month', now());
  
  SELECT rrl.request_count, rrl.max_requests_per_month INTO _count, _max
  FROM public.request_rate_limits rrl
  WHERE rrl.user_id = _user_id AND rrl.company_id = _company_id
    AND rrl.request_type = _request_type AND rrl.window_start = _window_start;
  
  _count := COALESCE(_count, 0);
  _max := COALESCE(_max, 3);
  
  RETURN QUERY SELECT _count < _max, _count, _max, date_trunc('month', now()) + INTERVAL '1 month';
END;
$$;

CREATE OR REPLACE FUNCTION public.submit_info_request(
  _request_type public.info_request_type,
  _ip_address INET DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS TABLE (success BOOLEAN, request_id UUID, error_code TEXT, error_message TEXT)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  _user_id UUID; _company_id UUID; _employee_id UUID; _rate_check RECORD; _request_id UUID; _hash TEXT;
BEGIN
  _user_id := auth.uid();
  _company_id := get_user_company_id();
  
  SELECT e.id INTO _employee_id FROM public.employees e
  WHERE e.user_id = _user_id AND e.company_id = _company_id AND e.is_active = true LIMIT 1;
  
  IF _employee_id IS NULL THEN
    RETURN QUERY SELECT false, NULL::UUID, 'EMPLOYEE_NOT_FOUND'::TEXT, 'Kein aktiver Mitarbeiterdatensatz gefunden'::TEXT;
    RETURN;
  END IF;
  
  SELECT * INTO _rate_check FROM check_request_rate_limit(_request_type);
  IF NOT _rate_check.allowed THEN
    RETURN QUERY SELECT false, NULL::UUID, 'RATE_LIMIT_EXCEEDED'::TEXT,
      format('Max. Anfragen (%s/Monat) erreicht. Reset: %s', _rate_check.max_allowed, _rate_check.next_reset::DATE)::TEXT;
    RETURN;
  END IF;
  
  _hash := encode(sha256((_user_id::TEXT || _company_id::TEXT || _request_type::TEXT || now()::TEXT)::bytea), 'hex');
  
  INSERT INTO public.employee_info_requests (company_id, requester_user_id, requester_employee_id, request_type, request_hash)
  VALUES (_company_id, _user_id, _employee_id, _request_type, _hash) RETURNING id INTO _request_id;
  
  INSERT INTO public.request_rate_limits (user_id, company_id, request_type, request_count, window_start)
  VALUES (_user_id, _company_id, _request_type, 1, date_trunc('month', now()))
  ON CONFLICT (user_id, company_id, request_type, window_start)
  DO UPDATE SET request_count = request_rate_limits.request_count + 1, updated_at = now();
  
  PERFORM create_audit_log(_company_id, 'request_info'::audit_action, 'info_request'::audit_entity,
    _request_id, _request_type::TEXT, NULL, jsonb_build_object('request_type', _request_type));
  
  RETURN QUERY SELECT true, _request_id, NULL::TEXT, NULL::TEXT;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_my_info_requests()
RETURNS TABLE (
  id UUID, request_type public.info_request_type, request_type_label TEXT,
  status public.request_processing_status, status_label TEXT,
  submitted_at TIMESTAMPTZ, processed_at TIMESTAMPTZ, expires_at TIMESTAMPTZ,
  has_response BOOLEAN, rejection_reason public.rejection_reason
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT req.id, req.request_type,
    CASE req.request_type
      WHEN 'salary_band_position' THEN 'Position im Entgeltband'
      WHEN 'salary_criteria' THEN 'Kriterien der Gehaltsfestlegung'
      WHEN 'career_progression' THEN 'Aufstiegsmöglichkeiten'
      WHEN 'pay_gap_category' THEN 'Pay Gap in meiner Kategorie'
      WHEN 'qualification_requirements' THEN 'Qualifikationsanforderungen'
    END,
    req.status,
    CASE req.status
      WHEN 'submitted' THEN 'Eingereicht'
      WHEN 'validating' THEN 'Wird geprüft'
      WHEN 'processing' THEN 'Wird verarbeitet'
      WHEN 'ready' THEN 'Antwort bereit'
      WHEN 'viewed' THEN 'Eingesehen'
      WHEN 'expired' THEN 'Abgelaufen'
      WHEN 'rejected' THEN 'Abgelehnt'
      WHEN 'cancelled' THEN 'Storniert'
      ELSE 'Unbekannt'
    END,
    req.submitted_at, req.processed_at, req.expires_at,
    EXISTS (SELECT 1 FROM public.info_request_responses resp WHERE resp.request_id = req.id),
    req.rejection_reason
  FROM public.employee_info_requests req
  WHERE req.requester_user_id = auth.uid()
  ORDER BY req.submitted_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_info_request_response(_request_id UUID)
RETURNS TABLE (
  request_type public.info_request_type, request_type_label TEXT,
  response_data JSONB, generated_at TIMESTAMPTZ, expires_at TIMESTAMPTZ, anonymization_note TEXT
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE _request RECORD;
BEGIN
  SELECT req.request_type, req.expires_at, req.status, resp.response_data, resp.created_at AS response_created, resp.anonymization_applied
  INTO _request
  FROM public.employee_info_requests req
  LEFT JOIN public.info_request_responses resp ON resp.request_id = req.id
  WHERE req.id = _request_id AND req.requester_user_id = auth.uid() AND req.status IN ('ready', 'viewed');
  
  IF _request IS NULL THEN RETURN; END IF;
  
  UPDATE public.employee_info_requests SET status = 'viewed', viewed_at = now(), updated_at = now()
  WHERE id = _request_id AND status = 'ready';
  
  RETURN QUERY SELECT _request.request_type,
    CASE _request.request_type
      WHEN 'salary_band_position' THEN 'Position im Entgeltband'
      WHEN 'salary_criteria' THEN 'Kriterien der Gehaltsfestlegung'
      WHEN 'career_progression' THEN 'Aufstiegsmöglichkeiten'
      WHEN 'pay_gap_category' THEN 'Pay Gap in meiner Kategorie'
      WHEN 'qualification_requirements' THEN 'Qualifikationsanforderungen'
    END,
    _request.response_data, _request.response_created, _request.expires_at,
    'Daten gemäß EU-Richtlinie 2023/970 anonymisiert.';
END;
$$;

-- Permissions
INSERT INTO public.permissions (code, name, category, description) VALUES 
  ('info_requests.view', 'Auskunftsanfragen einsehen', 'info_requests', 'Alle Anfragen der Firma'),
  ('info_requests.process', 'Auskunftsanfragen bearbeiten', 'info_requests', 'Anfragen verarbeiten'),
  ('info_requests.create', 'Auskunftsanfragen stellen', 'info_requests', 'Eigene Anfragen erstellen')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_code) VALUES 
  ('admin', 'info_requests.view'), ('admin', 'info_requests.process'),
  ('hr_manager', 'info_requests.view'), ('hr_manager', 'info_requests.process'),
  ('employee', 'info_requests.create'), ('legal', 'info_requests.view'), ('auditor', 'info_requests.view')
ON CONFLICT DO NOTHING;

GRANT EXECUTE ON FUNCTION public.submit_info_request TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_request_rate_limit TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_my_info_requests TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_info_request_response TO authenticated;
