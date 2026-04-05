const test = require('node:test');
const assert = require('node:assert/strict');

const { OfflineService } = require('../../src/modules/media/offline.service');
const { OfflineError } = require('../../src/modules/media/offline.errors');

function buildRepositoryMock() {
  return {
    findAccessibleReadySong: async () => null,
    findActiveDeviceSession: async () => null,
    getDownloadBySongAndDevice: async () => null,
    getCurrentSubscription: async () => null,
    countActiveOfflineDownloads: async () => 0,
    createOfflineDownload: async () => null,
    getOfflineDownloadById: async () => null,
    updateOfflineDownloadById: async () => ({ count: 0 }),
    listOfflineDownloads: async () => [],
    findReadyEntitlement: async () => null,
    expireDownloads: async () => ({ count: 0 }),
  };
}

function makeDownload(overrides = {}) {
  return {
    id: 'download-1',
    userId: 'user-1',
    songId: 'song-1',
    deviceSessionId: 'device-1',
    localPath: 'pending://offline/device-1/song-1',
    status: 'QUEUED',
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
    downloadedAt: null,
    createdAt: new Date('2026-04-05T00:00:00.000Z'),
    updatedAt: new Date('2026-04-05T00:00:00.000Z'),
    song: null,
    deviceSession: null,
    ...overrides,
  };
}

test('requestOfflineAccess enforces song ownership readiness', async () => {
  const repository = buildRepositoryMock();
  repository.findAccessibleReadySong = async () => null;

  const service = new OfflineService({ offlineRepository: repository });

  await assert.rejects(
    () =>
      service.requestOfflineAccess('user-1', {
        songId: 'song-1',
        deviceSessionId: 'device-1',
      }),
    (error) => error instanceof OfflineError && error.code === 'SONG_NOT_OFFLINE_ELIGIBLE'
  );
});

test('requestOfflineAccess enforces plan limits', async () => {
  const repository = buildRepositoryMock();
  repository.findAccessibleReadySong = async () => ({ id: 'song-1', durationSeconds: 120 });
  repository.findActiveDeviceSession = async () => ({ id: 'device-1' });
  repository.countActiveOfflineDownloads = async () => 3;
  repository.getCurrentSubscription = async () => null;

  const service = new OfflineService({ offlineRepository: repository });

  await assert.rejects(
    () =>
      service.requestOfflineAccess('user-1', {
        songId: 'song-1',
        deviceSessionId: 'device-1',
      }),
    (error) => error instanceof OfflineError && error.code === 'OFFLINE_LIMIT_EXCEEDED'
  );
});

test('requestOfflineAccess returns existing active record idempotently', async () => {
  const repository = buildRepositoryMock();
  repository.findAccessibleReadySong = async () => ({ id: 'song-1', durationSeconds: 120 });
  repository.findActiveDeviceSession = async () => ({ id: 'device-1' });
  repository.getDownloadBySongAndDevice = async () => makeDownload();

  const service = new OfflineService({ offlineRepository: repository });
  const result = await service.requestOfflineAccess('user-1', {
    songId: 'song-1',
    deviceSessionId: 'device-1',
  });

  assert.equal(result.entitlement.reason, 'EXISTING_DOWNLOAD');
  assert.equal(result.download.id, 'download-1');
});

test('updateDownloadStatus marks ready download', async () => {
  const repository = buildRepositoryMock();
  repository.getOfflineDownloadById = async () =>
    makeDownload({ id: 'download-2', deviceSessionId: 'device-session-1' });
  repository.updateOfflineDownloadById = async () => ({ count: 1 });

  repository.getOfflineDownloadById = async () =>
    makeDownload({
      id: 'download-2',
      status: 'READY',
      localPath: '/device/files/song-1',
      deviceSessionId: 'device-session-1',
    });

  const service = new OfflineService({ offlineRepository: repository });
  const result = await service.updateDownloadStatus('user-1', 'download-2', {
    deviceSessionId: 'device-session-1',
    status: 'READY',
    localPath: '/device/files/song-1',
  });

  assert.equal(result.download.status, 'READY');
  assert.equal(result.download.localPath, '/device/files/song-1');
});

test('updateDownloadStatus rejects mismatched device session', async () => {
  const repository = buildRepositoryMock();
  repository.getOfflineDownloadById = async () => makeDownload({ id: 'download-2', deviceSessionId: 'device-a' });

  const service = new OfflineService({ offlineRepository: repository });

  await assert.rejects(
    () =>
      service.updateDownloadStatus('user-1', 'download-2', {
        deviceSessionId: 'device-b',
        status: 'DOWNLOADING',
      }),
    (error) => error instanceof OfflineError && error.code === 'DEVICE_SESSION_MISMATCH'
  );
});

test('validateEntitlement requires ready local file state', async () => {
  const repository = buildRepositoryMock();
  repository.findAccessibleReadySong = async () => ({ id: 'song-1', durationSeconds: 120 });
  repository.findReadyEntitlement = async () => null;

  const service = new OfflineService({ offlineRepository: repository });
  const result = await service.validateEntitlement('user-1', 'song-1', { deviceSessionId: 'device-1' });

  assert.equal(result.eligible, true);
  assert.equal(result.entitled, false);
  assert.equal(result.reason, 'NOT_DOWNLOADED_ON_DEVICE');
});

test('validateEntitlement grants when ready download exists', async () => {
  const repository = buildRepositoryMock();
  repository.findAccessibleReadySong = async () => ({ id: 'song-1', durationSeconds: 120 });
  repository.findReadyEntitlement = async () =>
    makeDownload({
      status: 'READY',
      localPath: '/device/files/song-1',
      downloadedAt: new Date('2026-04-05T01:00:00.000Z'),
    });

  const service = new OfflineService({ offlineRepository: repository });
  const result = await service.validateEntitlement('user-1', 'song-1', { deviceSessionId: 'device-1' });

  assert.equal(result.entitled, true);
  assert.equal(result.reason, 'ENTITLED');
});

test('revokeDownload marks record deleted', async () => {
  const repository = buildRepositoryMock();
  repository.updateOfflineDownloadById = async () => ({ count: 1 });

  const service = new OfflineService({ offlineRepository: repository });
  const result = await service.revokeDownload('user-1', 'download-9');

  assert.equal(result.revoked, true);
});

test('validateEntitlement returns device file not ready for pending local path', async () => {
  const repository = buildRepositoryMock();
  repository.findAccessibleReadySong = async () => ({ id: 'song-1', durationSeconds: 120 });
  repository.findReadyEntitlement = async () =>
    makeDownload({
      status: 'READY',
      localPath: 'pending://offline/device-1/song-1',
    });

  const service = new OfflineService({ offlineRepository: repository });
  const result = await service.validateEntitlement('user-1', 'song-1', { deviceSessionId: 'device-1' });

  assert.equal(result.eligible, true);
  assert.equal(result.entitled, false);
  assert.equal(result.reason, 'DEVICE_FILE_NOT_READY');
});

test('expireDownloads returns number of expired rows', async () => {
  const repository = buildRepositoryMock();
  repository.expireDownloads = async () => ({ count: 7 });

  const service = new OfflineService({ offlineRepository: repository });
  const result = await service.expireDownloads('user-1');

  assert.equal(result.expiredCount, 7);
});
