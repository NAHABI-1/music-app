CREATE TYPE auth_session_status AS ENUM ('ACTIVE', 'REVOKED', 'EXPIRED');

CREATE TABLE auth_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(190) NOT NULL,
  refresh_token_hash CHAR(64),
  refresh_token_expires_at TIMESTAMPTZ,
  user_agent TEXT,
  ip_address VARCHAR(64),
  status auth_session_status NOT NULL DEFAULT 'ACTIVE',
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_sessions_user_status ON auth_sessions(user_id, status);
CREATE INDEX idx_auth_sessions_status_expires ON auth_sessions(status, expires_at);
