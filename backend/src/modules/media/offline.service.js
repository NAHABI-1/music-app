const { OfflineRepository } = require('../../repositories/offline.repository');
const {
  getExpiryForTier: getSharedExpiryForTier,
  getOfflineLimitForTier: getSharedOfflineLimitForTier,
  resolvePlanTier,
} = require('../../services/entitlements');
const { createAnalyticsTracker } = require('../../services/analyticsTracker');
const { OfflineError } = require('./offline.errors');

function toDownloadDto(download) {
  return {
    id: download.id,
    userId: download.userId,
    songId: download.songId,
    deviceSessionId: download.deviceSessionId,
    localPath: download.localPath,
    status: download.status,
    expiresAt: download.expiresAt,
    downloadedAt: download.downloadedAt,
    createdAt: download.createdAt,
    updatedAt: download.updatedAt,
    song: download.song || null,
    deviceSession: download.deviceSession || null,
  };
}

class OfflineService {
  constructor({ offlineRepository = new OfflineRepository(), analyticsTracker = createAnalyticsTracker() } = {}) {
    this.offlineRepository = offlineRepository;
    this.analyticsTracker = analyticsTracker;
  }

  determinePlanTier(subscription) {
    return resolvePlanTier(subscription);
  }

  getOfflineLimitForTier(planTier) {
    return getSharedOfflineLimitForTier(planTier);
  }

  getExpiryForTier(planTier) {
    return getSharedExpiryForTier(planTier);
  }

  buildPendingLocalPath(deviceSessionId, songId) {
    return `pending://offline/${deviceSessionId}/${songId}`;
  }

  async requestOfflineAccess(userId, input) {
    const song = await this.offlineRepository.findAccessibleReadySong(userId, input.songId);
    if (!song) {
      throw new OfflineError(404, 'SONG_NOT_OFFLINE_ELIGIBLE', 'Song is not available for offline access.');
    }

    const deviceSession = await this.offlineRepository.findActiveDeviceSession(userId, input.deviceSessionId);
    if (!deviceSession) {
      throw new OfflineError(400, 'INVALID_DEVICE_SESSION', 'Device session is invalid or inactive.');
    }

    const existing = await this.offlineRepository.getDownloadBySongAndDevice(userId, input.songId, input.deviceSessionId);
    if (existing && ['QUEUED', 'DOWNLOADING', 'READY'].includes(existing.status)) {
      await this.analyticsTracker.trackEvent({
        userId,
        deviceSessionId: input.deviceSessionId,
        eventName: 'download_requested',
        properties: {
          songId: input.songId,
          downloadId: existing.id,
          mode: 'existing',
        },
      });

      return {
        download: toDownloadDto(existing),
        entitlement: {
          eligible: true,
          reason: 'EXISTING_DOWNLOAD',
        },
      };
    }

    const subscription = await this.offlineRepository.getCurrentSubscription(userId);
    const planTier = this.determinePlanTier(subscription);
    const offlineLimit = this.getOfflineLimitForTier(planTier);

    const activeCount = await this.offlineRepository.countActiveOfflineDownloads(userId);
    if (activeCount >= offlineLimit) {
      throw new OfflineError(
        403,
        'OFFLINE_LIMIT_EXCEEDED',
        `Offline limit exceeded for ${planTier.toLowerCase()} tier.`,
        {
          limit: offlineLimit,
          activeCount,
          tier: planTier,
        }
      );
    }

    const download = await this.offlineRepository.createOfflineDownload({
      userId,
      songId: input.songId,
      deviceSessionId: input.deviceSessionId,
      localPath: this.buildPendingLocalPath(input.deviceSessionId, input.songId),
      status: 'QUEUED',
      expiresAt: this.getExpiryForTier(planTier),
      downloadedAt: null,
      encryptionKeyId: null,
    });

    await this.analyticsTracker.trackEvent({
      userId,
      deviceSessionId: input.deviceSessionId,
      eventName: 'download_requested',
      properties: {
        songId: input.songId,
        downloadId: download.id,
        tier: planTier,
      },
    });

    return {
      download: toDownloadDto(download),
      entitlement: {
        eligible: true,
        reason: 'GRANTED',
        tier: planTier,
        limit: offlineLimit,
      },
      downloadRequirements: {
        mustCacheOnDevice: true,
        statusEndpoint: `/api/v1/offline/downloads/${download.id}/status`,
      },
    };
  }

  async updateDownloadStatus(userId, downloadId, input) {
    const current = await this.offlineRepository.getOfflineDownloadById(userId, downloadId);
    if (!current) {
      throw new OfflineError(404, 'DOWNLOAD_NOT_FOUND', 'Offline download record was not found.');
    }

    if (current.deviceSessionId !== input.deviceSessionId) {
      throw new OfflineError(
        403,
        'DEVICE_SESSION_MISMATCH',
        'Download status updates must originate from the owning device session.'
      );
    }

    const updates = {
      status: input.status,
      ...(input.localPath ? { localPath: input.localPath } : {}),
      ...(input.status === 'READY' ? { downloadedAt: new Date() } : {}),
    };

    const updateResult = await this.offlineRepository.updateOfflineDownloadById(userId, downloadId, updates);
    if (!updateResult || updateResult.count === 0) {
      throw new OfflineError(404, 'DOWNLOAD_NOT_FOUND', 'Offline download record was not found.');
    }

    const updated = await this.offlineRepository.getOfflineDownloadById(userId, downloadId);

    if (updated && input.status === 'READY') {
      await this.analyticsTracker.trackEvent({
        userId,
        deviceSessionId: input.deviceSessionId,
        eventName: 'download_completed',
        properties: {
          songId: updated.songId,
          downloadId: updated.id,
        },
      });
    }

    return {
      download: toDownloadDto(updated),
    };
  }

  async listDownloads(userId, query) {
    const rows = await this.offlineRepository.listOfflineDownloads(userId, {
      deviceSessionId: query.deviceSessionId,
      status: query.status,
    });

    return {
      data: rows.map(toDownloadDto),
      total: rows.length,
    };
  }

  async validateEntitlement(userId, songId, query) {
    const song = await this.offlineRepository.findAccessibleReadySong(userId, songId);
    if (!song) {
      return {
        eligible: false,
        entitled: false,
        reason: 'SONG_NOT_OFFLINE_ELIGIBLE',
      };
    }

    const entitlement = await this.offlineRepository.findReadyEntitlement(
      userId,
      songId,
      query.deviceSessionId,
      new Date()
    );

    if (!entitlement) {
      return {
        eligible: true,
        entitled: false,
        reason: 'NOT_DOWNLOADED_ON_DEVICE',
      };
    }

    if (!entitlement.localPath || entitlement.localPath.startsWith('pending://')) {
      return {
        eligible: true,
        entitled: false,
        reason: 'DEVICE_FILE_NOT_READY',
      };
    }

    return {
      eligible: true,
      entitled: true,
      reason: 'ENTITLED',
      download: toDownloadDto(entitlement),
    };
  }

  async revokeDownload(userId, downloadId) {
    const result = await this.offlineRepository.updateOfflineDownloadById(userId, downloadId, {
      status: 'DELETED',
      expiresAt: new Date(),
    });

    if (!result || result.count === 0) {
      throw new OfflineError(404, 'DOWNLOAD_NOT_FOUND', 'Offline download record was not found.');
    }

    return {
      revoked: true,
      downloadId,
    };
  }

  async expireDownloads(userId) {
    const result = await this.offlineRepository.expireDownloads(userId, new Date());

    return {
      expiredCount: result.count || 0,
    };
  }
}

function createOfflineService(dependencies) {
  return new OfflineService(dependencies);
}

module.exports = {
  OfflineService,
  createOfflineService,
};
