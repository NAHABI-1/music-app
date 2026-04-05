CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TYPE user_role AS ENUM ('USER', 'ADMIN');
CREATE TYPE user_status AS ENUM ('PENDING', 'ACTIVE', 'SUSPENDED', 'DELETED');
CREATE TYPE artist_status AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE album_status AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE song_status AS ENUM ('PROCESSING', 'READY', 'BLOCKED', 'DELETED');
CREATE TYPE rights_status AS ENUM ('PENDING', 'OWNED', 'AUTHORIZED', 'REJECTED');
CREATE TYPE upload_status AS ENUM ('QUEUED', 'SCANNING', 'PROCESSING', 'COMPLETED', 'FAILED', 'REJECTED');
CREATE TYPE playlist_visibility AS ENUM ('PRIVATE', 'UNLISTED', 'PUBLIC');
CREATE TYPE playlist_status AS ENUM ('ACTIVE', 'ARCHIVED', 'DELETED');
CREATE TYPE playback_source AS ENUM ('STREAM', 'OFFLINE', 'CACHE');
CREATE TYPE offline_download_status AS ENUM ('QUEUED', 'DOWNLOADING', 'READY', 'EXPIRED', 'FAILED', 'DELETED');
CREATE TYPE subscription_status AS ENUM ('TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELED', 'EXPIRED');
CREATE TYPE plan_interval AS ENUM ('MONTHLY', 'YEARLY', 'LIFETIME');
CREATE TYPE payment_status AS ENUM ('PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED', 'CHARGEBACK');
CREATE TYPE promo_discount_type AS ENUM ('PERCENT', 'FIXED');
CREATE TYPE ad_campaign_status AS ENUM ('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED');
CREATE TYPE notification_channel AS ENUM ('IN_APP', 'PUSH', 'EMAIL', 'SYSTEM');
CREATE TYPE notification_status AS ENUM ('QUEUED', 'SENT', 'FAILED', 'READ', 'DISMISSED');
CREATE TYPE device_platform AS ENUM ('ANDROID', 'IOS', 'WEB', 'DESKTOP', 'UNKNOWN');
CREATE TYPE device_session_status AS ENUM ('ACTIVE', 'REVOKED');
CREATE TYPE analytics_source AS ENUM ('MOBILE', 'BACKEND', 'ADMIN');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(320) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'USER',
  status user_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX idx_users_status ON users(status);

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  display_name VARCHAR(140) NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  country_code CHAR(2),
  date_of_birth DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE artists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(180) NOT NULL,
  slug VARCHAR(200) NOT NULL UNIQUE,
  bio TEXT,
  status artist_status NOT NULL DEFAULT 'ACTIVE',
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_artists_status ON artists(status);

CREATE TABLE albums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE RESTRICT,
  title VARCHAR(240) NOT NULL,
  slug VARCHAR(260) NOT NULL,
  release_date DATE,
  status album_status NOT NULL DEFAULT 'DRAFT',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_albums_artist_slug UNIQUE (artist_id, slug)
);
CREATE INDEX idx_albums_artist_status ON albums(artist_id, status);

CREATE TABLE songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES artists(id) ON DELETE RESTRICT,
  album_id UUID REFERENCES albums(id) ON DELETE SET NULL,
  uploaded_by_user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title VARCHAR(260) NOT NULL,
  slug VARCHAR(300) NOT NULL,
  genre VARCHAR(120),
  track_number INTEGER,
  duration_seconds INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  checksum_sha256 CHAR(64) NOT NULL,
  rights_status rights_status NOT NULL DEFAULT 'PENDING',
  status song_status NOT NULL DEFAULT 'PROCESSING',
  is_explicit BOOLEAN NOT NULL DEFAULT FALSE,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_songs_owner_slug UNIQUE (uploaded_by_user_id, slug)
);
CREATE INDEX idx_songs_artist_status ON songs(artist_id, status);
CREATE INDEX idx_songs_rights_status ON songs(rights_status, status);

CREATE TABLE uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  song_id UUID REFERENCES songs(id) ON DELETE SET NULL,
  original_filename VARCHAR(320) NOT NULL,
  mime_type VARCHAR(120) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  storage_key TEXT,
  status upload_status NOT NULL DEFAULT 'QUEUED',
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_uploads_user_status ON uploads(user_id, status);

CREATE TABLE playlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(180) NOT NULL,
  description TEXT,
  visibility playlist_visibility NOT NULL DEFAULT 'PRIVATE',
  status playlist_status NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_playlists_owner_status ON playlists(user_id, status);

CREATE TABLE playlist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE RESTRICT,
  position INTEGER NOT NULL,
  added_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_playlist_items_playlist_position UNIQUE (playlist_id, position)
);
CREATE INDEX idx_playlist_items_song ON playlist_items(song_id);

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_favorites_user_song UNIQUE (user_id, song_id)
);

CREATE TABLE recent_plays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE RESTRICT,
  playback_source playback_source NOT NULL,
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  play_duration_secs INTEGER
);
CREATE INDEX idx_recent_plays_user_played_at ON recent_plays(user_id, played_at);
CREATE INDEX idx_recent_plays_song_played_at ON recent_plays(song_id, played_at);

CREATE TABLE device_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  device_id VARCHAR(190) NOT NULL,
  platform device_platform NOT NULL DEFAULT 'UNKNOWN',
  app_version VARCHAR(40),
  push_token TEXT,
  ip_address VARCHAR(64),
  user_agent TEXT,
  status device_session_status NOT NULL DEFAULT 'ACTIVE',
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_device_sessions_user_device UNIQUE (user_id, device_id)
);
CREATE INDEX idx_device_sessions_status_last_seen ON device_sessions(status, last_seen_at);

CREATE TABLE offline_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  song_id UUID NOT NULL REFERENCES songs(id) ON DELETE CASCADE,
  device_session_id UUID REFERENCES device_sessions(id) ON DELETE SET NULL,
  local_path TEXT NOT NULL,
  encryption_key_id VARCHAR(160),
  status offline_download_status NOT NULL DEFAULT 'QUEUED',
  expires_at TIMESTAMPTZ,
  downloaded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_offline_downloads_user_song_device UNIQUE (user_id, song_id, device_session_id)
);
CREATE INDEX idx_offline_downloads_status_expires ON offline_downloads(status, expires_at);

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(80) NOT NULL UNIQUE,
  name VARCHAR(120) NOT NULL,
  description TEXT,
  interval plan_interval NOT NULL,
  price_cents INTEGER NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_plans_active ON plans(is_active);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
  status subscription_status NOT NULL DEFAULT 'TRIALING',
  starts_at TIMESTAMPTZ NOT NULL,
  current_period_start TIMESTAMPTZ NOT NULL,
  current_period_end TIMESTAMPTZ NOT NULL,
  cancel_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  external_ref VARCHAR(140),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_subscriptions_user_status ON subscriptions(user_id, status);

CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(64) NOT NULL UNIQUE,
  description TEXT,
  discount_type promo_discount_type NOT NULL,
  discount_value NUMERIC(12,2) NOT NULL,
  max_redemptions INTEGER,
  redeemed_count INTEGER NOT NULL DEFAULT 0,
  starts_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_promo_codes_active_expires ON promo_codes(is_active, expires_at);

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL,
  amount_cents INTEGER NOT NULL,
  currency CHAR(3) NOT NULL DEFAULT 'USD',
  provider VARCHAR(80) NOT NULL,
  provider_ref VARCHAR(140),
  status payment_status NOT NULL DEFAULT 'PENDING',
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_payments_user_status ON payments(user_id, status);
CREATE INDEX idx_payments_provider_ref ON payments(provider, provider_ref);

CREATE TABLE ad_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(180) NOT NULL,
  status ad_campaign_status NOT NULL DEFAULT 'DRAFT',
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  budget_cents INTEGER,
  impressions_target INTEGER,
  clicks_target INTEGER,
  created_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_ad_campaigns_status_starts ON ad_campaigns(status, starts_at);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(80) NOT NULL,
  title VARCHAR(220) NOT NULL,
  body TEXT NOT NULL,
  channel notification_channel NOT NULL DEFAULT 'IN_APP',
  status notification_status NOT NULL DEFAULT 'QUEUED',
  metadata JSONB,
  scheduled_for TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_user_status ON notifications(user_id, status);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);

CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  device_session_id UUID REFERENCES device_sessions(id) ON DELETE SET NULL,
  event_name VARCHAR(140) NOT NULL,
  event_category VARCHAR(100),
  source analytics_source NOT NULL,
  properties JSONB,
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_analytics_events_name_time ON analytics_events(event_name, event_timestamp);
CREATE INDEX idx_analytics_events_category_time ON analytics_events(event_category, event_timestamp);
CREATE INDEX idx_analytics_events_user_time ON analytics_events(user_id, event_timestamp);

CREATE TABLE storage_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  snapshot_date DATE NOT NULL,
  total_bytes BIGINT NOT NULL DEFAULT 0,
  uploaded_bytes BIGINT NOT NULL DEFAULT 0,
  cached_bytes BIGINT NOT NULL DEFAULT 0,
  downloaded_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_storage_usage_user_snapshot_date UNIQUE (user_id, snapshot_date)
);
CREATE INDEX idx_storage_usage_snapshot_date ON storage_usage(snapshot_date);
