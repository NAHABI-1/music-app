const test = require('node:test');
const assert = require('node:assert/strict');

const { UploadService } = require('../../src/modules/media/upload.service');
const { UploadError } = require('../../src/modules/media/upload.errors');

function baseEnv() {
  return {
    audio: {
      allowedMimeTypes: ['audio/mpeg', 'audio/flac'],
      maxUploadMb: 25,
    },
    storage: {
      signedUrlTtlSeconds: 900,
    },
  };
}

function buildRepositoryMock() {
  return {
    createUpload: async () => null,
    updateUpload: async () => null,
    getUploadById: async () => null,
    getOrCreateArtistForUser: async () => null,
    createSongFromUpload: async () => null,
    incrementStorageUsage: async () => null,
  };
}

function buildStorageMock() {
  return {
    createSignedUploadUrl: async () => ({
      signedUrl: 'https://storage.example/upload',
      expiresAt: new Date(Date.now() + 900000),
      method: 'PUT',
      headers: {},
    }),
    createSignedAccessUrl: async () => ({
      signedUrl: 'https://storage.example/access',
      expiresAt: new Date(Date.now() + 900000),
      method: 'GET',
    }),
  };
}

function makeUpload(overrides = {}) {
  return {
    id: 'upload-1',
    userId: 'user-1',
    songId: null,
    originalFilename: 'track.mp3',
    mimeType: 'audio/mpeg',
    fileSizeBytes: BigInt(1024),
    uploadedBytes: BigInt(0),
    uploadProgressPct: 0,
    legalAttestationAccepted: true,
    storageKey: 'uploads/user-1/upload-1.mp3',
    storageEtag: null,
    signedUploadExpiresAt: null,
    metadataExtracted: null,
    status: 'SCANNING',
    errorMessage: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    song: null,
    ...overrides,
  };
}

test('initiateUpload rejects unsupported format', async () => {
  const service = new UploadService({
    uploadRepository: buildRepositoryMock(),
    storageProvider: buildStorageMock(),
    env: baseEnv(),
  });

  await assert.rejects(
    () =>
      service.initiateUpload('user-1', {
        filename: 'sample.ogg',
        mimeType: 'audio/ogg',
        fileSizeBytes: 1024,
        legalAttestationAccepted: true,
      }),
    (error) => error instanceof UploadError && error.code === 'UNSUPPORTED_AUDIO_FORMAT'
  );
});

test('initiateUpload creates upload and returns signed URL payload', async () => {
  const repo = buildRepositoryMock();
  repo.createUpload = async (data) =>
    makeUpload({
      id: 'upload-42',
      userId: data.userId,
      originalFilename: data.originalFilename,
      mimeType: data.mimeType,
      fileSizeBytes: data.fileSizeBytes,
      legalAttestationAccepted: data.legalAttestationAccepted,
      uploadedBytes: data.uploadedBytes,
      uploadProgressPct: data.uploadProgressPct,
      metadataExtracted: data.metadataExtracted,
      status: data.status,
    });
  repo.updateUpload = async (_id, data) => makeUpload({ id: 'upload-42', ...data, status: data.status || 'SCANNING' });

  const service = new UploadService({
    uploadRepository: repo,
    storageProvider: buildStorageMock(),
    env: baseEnv(),
  });

  const result = await service.initiateUpload('user-1', {
    filename: 'song.mp3',
    mimeType: 'audio/mpeg',
    fileSizeBytes: 4096,
    legalAttestationAccepted: true,
    title: 'Song',
  });

  assert.equal(result.upload.id, 'upload-42');
  assert.equal(result.signedUpload.method, 'PUT');
  assert.equal(result.progress.mode, 'client-reported');
});

test('completeUpload enforces ownership and updates storage metrics', async () => {
  const repo = buildRepositoryMock();
  let usageIncrement = 0;

  repo.getUploadById = async () =>
    makeUpload({
      id: 'upload-owned',
      userId: 'owner-1',
      fileSizeBytes: BigInt(5000),
      status: 'PROCESSING',
      uploadProgressPct: 100,
      uploadedBytes: BigInt(5000),
    });
  repo.getOrCreateArtistForUser = async () => ({ id: 'artist-1' });
  repo.createSongFromUpload = async () => ({
    id: 'song-1',
    title: 'song',
    uploadedByUserId: 'owner-1',
    status: 'PROCESSING',
    rightsStatus: 'PENDING',
    mimeType: 'audio/mpeg',
  });
  repo.incrementStorageUsage = async (_uid, bytes) => {
    usageIncrement = bytes;
  };
  repo.updateUpload = async (_id, data) => makeUpload({ id: 'upload-owned', userId: 'owner-1', ...data, song: { id: 'song-1' } });

  const service = new UploadService({
    uploadRepository: repo,
    storageProvider: buildStorageMock(),
    env: baseEnv(),
  });

  const result = await service.completeUpload('owner-1', 'upload-owned', {
    checksumSha256: 'a'.repeat(64),
    metadataHints: { title: 'My Song', artistName: 'My Artist' },
  });

  assert.equal(result.status, 'COMPLETED');
  assert.equal(usageIncrement, 5000);
});

test('createAccessUrl prevents access for non-owner', async () => {
  const repo = buildRepositoryMock();
  repo.getUploadById = async () => makeUpload({ id: 'upload-x', userId: 'owner-x', status: 'COMPLETED' });

  const service = new UploadService({
    uploadRepository: repo,
    storageProvider: buildStorageMock(),
    env: baseEnv(),
  });

  await assert.rejects(
    () => service.createAccessUrl('another-user', 'upload-x', { download: true }),
    (error) => error instanceof UploadError && error.code === 'UPLOAD_NOT_FOUND'
  );
});

test('updateProgress rejects uploadedBytes larger than file size', async () => {
  const repo = buildRepositoryMock();
  repo.getUploadById = async () =>
    makeUpload({
      id: 'upload-overflow',
      userId: 'user-1',
      fileSizeBytes: BigInt(1000),
      status: 'SCANNING',
    });

  const service = new UploadService({
    uploadRepository: repo,
    storageProvider: buildStorageMock(),
    env: baseEnv(),
  });

  await assert.rejects(
    () => service.updateProgress('user-1', 'upload-overflow', { uploadedBytes: 1001 }),
    (error) => error instanceof UploadError && error.code === 'INVALID_PROGRESS'
  );
});

test('completeUpload is idempotent when upload already completed with song', async () => {
  const repo = buildRepositoryMock();
  repo.getUploadById = async () =>
    makeUpload({
      id: 'upload-complete',
      userId: 'user-1',
      status: 'COMPLETED',
      songId: 'song-existing',
      song: { id: 'song-existing' },
    });

  const service = new UploadService({
    uploadRepository: repo,
    storageProvider: buildStorageMock(),
    env: baseEnv(),
  });

  const result = await service.completeUpload('user-1', 'upload-complete', {});
  assert.equal(result.status, 'COMPLETED');
  assert.equal(result.songId, 'song-existing');
});

test('initiateUpload sanitizes suspicious extension in storage key', async () => {
  const repo = buildRepositoryMock();
  repo.createUpload = async () => makeUpload({ id: 'upload-sanitize' });
  repo.updateUpload = async (_id, data) => makeUpload({ id: 'upload-sanitize', ...data });

  let signedStorageKey;
  const storage = buildStorageMock();
  storage.createSignedUploadUrl = async ({ storageKey }) => {
    signedStorageKey = storageKey;
    return {
      signedUrl: 'https://storage.example/upload',
      expiresAt: new Date(Date.now() + 900000),
      method: 'PUT',
      headers: {},
    };
  };

  const service = new UploadService({
    uploadRepository: repo,
    storageProvider: storage,
    env: baseEnv(),
  });

  await service.initiateUpload('user-1', {
    filename: 'song.mp3../../',
    mimeType: 'audio/mpeg',
    fileSizeBytes: 4096,
    legalAttestationAccepted: true,
  });

  assert.equal(signedStorageKey.endsWith('.bin'), true);
});
