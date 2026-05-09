-- Legacy audit helper receives auth.uid() as UUID, while Logto-backed
-- user_roles.user_id is TEXT. Cast the UUID to TEXT for role lookup so audited
-- service-role writes do not fail with text = uuid operator errors.

CREATE OR REPLACE FUNCTION public.create_audit_log(
  _company_id UUID,
  _action audit_action,
  _entity_type audit_entity,
  _entity_id UUID DEFAULT NULL,
  _entity_name TEXT DEFAULT NULL,
  _old_values JSONB DEFAULT NULL,
  _new_values JSONB DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _user_email TEXT;
  _user_role TEXT;
  _log_id UUID;
  _record_hash TEXT;
BEGIN
  _user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID);

  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;
  SELECT role::TEXT INTO _user_role FROM public.user_roles WHERE user_id = _user_id::TEXT LIMIT 1;

  _record_hash := encode(
    sha256(
      (_company_id::TEXT || _user_id::TEXT || _action::TEXT || _entity_type::TEXT ||
       COALESCE(_entity_id::TEXT, '') || now()::TEXT)::bytea
    ),
    'hex'
  );

  INSERT INTO public.audit_logs (
    company_id, user_id, user_email, user_role, action, entity_type,
    entity_id, entity_name, old_values, new_values, metadata, record_hash
  ) VALUES (
    _company_id, _user_id, COALESCE(_user_email, 'system@klargehalt.local'), COALESCE(_user_role, 'system'), _action, _entity_type,
    _entity_id, _entity_name, _old_values, _new_values, _metadata, _record_hash
  ) RETURNING id INTO _log_id;

  RETURN _log_id;
END;
$$;

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
  _user_id := COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::UUID);

  SELECT email INTO _user_email FROM auth.users WHERE id = _user_id;
  SELECT role::TEXT INTO _user_role FROM public.user_roles WHERE user_id = _user_id::TEXT LIMIT 1;

  _sequence := nextval('public.audit_sequence');

  SELECT record_hash INTO _previous_hash
  FROM public.audit_logs
  WHERE company_id = _company_id
  ORDER BY sequence_number DESC
  LIMIT 1;

  _previous_hash := COALESCE(_previous_hash, 'GENESIS');

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

  _record_hash := encode(sha256(_hash_input::bytea), 'hex');

  INSERT INTO public.audit_logs (
    company_id, user_id, user_email, user_role, action, entity_type,
    entity_id, entity_name, old_values, new_values, metadata,
    record_hash, previous_hash, sequence_number
  ) VALUES (
    _company_id, _user_id, COALESCE(_user_email, 'system@klargehalt.local'), COALESCE(_user_role, 'system'),
    _action, _entity_type, _entity_id, _entity_name,
    _old_values, _new_values, _metadata,
    _record_hash, _previous_hash, _sequence
  ) RETURNING id INTO _log_id;

  RETURN _log_id;
END;
$$;
