const express = require('express');

const { createAdminRouter } = require('../modules/admin/admin.routes');
const { createAdsRouter } = require('../modules/ads/ads.routes');
const { createAnalyticsRouter } = require('../modules/analytics/analytics.routes');
const { createAuthRouter } = require('../modules/auth/auth.routes');
const { createBillingRouter } = require('../modules/billing/billing.routes');
const { createInteractionRouter } = require('../modules/catalog/interaction.routes');
const { createLibraryRouter } = require('../modules/catalog/library.routes');
const { createPlaylistRouter } = require('../modules/catalog/playlist.routes');
const { createOfflineRouter } = require('../modules/media/offline.routes');
const { createUploadRouter } = require('../modules/media/upload.routes');
const { createNotificationsRouter } = require('../modules/notifications/notifications.routes');
const { createProfileRouter } = require('../modules/profile/profile.routes');
const { healthRouter } = require('./health.routes');

const apiRouter = express.Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/admin', createAdminRouter());
apiRouter.use('/ads', createAdsRouter());
apiRouter.use('/analytics', createAnalyticsRouter());
apiRouter.use('/auth', createAuthRouter());
apiRouter.use('/billing', createBillingRouter());
apiRouter.use('/notifications', createNotificationsRouter());
apiRouter.use('/profile', createProfileRouter());
apiRouter.use('/interactions', createInteractionRouter());
apiRouter.use('/library', createLibraryRouter());
apiRouter.use('/playlists', createPlaylistRouter());
apiRouter.use('/offline', createOfflineRouter());
apiRouter.use('/uploads', createUploadRouter());

module.exports = { apiRouter };