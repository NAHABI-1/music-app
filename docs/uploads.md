# Upload and Cloud Storage Module

CloudTune upload module provides secure user-owned audio upload scaffolding with signed upload/access URLs and storage usage accounting.

## Goals

- Accept only legal user-uploaded content
- Validate audio format and file size before upload initialization
- Keep objects private by default and expose access only through short-lived signed URLs
- Record upload lifecycle in database
- Track storage usage growth per user

## Endpoints

Base path: `/api/v1/uploads`

- `POST /`
  - Initiates secure upload
  - Validates mime type and size against configured audio policy
  - Requires legal attestation (`legalAttestationAccepted=true`)
  - Returns signed PUT URL and progress design details
- `GET /:uploadId`
  - Returns upload status and metadata
  - Ownership-checked
- `PATCH /:uploadId/progress`
  - Client-reported progress update scaffold
  - Ownership-checked
- `POST /:uploadId/complete`
  - Completes upload lifecycle
  - Runs metadata extraction scaffold
  - Creates song record with rights status `PENDING`
  - Updates storage usage metrics
- `POST /:uploadId/access-url`
  - Returns short-lived signed GET URL for owner access
  - No public raw file URL exposure

## Upload Progress Support Design

Progress mode is currently `client-reported`:

- Client uploads directly to signed URL
- Client periodically calls `/uploads/:id/progress` with uploaded bytes
- Client can poll `/uploads/:id` for authoritative backend state

## Storage Abstraction

- `backend/src/services/storage/storage.provider.js`
- `backend/src/services/storage/s3StorageProvider.js`
- `backend/src/services/storage/index.js`

Current implementation uses S3-compatible presigned URLs (works with MinIO/S3-compatible providers).

## Ownership and Security

- Every upload route requires authentication
- Upload lookup and access are scoped by `userId`
- Signed URLs are short-lived and generated server-side
- Raw object keys are never publicly exposed as permanent URLs

## Metadata Extraction Scaffold

Metadata extraction is scaffolded in service layer and marks extracted metadata with low confidence/manual review required. Real audio parsing can be integrated later.

## Tests

- `backend/test/upload/upload.service.test.js`
- `backend/test/upload/upload.routes.test.js`
