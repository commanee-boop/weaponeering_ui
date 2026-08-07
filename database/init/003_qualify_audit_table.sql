CREATE OR REPLACE FUNCTION app.write_audit_log()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
    affected_row_id uuid;
BEGIN
    affected_row_id := COALESCE(NEW.id, OLD.id);

    INSERT INTO app.audit_logs (
        table_name,
        row_id,
        operation,
        actor,
        old_data,
        new_data
    )
    VALUES (
        TG_TABLE_NAME,
        affected_row_id,
        TG_OP,
        NULLIF(current_setting('app.actor', true), ''),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) END
    );

    RETURN COALESCE(NEW, OLD);
END;
$$;
