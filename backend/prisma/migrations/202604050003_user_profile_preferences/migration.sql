ALTER TABLE user_profiles
  ADD COLUMN avatar_storage_key TEXT,
  ADD COLUMN avatar_metadata JSONB,
  ADD COLUMN profile_metadata JSONB;

CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  in_app_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  push_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_marketing_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  email_product_updates_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  email_security_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  notification_topics JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
