SET search_path TO app, public;

CREATE SEQUENCE target_record_code_seq START WITH 1;

CREATE OR REPLACE FUNCTION next_target_record_code()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
    SELECT 'TGT - ' || lpad(sequence_value::text, greatest(3, length(sequence_value::text)), '0')
    FROM (SELECT nextval('app.target_record_code_seq') AS sequence_value) AS sequence;
$$;

CREATE TABLE app_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username citext NOT NULL UNIQUE,
    display_name text NOT NULL,
    role text NOT NULL DEFAULT 'viewer'
        CHECK (role IN ('viewer', 'analyst', 'admin')),
    is_active boolean NOT NULL DEFAULT true,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE analysis_records (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    record_code text NOT NULL UNIQUE DEFAULT next_target_record_code(),
    target_name text,
    target_source text,
    target_type text,
    target_priority text NOT NULL DEFAULT 'unassigned'
        CHECK (target_priority IN ('red', 'orange', 'green', 'unassigned')),
    structure_type text,
    strength_level text,
    target_details text,
    desired_effect text,
    latitude double precision
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),
    longitude double precision
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180),
    location geography(Point, 4326)
        GENERATED ALWAYS AS (
            CASE
                WHEN latitude IS NULL OR longitude IS NULL THEN NULL
                ELSE ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography
            END
        ) STORED,
    pk numeric(5, 4) CHECK (pk IS NULL OR pk BETWEEN 0 AND 1),
    cep_meters numeric(12, 3) CHECK (cep_meters IS NULL OR cep_meters >= 0),
    height_msl_ft numeric(12, 2),
    recorder_name text,
    summary jsonb NOT NULL DEFAULT '{}'::jsonb,
    raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    deleted_at timestamptz
);

ALTER SEQUENCE target_record_code_seq OWNED BY analysis_records.record_code;

CREATE INDEX analysis_records_location_gix
    ON analysis_records USING gist (location);
CREATE INDEX analysis_records_created_at_idx
    ON analysis_records (created_at DESC);
CREATE INDEX analysis_records_target_type_idx
    ON analysis_records (target_type);
CREATE INDEX analysis_records_summary_gin
    ON analysis_records USING gin (summary);

CREATE TABLE attachments (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_record_id uuid NOT NULL
        REFERENCES analysis_records(id) ON DELETE CASCADE,
    object_key text NOT NULL UNIQUE,
    original_filename text NOT NULL,
    content_type text NOT NULL,
    size_bytes bigint NOT NULL CHECK (size_bytes >= 0),
    checksum_sha256 text,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX attachments_analysis_record_id_idx
    ON attachments (analysis_record_id);

CREATE TABLE reports (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    analysis_record_id uuid NOT NULL
        REFERENCES analysis_records(id) ON DELETE CASCADE,
    format text NOT NULL CHECK (format IN ('pdf', 'docx')),
    object_key text NOT NULL UNIQUE,
    generated_by uuid REFERENCES app_users(id) ON DELETE SET NULL,
    generated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX reports_analysis_record_id_idx
    ON reports (analysis_record_id);

CREATE TABLE audit_logs (
    id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    table_name text NOT NULL,
    row_id uuid,
    operation text NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    actor text,
    old_data jsonb,
    new_data jsonb,
    occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX audit_logs_row_lookup_idx
    ON audit_logs (table_name, row_id, occurred_at DESC);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER app_users_set_updated_at
BEFORE UPDATE ON app_users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER analysis_records_set_updated_at
BEFORE UPDATE ON analysis_records
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE OR REPLACE FUNCTION write_audit_log()
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

CREATE TRIGGER analysis_records_audit
AFTER INSERT OR UPDATE OR DELETE ON analysis_records
FOR EACH ROW EXECUTE FUNCTION write_audit_log();
