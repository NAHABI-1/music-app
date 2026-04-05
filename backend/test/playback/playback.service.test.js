const test = require('node:test');
const assert = require('node:assert/strict');

const { PlaybackService } = require('../../src/modules/media/playback.service');

function createRepositoryMock() {
  return {
    findAccessibleReadySong: async () => null,
    findDeviceSessionForUser: async () => null,
    createPlaybackSession: async () => null,
    getPlaybackSessionById: async () => null,
    updatePlaybackSessionById: async () => ({ count: 0 }),
    getLatestSongSession: async () => null,
    createAnalyticsEvent: async () => null,
    createRecentPlay: async () => null,
  };
}

function createBillingRepositoryMock(subscription = null) {
  return {
    getCurrentSubscription: async () => subscription,
  };
}

function createStorageProviderMock() {
  return {
    createSignedAccessUrl: async () => ({
      signedUrl: 'https://example.com/stream',
      method: 'GET',
      expiresAt: new Date('2026-04-05T02:00:00.000Z'),
    }),
  };
}

function createSong() {
  return {
    id: 'song-1',
    title: 'Song',
    durationSeconds: 300,
    mimeType: 'audio/mpeg',
    filePath: 'songs/song-1.mp3',
  };
}

test('startPlaybackSession clamps free users to medium quality', async () => {
  const playbackRepository = createRepositoryMock();
  playbackRepository.findAccessibleReadySong = async () => createSong();
  playbackRepository.createPlaybackSession = async (data) => ({
    id: 'session-1',
    userId: data.userId,
    songId: data.songId,
    deviceSessionId: data.deviceSessionId,
    quality: data.quality,
    lowDataMode: data.lowDataMode,
    playbackSource: data.playbackSource,
    deliveryMethod: data.deliveryMethod,
    signedUrlExpiresAt: data.signedUrlExpiresAt,
    resumeFromSecs: data.resumeFromSecs,
    lastPositionSecs: data.lastPositionSecs,
    maxPositionSecs: data.maxPositionSecs,
    status: data.status,
    metadata: data.metadata,
    startedAt: new Date('2026-04-05T00:00:00.000Z'),
    lastHeartbeatAt: new Date('2026-04-05T00:00:00.000Z'),
    endedAt: null,
    createdAt: new Date('2026-04-05T00:00:00.000Z'),
    updatedAt: new Date('2026-04-05T00:00:00.000Z'),
    song: createSong(),
  });

  const service = new PlaybackService({
    playbackRepository,
    billingRepository: createBillingRepositoryMock(null),
    storageProvider: createStorageProviderMock(),
    env: {
      playback: { signedUrlTtlSeconds: 900 },
    },
  });

  const result = await service.startPlaybackSession('user-1', {
    songId: 'song-1',
    deviceSessionId: null,
    quality: 'LOSSLESS',
    lowDataMode: false,
    playbackSource: 'STREAM',
  });

  assert.equal(result.playback.qualityRequested, 'LOSSLESS');
  assert.equal(result.playback.qualityEffective, 'MEDIUM');
});

test('startPlaybackSession allows lossless quality for premium users', async () => {
  const playbackRepository = createRepositoryMock();
  playbackRepository.findAccessibleReadySong = async () => createSong();
  playbackRepository.createPlaybackSession = async (data) => ({
    id: 'session-1',
    userId: data.userId,
    songId: data.songId,
    deviceSessionId: data.deviceSessionId,
    quality: data.quality,
    lowDataMode: data.lowDataMode,
    playbackSource: data.playbackSource,
    deliveryMethod: data.deliveryMethod,
    signedUrlExpiresAt: data.signedUrlExpiresAt,
    resumeFromSecs: data.resumeFromSecs,
    lastPositionSecs: data.lastPositionSecs,
    maxPositionSecs: data.maxPositionSecs,
    status: data.status,
    metadata: data.metadata,
    startedAt: new Date('2026-04-05T00:00:00.000Z'),
    lastHeartbeatAt: new Date('2026-04-05T00:00:00.000Z'),
    endedAt: null,
    createdAt: new Date('2026-04-05T00:00:00.000Z'),
    updatedAt: new Date('2026-04-05T00:00:00.000Z'),
    song: createSong(),
  });

  const premiumSubscription = {
    status: 'ACTIVE',
    currentPeriodEnd: new Date('2026-05-05T00:00:00.000Z'),
    plan: {
      code: 'PREMIUM_MONTHLY',
      isActive: true,
    },
  };

  const service = new PlaybackService({
    playbackRepository,
    billingRepository: createBillingRepositoryMock(premiumSubscription),
    storageProvider: createStorageProviderMock(),
    env: {
      playback: { signedUrlTtlSeconds: 900 },
    },
  });

  const result = await service.startPlaybackSession('user-1', {
    songId: 'song-1',
    deviceSessionId: null,
    quality: 'LOSSLESS',
    lowDataMode: false,
    playbackSource: 'STREAM',
  });

  assert.equal(result.playback.qualityRequested, 'LOSSLESS');
  assert.equal(result.playback.qualityEffective, 'LOSSLESS');
});
