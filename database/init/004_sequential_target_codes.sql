BEGIN;

CREATE SEQUENCE IF NOT EXISTS app.target_record_code_seq START WITH 1;

CREATE OR REPLACE FUNCTION app.next_target_record_code()
RETURNS text
LANGUAGE sql
VOLATILE
AS $$
    SELECT 'TGT - ' || lpad(sequence_value::text, greatest(3, length(sequence_value::text)), '0')
    FROM (SELECT nextval('app.target_record_code_seq') AS sequence_value) AS sequence;
$$;

WITH numbered_records AS (
    SELECT
        id,
        row_number() OVER (ORDER BY created_at, id) AS sequence_number
    FROM app.analysis_records
)
UPDATE app.analysis_records AS record
SET record_code = 'TGT - ' || lpad(
    numbered_records.sequence_number::text,
    greatest(3, length(numbered_records.sequence_number::text)),
    '0'
)
FROM numbered_records
WHERE record.id = numbered_records.id;

SELECT setval(
    'app.target_record_code_seq',
    greatest((SELECT count(*) + 1 FROM app.analysis_records), 1),
    false
);

ALTER TABLE app.analysis_records
    ALTER COLUMN record_code SET DEFAULT app.next_target_record_code(),
    ALTER COLUMN record_code SET NOT NULL;

ALTER SEQUENCE app.target_record_code_seq
    OWNED BY app.analysis_records.record_code;

COMMIT;
