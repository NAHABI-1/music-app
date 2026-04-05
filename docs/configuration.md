# Configuration System

CloudTune backend uses a typed, validated environment loader with sectioned configuration.

## Loader

- Source file: backend/src/config/env.js
- Schema file: backend/src/config/env.schema.js
- Validation engine: zod
- Validation timing: startup (module load of env config)

If any required or invalid value is detected, startup fails with a readable validation error.

## Sections

The runtime config is grouped into these sections:

- app
- auth
- database
- storage
- audio
- notifications
- ads
- subscriptions
- analytics

## Secrets vs Public Config

- Full config object: env
- Public-safe subset: publicEnv
- Redacted startup logging: logConfigSummary(env)

Redaction is applied to sensitive fields such as secrets, API keys, storage credentials, database URL, and token secrets.

## Environment Modes

Supported modes:

- development
- staging
- production

Both NODE_ENV and APP_ENV are validated to these values.

## Environment Files

- Root template: .env.example
- Backend template: backend/.env.example

These templates include placeholders for all config sections. Replace secret placeholders before non-local deployment.
