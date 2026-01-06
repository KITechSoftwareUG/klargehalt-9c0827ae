
-- =====================================================
-- ERWEITERTES AUDIT-SYSTEM MIT HASH-KETTE
-- Unveränderbar (Append-Only) mit Beweissicherung
-- =====================================================

-- Hash-Kette: Jeder Eintrag referenziert den vorherigen Hash
ALTER TABLE public.audit_logs 
  ADD COLUMN IF NOT EXISTS previous_hash TEXT,
  ADD COLUMN IF NOT EXISTS sequence_number BIGINT;

-- Sequence für aufsteigende Nummern (garantiert Reihenfolge)
CREATE SEQUENCE IF NOT EXISTS public.audit_sequence START 1;

-- Index für Hash-Kette und schnelle Suche
CREATE INDEX IF NOT EXISTS idx_audit_logs_sequence ON public.audit_logs(sequence_number);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- =====================================================
-- AUDIT-EXPORT TABELLE
-- Dokumentiert alle Exporte für Compliance
-- =====================================================

CREATE TABLE IF NOT EXISTS public.audit_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  exported_by UUID NOT NULL,
  exported_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Export-Details
  export_type TEXT NOT NULL, -- 'full', 'date_range', 'entity_type'
  format TEXT NOT NULL DEFAULT 'json', -- 'json', 'csv', 'pdf'
  
  -- Filter-Kriterien
  date_from TIMESTAMPTZ,
  date_to TIMESTAMPTZ,
  entity_types TEXT[], -- Gefilterte Entity-Typen
  actions TEXT[], -- Gefilterte Aktionen
  
  -- Ergebnis
  record_count INTEGER NOT NULL,
  file_hash TEXT NOT NULL, -- SHA-256 Hash des Exports
  
  -- Audit des Exports selbst
  ip_address INET,
  user_agent TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS für Export-Tabelle
ALTER TABLE public.audit_exports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View audit exports"
  ON public.audit_exports FOR SELECT
  USING (verify_tenant_access(company_id) AND has_permission('audit.export'));

CREATE POLICY "Create audit exports"
  ON public.audit_exports FOR INSERT
  WITH CHECK (verify_tenant_access(company_id) AND has_permission('audit.export'));

-- Keine Updates oder Deletes erlaubt
-- (kein Policy = kein Zugriff)

-- =====================================================
-- VERBESSERTE CREATE_AUDIT_LOG FUNKTION
-- Mit Hash-Kette für Integritätsprüfung
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_audit_log_v2(
  _company_id UUID,
  _action audit_action,
  _entity_type audit_entity,
  _entity_id UUID DEFAULT NULL,
  _entity_name TEXT DEFAULT NULL,
  _old_values JSONB DEFAULT NULL,
  _new_values JSONB DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id UUID;
  _user_email TEXT;
  _user_role TEXT;
  _log_id UUID;
  _sequence BIGINT;
  _previous_hash TEXT;
  _record_hash TEXT;
  _hash_input TEXT;
BEGIN
  _user_id := auth.uid();
  
  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;
  SELECT role::TEXT INTO _user_role FROM public.user_roles WHERE user_id = _user_id LIMIT 1;
  
  -- Hole Sequence-Nummer (atomar)
  _sequence := nextval('public.audit_sequence');
  
  -- Hole vorherigen Hash für die Kette
  SELECT record_hash INTO _previous_hash
  FROM public.audit_logs
  WHERE company_id = _company_id
  ORDER BY sequence_number DESC
  LIMIT 1;
  
  -- Falls erster Eintrag, verwende Genesis-Hash
  _previous_hash := COALESCE(_previous_hash, 'GENESIS');
  
  -- Erstelle Hash-Input (alle relevanten Felder)
  _hash_input := concat_ws('|',
    _sequence::TEXT,
    _company_id::TEXT,
    _user_id::TEXT,
    _action::TEXT,
    _entity_type::TEXT,
    COALESCE(_entity_id::TEXT, ''),
    COALESCE(_entity_name, ''),
    COALESCE(_old_values::TEXT, ''),
    COALESCE(_new_values::TEXT, ''),
    now()::TEXT,
    _previous_hash
  );
  
  -- Berechne SHA-256 Hash
  _record_hash := encode(sha256(_hash_input::bytea), 'hex');
  
  -- Insert mit Hash-Kette
  INSERT INTO public.audit_logs (
    company_id, user_id, user_email, user_role, action, entity_type,
    entity_id, entity_name, old_values, new_values, metadata,
    record_hash, previous_hash, sequence_number
  ) VALUES (
    _company_id, _user_id, _user_email, COALESCE(_user_role, 'unknown'), 
    _action, _entity_type, _entity_id, _entity_name, 
    _old_values, _new_values, _metadata,
    _record_hash, _previous_hash, _sequence
  ) RETURNING id INTO _log_id;
  
  RETURN _log_id;
END;
$$;

-- =====================================================
-- HASH-KETTE VERIFIZIERUNG
-- Prüft Integrität aller Audit-Einträge
-- =====================================================

CREATE OR REPLACE FUNCTION public.verify_audit_chain(
  _company_id UUID,
  _from_sequence BIGINT DEFAULT NULL,
  _to_sequence BIGINT DEFAULT NULL
)
RETURNS TABLE (
  is_valid BOOLEAN,
  checked_records INTEGER,
  first_invalid_sequence BIGINT,
  first_invalid_id UUID,
  error_message TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _record RECORD;
  _expected_hash TEXT;
  _hash_input TEXT;
  _prev_hash TEXT := 'GENESIS';
  _checked INTEGER := 0;
BEGIN
  -- Permission Check
  IF NOT has_permission('audit.view') THEN
    RAISE EXCEPTION 'Keine Berechtigung für Audit-Verifizierung';
  END IF;
  
  FOR _record IN
    SELECT *
    FROM public.audit_logs
    WHERE company_id = _company_id
      AND (_from_sequence IS NULL OR sequence_number >= _from_sequence)
      AND (_to_sequence IS NULL OR sequence_number <= _to_sequence)
    ORDER BY sequence_number ASC
  LOOP
    _checked := _checked + 1;
    
    -- Prüfe previous_hash
    IF _record.previous_hash IS NOT NULL AND _record.previous_hash != _prev_hash THEN
      RETURN QUERY SELECT 
        false, _checked, _record.sequence_number, _record.id,
        'Previous hash mismatch - mögliche Manipulation oder fehlende Einträge';
      RETURN;
    END IF;
    
    -- Berechne erwarteten Hash
    _hash_input := concat_ws('|',
      _record.sequence_number::TEXT,
      _record.company_id::TEXT,
      _record.user_id::TEXT,
      _record.action::TEXT,
      _record.entity_type::TEXT,
      COALESCE(_record.entity_id::TEXT, ''),
      COALESCE(_record.entity_name, ''),
      COALESCE(_record.old_values::TEXT, ''),
      COALESCE(_record.new_values::TEXT, ''),
      _record.created_at::TEXT,
      COALESCE(_record.previous_hash, 'GENESIS')
    );
    
    _expected_hash := encode(sha256(_hash_input::bytea), 'hex');
    
    -- Vergleiche mit gespeichertem Hash
    IF _record.record_hash != _expected_hash THEN
      RETURN QUERY SELECT 
        false, _checked, _record.sequence_number, _record.id,
        'Record hash mismatch - Daten wurden möglicherweise manipuliert';
      RETURN;
    END IF;
    
    _prev_hash := _record.record_hash;
  END LOOP;
  
  -- Alle gültig
  RETURN QUERY SELECT true, _checked, NULL::BIGINT, NULL::UUID, NULL::TEXT;
END;
$$;

-- =====================================================
-- AUDIT-LOG STATISTIKEN
-- =====================================================

CREATE OR REPLACE FUNCTION public.get_audit_statistics(
  _company_id UUID,
  _days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_records BIGINT,
  records_by_action JSONB,
  records_by_entity JSONB,
  records_by_user JSONB,
  top_users JSONB,
  daily_activity JSONB
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT verify_tenant_access(_company_id) OR NOT has_permission('audit.view') THEN
    RAISE EXCEPTION 'Keine Berechtigung';
  END IF;
  
  RETURN QUERY
  WITH filtered_logs AS (
    SELECT * FROM public.audit_logs
    WHERE company_id = _company_id
      AND created_at >= now() - (_days || ' days')::INTERVAL
  ),
  by_action AS (
    SELECT jsonb_object_agg(action, cnt) AS data
    FROM (SELECT action::TEXT, COUNT(*) AS cnt FROM filtered_logs GROUP BY action) t
  ),
  by_entity AS (
    SELECT jsonb_object_agg(entity_type, cnt) AS data
    FROM (SELECT entity_type::TEXT, COUNT(*) AS cnt FROM filtered_logs GROUP BY entity_type) t
  ),
  by_user AS (
    SELECT jsonb_object_agg(COALESCE(user_email, 'system'), cnt) AS data
    FROM (SELECT user_email, COUNT(*) AS cnt FROM filtered_logs GROUP BY user_email ORDER BY cnt DESC LIMIT 10) t
  ),
  daily AS (
    SELECT jsonb_agg(jsonb_build_object('date', day, 'count', cnt) ORDER BY day) AS data
    FROM (
      SELECT date_trunc('day', created_at)::DATE AS day, COUNT(*) AS cnt 
      FROM filtered_logs GROUP BY 1
    ) t
  )
  SELECT 
    (SELECT COUNT(*) FROM filtered_logs),
    (SELECT data FROM by_action),
    (SELECT data FROM by_entity),
    (SELECT data FROM by_user),
    (SELECT data FROM by_user), -- Gleiche Daten für top_users
    (SELECT data FROM daily);
END;
$$;

-- =====================================================
-- AUDIT-EXPORT FUNKTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.create_audit_export(
  _export_type TEXT,
  _format TEXT DEFAULT 'json',
  _date_from TIMESTAMPTZ DEFAULT NULL,
  _date_to TIMESTAMPTZ DEFAULT NULL,
  _entity_types TEXT[] DEFAULT NULL,
  _actions TEXT[] DEFAULT NULL
)
RETURNS TABLE (
  export_id UUID,
  record_count INTEGER,
  data JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _company_id UUID;
  _export_id UUID;
  _records JSONB;
  _count INTEGER;
  _file_hash TEXT;
BEGIN
  _company_id := get_user_company_id();
  
  IF NOT has_permission('audit.export') THEN
    RAISE EXCEPTION 'Keine Berechtigung für Audit-Export';
  END IF;
  
  -- Sammle Audit-Daten
  SELECT jsonb_agg(row_to_json(al.*) ORDER BY al.sequence_number), COUNT(*)
  INTO _records, _count
  FROM public.audit_logs al
  WHERE al.company_id = _company_id
    AND (_date_from IS NULL OR al.created_at >= _date_from)
    AND (_date_to IS NULL OR al.created_at <= _date_to)
    AND (_entity_types IS NULL OR al.entity_type::TEXT = ANY(_entity_types))
    AND (_actions IS NULL OR al.action::TEXT = ANY(_actions));
  
  -- Berechne Hash des Exports
  _file_hash := encode(sha256(COALESCE(_records::TEXT, '')::bytea), 'hex');
  
  -- Speichere Export-Metadaten
  INSERT INTO public.audit_exports (
    company_id, exported_by, export_type, format,
    date_from, date_to, entity_types, actions,
    record_count, file_hash
  ) VALUES (
    _company_id, auth.uid(), _export_type, _format,
    _date_from, _date_to, _entity_types, _actions,
    _count, _file_hash
  ) RETURNING id INTO _export_id;
  
  -- Log den Export selbst
  PERFORM create_audit_log_v2(
    _company_id, 'export'::audit_action, 'report'::audit_entity,
    _export_id, 'Audit Export',
    NULL, NULL,
    jsonb_build_object(
      'export_type', _export_type,
      'format', _format,
      'record_count', _count,
      'date_range', jsonb_build_object('from', _date_from, 'to', _date_to)
    )
  );
  
  RETURN QUERY SELECT 
    _export_id,
    _count,
    jsonb_build_object(
      'export_id', _export_id,
      'exported_at', now(),
      'file_hash', _file_hash,
      'record_count', _count,
      'records', _records
    );
END;
$$;

-- =====================================================
-- LOGIN-TRACKING VERBESSERUNG
-- =====================================================

CREATE OR REPLACE FUNCTION public.log_login_v2(
  _email TEXT,
  _success BOOLEAN,
  _failure_reason TEXT DEFAULT NULL,
  _ip_address INET DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _log_id UUID;
  _user_id UUID;
  _company_id UUID;
BEGIN
  -- Speichere in login_attempts
  INSERT INTO public.login_attempts (email, ip_address, user_agent, success, failure_reason)
  VALUES (_email, _ip_address, _user_agent, _success, _failure_reason)
  RETURNING id INTO _log_id;
  
  -- Bei erfolgreichem Login: Audit-Log erstellen
  IF _success THEN
    SELECT u.id INTO _user_id FROM auth.users u WHERE u.email = _email;
    
    IF _user_id IS NOT NULL THEN
      SELECT p.company_id INTO _company_id 
      FROM public.profiles p WHERE p.user_id = _user_id;
      
      IF _company_id IS NOT NULL THEN
        PERFORM create_audit_log_v2(
          _company_id, 'login'::audit_action, 'user'::audit_entity,
          _user_id, _email,
          NULL, NULL,
          jsonb_build_object(
            'ip_address', _ip_address::TEXT,
            'user_agent', _user_agent,
            'login_attempt_id', _log_id
          )
        );
      END IF;
    END IF;
  END IF;
  
  RETURN _log_id;
END;
$$;

-- =====================================================
-- PERMISSIONS
-- =====================================================

INSERT INTO public.permissions (code, name, category, description)
VALUES 
  ('audit.export', 'Audit-Logs exportieren', 'audit', 'Audit-Daten als JSON/CSV exportieren'),
  ('audit.verify', 'Audit-Integrität prüfen', 'audit', 'Hash-Kette verifizieren')
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.role_permissions (role, permission_code)
VALUES 
  ('admin', 'audit.export'),
  ('admin', 'audit.verify'),
  ('auditor', 'audit.export'),
  ('auditor', 'audit.verify'),
  ('legal', 'audit.export')
ON CONFLICT DO NOTHING;

-- GRANTS
GRANT EXECUTE ON FUNCTION public.create_audit_log_v2 TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_audit_chain TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_audit_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_audit_export TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_login_v2 TO authenticated;
