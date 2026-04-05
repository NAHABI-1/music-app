const { getEnv } = require('../../config/env');
const { BillingRepository } = require('../../repositories/billing.repository');
const { PlaybackRepository } = require('../../repositories/playback.repository');
const { createStorageProvider } = require('../../services/storage');
const { normalizeAudioQualitySelection } = require('../../services/entitlements');
const { PlaybackError } = require('./playback.errors');

function toSessionDto(session) {
  return {
    id: session.id,
    userId: session.userId,
    songId: session.songId,
    deviceSessionId: session.deviceSessionId,
    quality: session.quality,
    lowDataMode: session.lowDataMode,
    playbackSource: session.playbackSource,
    deliveryMethod: session.deliveryMethod,
    signedUrlExpiresAt: session.signedUrlExpiresAt,
    resumeFromSecs: session.resumeFromSecs,
    lastPositionSecs: session.lastPositionSecs,
    maxPositionSecs: session.maxPositionSecs,
    status: session.status,
    metadata: session.metadata,
    startedAt: session.startedAt,
    lastHeartbeatAt: session.lastHeartbeatAt,
    endedAt: session.endedAt,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    song: session.song || null,
  };
}

class PlaybackService {
  constructor({
    playbackRepository = new PlaybackRepository(),
    billingRepository = new BillingRepository(),
    storageProvider = createStorageProvider(),
    env = getEnv(),
  } = {}) {
    this.playbackRepository = playbackRepository;
    this.billingRepository = billingRepository;
    this.storageProvider = storageProvider;
    this.env = env;
  }

  clampPosition(position, durationSeconds) {
    if (!position || position < 0) {
      return 0;
    }

    if (!durationSeconds || durationSeconds <= 0) {
      return position;
    }

    return Math.min(position, durationSeconds);
  }

  async resolveResumePosition(userId, songId, requestedPositionSecs, durationSeconds) {
    if (requestedPositionSecs !== undefined) {
      return this.clampPosition(requestedPositionSecs, durationSeconds);
    }

    const previousSession = await this.playbackRepository.getLatestSongSession(userId, songId);
    if (!previousSession) {
      return 0;
    }

    const candidate = Math.max(previousSession.maxPositionSecs || 0, previousSession.lastPositionSecs || 0);
    return this.clampPosition(candidate, durationSeconds);
  }

  async assertValidDeviceSession(userId, deviceSessionId) {
    if (!deviceSessionId) {
      return null;
    }

    const deviceSession = await this.playbackRepository.findDeviceSessionForUser(userId, deviceSessionId);
    if (!deviceSession) {
      throw new PlaybackError(400, 'INVALID_DEVICE_SESSION', 'Device session is invalid or not active for this user.');
    }

    return deviceSession;
  }

  async createSignedPlaybackUrl(song, userId) {
    const signed = await this.storageProvider.createSignedAccessUrl({
      storageKey: song.filePath,
      mimeType: song.mimeType,
      download: false,
      ownerUserId: userId,
      expiresInSeconds: this.env.playback.signedUrlTtlSeconds,
    });

    return {
      strategy: 'SIGNED_URL',
      url: signed.signedUrl,
      method: signed.method,
      expiresAt: signed.expiresAt,
    };
  }

  async createPlaybackAnalyticsEvent(params) {
    await this.playbackRepository.createAnalyticsEvent({
      userId: params.userId,
      deviceSessionId: params.deviceSessionId || null,
      eventName: params.eventName,
      eventCategory: 'playback',
      source: 'BACKEND',
      properties: params.properties || null,
      eventTimestamp: new Date(),
    });
  }

  async startPlaybackSession(userId, input) {
    const song = await this.playbackRepository.findAccessibleReadySong(userId, input.songId);
    if (!song) {
      throw new PlaybackError(404, 'SONG_NOT_STREAMABLE', 'Song is not available for streaming.');
    }

    await this.assertValidDeviceSession(userId, input.deviceSessionId);

    const subscription = await this.billingRepository.getCurrentSubscription(userId);
    const quality = normalizeAudioQualitySelection(input.quality, input.lowDataMode, subscription);
    const resumeFromSecs = await this.resolveResumePosition(
      userId,
      song.id,
      input.resumePositionSecs,
      song.durationSeconds
    );

    const delivery = await this.createSignedPlaybackUrl(song, userId);

    const session = await this.playbackRepository.createPlaybackSession({
      userId,
      songId: song.id,
      deviceSessionId: input.deviceSessionId || null,
      quality: quality.effective,
      lowDataMode: input.lowDataMode,
      playbackSource: input.playbackSource,
      deliveryMethod: delivery.strategy,
      signedUrlExpiresAt: delivery.expiresAt,
      resumeFromSecs,
      lastPositionSecs: resumeFromSecs,
      maxPositionSecs: resumeFromSecs,
      status: 'ACTIVE',
      metadata: {
        requestedQuality: quality.requested,
        effectiveQuality: quality.effective,
        qualityProfile: quality.profile,
        lowDataMode: input.lowDataMode,
        streamVariant: 'source',
      },
      lastHeartbeatAt: new Date(),
    });

    await this.createPlaybackAnalyticsEvent({
      userId,
      deviceSessionId: input.deviceSessionId,
      eventName: 'playback_started',
      properties: {
        sessionId: session.id,
        songId: song.id,
        qualityRequested: quality.requested,
        qualityEffective: quality.effective,
        lowDataMode: input.lowDataMode,
        resumeFromSecs,
        playbackSource: input.playbackSource,
      },
    });

    return {
      session: toSessionDto(session),
      stream: {
        strategy: delivery.strategy,
        url: delivery.url,
        method: delivery.method,
        expiresAt: delivery.expiresAt,
      },
      playback: {
        qualityRequested: quality.requested,
        qualityEffective: quality.effective,
        lowDataMode: input.lowDataMode,
        resumeFromSecs,
      },
    };
  }

  async getPlaybackSession(userId, sessionId) {
    const session = await this.playbackRepository.getPlaybackSessionById(userId, sessionId);
    if (!session) {
      throw new PlaybackError(404, 'PLAYBACK_SESSION_NOT_FOUND', 'Playback session was not found.');
    }

    return {
      session: toSessionDto(session),
    };
  }

  async updatePlaybackProgress(userId, sessionId, input) {
    const current = await this.playbackRepository.getPlaybackSessionById(userId, sessionId);
    if (!current) {
      throw new PlaybackError(404, 'PLAYBACK_SESSION_NOT_FOUND', 'Playback session was not found.');
    }

    if (!['ACTIVE', 'PAUSED'].includes(current.status)) {
      throw new PlaybackError(409, 'PLAYBACK_SESSION_NOT_ACTIVE', 'Playback session is not active.');
    }

    const nextPosition = this.clampPosition(input.positionSecs, current.song?.durationSeconds);
    const nextMaxPosition = Math.max(current.maxPositionSecs || 0, nextPosition);
    const nextStatus = input.playbackState === 'PAUSED' ? 'PAUSED' : 'ACTIVE';

    await this.playbackRepository.updatePlaybackSessionById(userId, sessionId, {
      lastPositionSecs: nextPosition,
      maxPositionSecs: nextMaxPosition,
      status: nextStatus,
      lastHeartbeatAt: new Date(),
    });

    const updated = await this.playbackRepository.getPlaybackSessionById(userId, sessionId);

    if (input.emitAnalyticsEvent) {
      await this.createPlaybackAnalyticsEvent({
        userId,
        deviceSessionId: updated.deviceSessionId,
        eventName: 'playback_session_progress',
        properties: {
          sessionId: updated.id,
          songId: updated.songId,
          positionSecs: nextPosition,
          maxPositionSecs: nextMaxPosition,
          playbackState: input.playbackState,
          bufferedSecs: input.bufferedSecs,
        },
      });
    }

    return {
      session: toSessionDto(updated),
    };
  }

  async endPlaybackSession(userId, sessionId, input) {
    const current = await this.playbackRepository.getPlaybackSessionById(userId, sessionId);
    if (!current) {
      throw new PlaybackError(404, 'PLAYBACK_SESSION_NOT_FOUND', 'Playback session was not found.');
    }

    if (current.status === 'ENDED') {
      return {
        session: toSessionDto(current),
      };
    }

    const finalPosition = this.clampPosition(
      input.finalPositionSecs !== undefined ? input.finalPositionSecs : current.lastPositionSecs,
      current.song?.durationSeconds
    );

    const maxPosition = Math.max(current.maxPositionSecs || 0, finalPosition);

    await this.playbackRepository.updatePlaybackSessionById(userId, sessionId, {
      lastPositionSecs: finalPosition,
      maxPositionSecs: maxPosition,
      status: 'ENDED',
      endedAt: new Date(),
      lastHeartbeatAt: new Date(),
    });

    await this.playbackRepository.createRecentPlay({
      userId,
      songId: current.songId,
      playbackSource: current.playbackSource,
      playDurationSecs: finalPosition,
    });

    await this.createPlaybackAnalyticsEvent({
      userId,
      deviceSessionId: current.deviceSessionId,
      eventName: 'playback_completed',
      properties: {
        sessionId: current.id,
        songId: current.songId,
        finalPositionSecs: finalPosition,
        maxPositionSecs: maxPosition,
        endedReason: input.endedReason,
        completionRatio:
          current.song?.durationSeconds && current.song.durationSeconds > 0
            ? Math.min(1, maxPosition / current.song.durationSeconds)
            : null,
      },
    });

    const updated = await this.playbackRepository.getPlaybackSessionById(userId, sessionId);

    return {
      session: toSessionDto(updated),
    };
  }

  async getResumePosition(userId, songId, options = {}) {
    const song = await this.playbackRepository.findAccessibleReadySong(userId, songId);
    if (!song) {
      throw new PlaybackError(404, 'SONG_NOT_STREAMABLE', 'Song is not available for streaming.');
    }

    const latestSession = await this.playbackRepository.getLatestSongSession(userId, songId);
    const resumePositionSecs = latestSession
      ? this.clampPosition(Math.max(latestSession.maxPositionSecs || 0, latestSession.lastPositionSecs || 0), song.durationSeconds)
      : 0;

    const response = {
      songId,
      resumePositionSecs,
      updatedAt: latestSession?.updatedAt || null,
    };

    if (options.includeEvents) {
      response.scaffoldEvents = ['playback_started', 'playback_session_progress', 'playback_completed'];
    }

    return response;
  }
}

function createPlaybackService(dependencies) {
  return new PlaybackService(dependencies);
}

module.exports = {
  PlaybackService,
  createPlaybackService,
};
