# Backend Notes

Backend scaffolding currently includes:

- Sectioned environment/config loader with validation and redacted startup logs
- Prisma-based ORM schema, migrations, and local seed scaffolding
- Authentication module with JWT, refresh sessions, auth middleware, role scaffold, and social auth scaffolds
- User profile module with profile metadata plus notification/email preference settings
- Upload + cloud storage module with signed upload/access scaffolding and storage usage accounting

See docs/configuration.md for runtime configuration details.
See docs/auth.md for authentication module details.
See docs/profile.md for user profile module details.
See docs/uploads.md for upload and storage module details.
