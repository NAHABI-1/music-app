const { z } = require('zod');

const { validateBody } = require('../../middleware/validateBody');

const initiateUploadSchema = z.object({
  filename: z.string().min(1).max(320),
  mimeType: z.string().min(1).max(120),
  fileSizeBytes: z.number().int().positive(),
  legalAttestationAccepted: z.literal(true),
  title: z.string().min(1).max(260).optional(),
  artistName: z.string().min(1).max(180).optional(),
  albumTitle: z.string().min(1).max(240).optional(),
  checksumSha256: z.string().length(64).regex(/^[a-fA-F0-9]{64}$/).optional(),
});

const updateUploadProgressSchema = z.object({
  uploadedBytes: z.number().int().min(0),
  progressPercentage: z.number().int().min(0).max(100).optional(),
});

const completeUploadSchema = z.object({
  checksumSha256: z.string().length(64).regex(/^[a-fA-F0-9]{64}$/).optional(),
  eTag: z.string().max(200).optional(),
  metadataHints: z
    .object({
      title: z.string().min(1).max(260).optional(),
      artistName: z.string().min(1).max(180).optional(),
      albumTitle: z.string().min(1).max(240).optional(),
      durationSeconds: z.number().int().min(0).optional(),
    })
    .optional(),
});

const accessUrlSchema = z.object({
  download: z.boolean().optional(),
});

module.exports = {
  initiateUploadSchema,
  updateUploadProgressSchema,
  completeUploadSchema,
  accessUrlSchema,
  validateBody,
};
