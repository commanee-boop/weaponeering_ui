BEGIN;

ALTER TABLE app.attachments
    ADD COLUMN IF NOT EXISTS attachment_type text;

UPDATE app.attachments
SET attachment_type = 'target_image'
WHERE attachment_type IS NULL;

ALTER TABLE app.attachments
    ALTER COLUMN attachment_type SET DEFAULT 'target_image',
    ALTER COLUMN attachment_type SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'app.attachments'::regclass
          AND conname = 'attachments_attachment_type_check'
    ) THEN
        ALTER TABLE app.attachments
            ADD CONSTRAINT attachments_attachment_type_check
            CHECK (attachment_type IN ('target_image', 'coordinate_map'));
    END IF;
END;
$$;

CREATE UNIQUE INDEX IF NOT EXISTS attachments_record_type_uidx
    ON app.attachments (analysis_record_id, attachment_type);

COMMIT;
