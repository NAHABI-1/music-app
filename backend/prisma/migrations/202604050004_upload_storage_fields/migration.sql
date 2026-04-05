ALTER TABLE uploads
  ADD COLUMN uploaded_bytes BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN upload_progress_pct INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN legal_attestation_accepted BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN storage_etag VARCHAR(200),
  ADD COLUMN signed_upload_expires_at TIMESTAMPTZ,
  ADD COLUMN metadata_extracted JSONB;

CREATE INDEX idx_uploads_user_created_at ON uploads(user_id, created_at DESC);
