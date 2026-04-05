const crypto = require('crypto');

const { getEnv } = require('../../config/env');
const { UploadRepository } = require('../../repositories/upload.repository');
const { createAnalyticsTracker } = require('../../services/analyticsTracker');
const { createStorageProvider } = require('../../services/storage');
const { UploadError } = require('./upload.errors');

function sanitizeTitleFromFilename(filename) {
  return filename
    .replace(/\.[^/.]+$/, '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .slice(0, 260) || 'Untitled Upload';
}

function toUploadDto(upload, access = null) {
  return {
    id: upload.id,
    userId: upload.userId,
    songId: upload.songId,
    originalFilename: upload.originalFilename,
    mimeType: upload.mimeType,
    fileSizeBytes: Number(upload.fileSizeBytes),
    storageKey: upload.storageKey,
    status: upload.status,
    uploadedBytes: Number(upload.uploadedBytes || 0),
    uploadProgressPct: upload.uploadProgressPct || 0,
    legalAttestationAccepted: upload.legalAttestationAccepted,
    errorMessage: upload.errorMessage,
    metadataExtracted: upload.metadataExtracted,
    signedUploadExpiresAt: upload.signedUploadExpiresAt,
    createdAt: upload.createdAt,
    updatedAt: upload.updatedAt,
    access,
    song: upload.song || null,
  };
}

class UploadService {
  constructor({
    uploadRepository = new UploadRepository(),
    analyticsTracker = createAnalyticsTracker(),
    storageProvider = createStorageProvider(),
    env = getEnv(),
  } = {}) {
    this.uploadRepository = uploadRepository;
    this.analyticsTracker = analyticsTracker;
    this.storageProvider = storageProvider;
    this.env = env;
  }

  validateUploadInput(input) {
    if (!this.env.audio.allowedMimeTypes.includes(input.mimeType)) {
      throw new UploadError(400, 'UNSUPPORTED_AUDIO_FORMAT', 'Audio format is not supported.');
    }

    const maxBytes = this.env.audio.maxUploadMb * 1024 * 1024;
    if (input.fileSizeBytes > maxBytes) {
      throw new UploadError(400, 'FILE_TOO_LARGE', `File exceeds maximum size of ${this.env.audio.maxUploadMb}MB.`);
    }

    if (!input.legalAttestationAccepted) {
      throw new UploadError(400, 'LEGAL_ATTESTATION_REQUIRED', 'Legal attestation is required for uploads.');
    }
  }

  async initiateUpload(userId, input) {
    this.validateUploadInput(input);

    const upload = await this.uploadRepository.createUpload({
      userId,
      originalFilename: input.filename,
      mimeType: input.mimeType,
      fileSizeBytes: BigInt(input.fileSizeBytes),
      status: 'QUEUED',
      legalAttestationAccepted: true,
      uploadProgressPct: 0,
      uploadedBytes: BigInt(0),
      metadataExtracted: {
        titleHint: input.title || sanitizeTitleFromFilename(input.filename),
        artistHint: input.artistName || null,
        albumHint: input.albumTitle || null,
        extractionStatus: 'PENDING',
      },
    });

    const extension = input.filename.includes('.')
      ? String(input.filename.split('.').pop() || 'bin').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 10) || 'bin'
      : 'bin';
    const storageKey = `uploads/${userId}/${upload.id}.${extension}`;

    const signedUpload = await this.storageProvider.createSignedUploadUrl({
      storageKey,
      mimeType: input.mimeType,
      fileSizeBytes: input.fileSizeBytes,
      ownerUserId: userId,
      uploadId: upload.id,
      expiresInSeconds: this.env.storage.signedUrlTtlSeconds,
    });

    const updated = await this.uploadRepository.updateUpload(upload.id, {
      storageKey,
      signedUploadExpiresAt: signedUpload.expiresAt,
      status: 'SCANNING',
    });

    await this.analyticsTracker.trackEvent({
      userId,
      eventName: 'upload_initiated',
      properties: {
        uploadId: updated.id,
        mimeType: updated.mimeType,
        fileSizeBytes: Number(updated.fileSizeBytes),
      },
    });

    return {
      upload: toUploadDto(updated),
      signedUpload,
      progress: {
        mode: 'client-reported',
        updateEndpoint: `/api/v1/uploads/${upload.id}/progress`,
        pollEndpoint: `/api/v1/uploads/${upload.id}`,
      },
    };
  }

  async getUpload(userId, uploadId) {
    const upload = await this.uploadRepository.getUploadById(uploadId);
    if (!upload || upload.userId !== userId) {
      throw new UploadError(404, 'UPLOAD_NOT_FOUND', 'Upload was not found.');
    }

    return toUploadDto(upload);
  }

  async updateProgress(userId, uploadId, input) {
    const upload = await this.uploadRepository.getUploadById(uploadId);
    if (!upload || upload.userId !== userId) {
      throw new UploadError(404, 'UPLOAD_NOT_FOUND', 'Upload was not found.');
    }

    if (!['QUEUED', 'SCANNING', 'PROCESSING'].includes(upload.status)) {
      throw new UploadError(409, 'UPLOAD_NOT_ACTIVE', 'Upload is not active for progress updates.');
    }

    const fileSize = Number(upload.fileSizeBytes);
    if (input.uploadedBytes > fileSize) {
      throw new UploadError(400, 'INVALID_PROGRESS', 'Uploaded bytes cannot exceed file size.');
    }

    const progressPercentage =
      input.progressPercentage !== undefined
        ? input.progressPercentage
        : Math.min(100, Math.round((input.uploadedBytes / fileSize) * 100));

    const updated = await this.uploadRepository.updateUpload(uploadId, {
      uploadedBytes: BigInt(input.uploadedBytes),
      uploadProgressPct: progressPercentage,
      status: progressPercentage >= 100 ? 'PROCESSING' : 'SCANNING',
    });

    return toUploadDto(updated);
  }

  extractMetadataScaffold(upload, hints = {}) {
    const filenameTitle = sanitizeTitleFromFilename(upload.originalFilename);
    const durationSeconds = hints.durationSeconds ?? 0;

    return {
      extractionStatus: 'SCAFFOLDED',
      title: hints.title || filenameTitle,
      artistName: hints.artistName || 'Independent Artist',
      albumTitle: hints.albumTitle || null,
      durationSeconds,
      confidence: 'LOW',
      requiresManualReview: true,
    };
  }

  async completeUpload(userId, uploadId, input) {
    const upload = await this.uploadRepository.getUploadById(uploadId);
    if (!upload || upload.userId !== userId) {
      throw new UploadError(404, 'UPLOAD_NOT_FOUND', 'Upload was not found.');
    }

    if (!upload.legalAttestationAccepted) {
      throw new UploadError(403, 'LEGAL_ATTESTATION_REQUIRED', 'Upload legal attestation is required.');
    }

    if (upload.status === 'COMPLETED' && upload.songId) {
      return toUploadDto(upload);
    }

    const checksum = input.checksumSha256 || crypto.createHash('sha256').update(upload.storageKey || upload.id).digest('hex');
    const metadata = this.extractMetadataScaffold(upload, input.metadataHints || {});
    const artist = await this.uploadRepository.getOrCreateArtistForUser(userId, metadata.artistName);

    const title = metadata.title;
    const slugBase = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 180) || `upload-${upload.id.slice(0, 8)}`;

    const song = await this.uploadRepository.createSongFromUpload({
      artistId: artist.id,
      uploadedByUserId: userId,
      title,
      slug: `${slugBase}-${upload.id.slice(0, 8)}`,
      durationSeconds: metadata.durationSeconds || 0,
      filePath: upload.storageKey,
      mimeType: upload.mimeType,
      fileSizeBytes: upload.fileSizeBytes,
      checksumSha256: checksum,
      rightsStatus: 'PENDING',
      status: 'PROCESSING',
      publishedAt: null,
      genre: null,
      trackNumber: null,
      albumId: null,
      isExplicit: false,
    });

    await this.uploadRepository.incrementStorageUsage(userId, Number(upload.fileSizeBytes));

    const updated = await this.uploadRepository.updateUpload(upload.id, {
      songId: song.id,
      status: 'COMPLETED',
      uploadedBytes: upload.fileSizeBytes,
      uploadProgressPct: 100,
      metadataExtracted: metadata,
      storageEtag: input.eTag || null,
    });

    await this.analyticsTracker.trackEvent({
      userId,
      eventName: 'upload_completed',
      properties: {
        uploadId: updated.id,
        songId: song.id,
        fileSizeBytes: Number(updated.fileSizeBytes),
      },
    });

    return toUploadDto(updated);
  }

  async createAccessUrl(userId, uploadId, options = {}) {
    const upload = await this.uploadRepository.getUploadById(uploadId);
    if (!upload || upload.userId !== userId) {
      throw new UploadError(404, 'UPLOAD_NOT_FOUND', 'Upload was not found.');
    }

    if (!upload.storageKey || upload.status !== 'COMPLETED') {
      throw new UploadError(409, 'UPLOAD_NOT_READY', 'Upload is not ready for secure access.');
    }

    const access = await this.storageProvider.createSignedAccessUrl({
      storageKey: upload.storageKey,
      mimeType: upload.mimeType,
      download: options.download === true,
      expiresInSeconds: this.env.storage.signedUrlTtlSeconds,
      ownerUserId: userId,
      uploadId: upload.id,
    });

    return {
      upload: toUploadDto(upload, access),
      signedAccess: access,
    };
  }
}

function createUploadService(dependencies) {
  return new UploadService(dependencies);
}

module.exports = {
  UploadService,
  createUploadService,
};
