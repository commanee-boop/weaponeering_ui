BEGIN;

ALTER TABLE app.analysis_records
    DROP CONSTRAINT IF EXISTS analysis_records_record_code_key;

ALTER TABLE app.analysis_records
    ADD CONSTRAINT analysis_records_record_code_key
    UNIQUE (record_code) DEFERRABLE INITIALLY IMMEDIATE;

CREATE OR REPLACE FUNCTION app.resequence_target_record_codes()
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
    record_count bigint;
BEGIN
    -- Prevent concurrent inserts/deletes while record codes are being reassigned.
    LOCK TABLE app.analysis_records IN SHARE ROW EXCLUSIVE MODE;
    SET CONSTRAINTS app.analysis_records_record_code_key DEFERRED;

    WITH numbered_records AS (
        SELECT
            id,
            row_number() OVER (
                ORDER BY
                    CASE
                        WHEN record_code ~ '^TGT - [0-9]+$'
                            THEN substring(record_code FROM '([0-9]+)$')::bigint
                    END ASC NULLS LAST,
                    created_at ASC,
                    id ASC
            ) AS sequence_number
        FROM app.analysis_records
    ),
    desired_codes AS (
        SELECT
            id,
            'TGT - ' || lpad(
                sequence_number::text,
                greatest(3, length(sequence_number::text)),
                '0'
            ) AS record_code
        FROM numbered_records
    )
    UPDATE app.analysis_records AS record
    SET record_code = desired_codes.record_code
    FROM desired_codes
    WHERE record.id = desired_codes.id
      AND record.record_code IS DISTINCT FROM desired_codes.record_code;

    SELECT count(*) INTO record_count
    FROM app.analysis_records;

    PERFORM setval(
        'app.target_record_code_seq',
        greatest(record_count + 1, 1),
        false
    );
END;
$$;

COMMIT;
