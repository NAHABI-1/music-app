CREATE TYPE playback_session_status AS ENUM ('ACTIVE', 'PAUSED', 'ENDED', 'EXPIRED', 'ABORTED');
CREATE TYPE playback_quality AS ENUM ('AUTO', 'LOW', 'MEDIUM', 'HIGH', 'LOSSLESS');

CREATE TABLE playback_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  song_id UUID NOT NULL,
  device_session_id UUID,
  quality playback_quality NOT NULL DEFAULT 'AUTO',
  low_data_mode BOOLEAN NOT NULL DEFAULT FALSE,
  playback_source playback_source NOT NULL DEFAULT 'STREAM',
  delivery_method VARCHAR(40) NOT NULL DEFAULT 'SIGNED_URL',
  signed_url_expires_at TIMESTAMPTZ,
  resume_from_secs INTEGER NOT NULL DEFAULT 0,
  last_position_secs INTEGER NOT NULL DEFAULT 0,
  max_position_secs INTEGER NOT NULL DEFAULT 0,
  status playback_session_status NOT NULL DEFAULT 'ACTIVE',
  metadata JSONB,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_heartbeat_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT fk_playback_sessions_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_playback_sessions_song FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE RESTRICT,
  CONSTRAINT fk_playback_sessions_device_session FOREIGN KEY (device_session_id) REFERENCES device_sessions(id) ON DELETE SET NULL
);

CREATE INDEX idx_playback_sessions_user_status_updated ON playback_sessions(user_id, status, updated_at DESC);
CREATE INDEX idx_playback_sessions_song_created ON playback_sessions(song_id, created_at DESC);
CREATE INDEX idx_playback_sessions_device_session ON playback_sessions(device_session_id);
