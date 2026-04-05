const express = require('express');

const { createAdminController } = require('./admin.controller');
const {
  suspendUserSchema,
  activateUserSchema,
  deleteUserSchema,
  updateUserRoleSchema,
  reviewUploadSchema,
  blockSongSchema,
  unblockSongSchema,
  createPromoCodeSchema,
  updatePromoCodeSchema,
  createPlanSchema,
  updatePlanSchema,
  sendNotificationSchema,
  validateBody,
} = require('./admin.schemas');
const { requireAdmin, logAdminAction } = require('./admin.middleware');
const { requireAuth } = require('../auth/auth.middleware');

function createAdminRouter(options = {}) {
  const router = express.Router();
  const adminController = options.controller || createAdminController();
  const authGuard = options.requireAuth || requireAuth;
  const adminGuard = options.requireAdmin || requireAdmin;

  // Apply auth and admin guards to all routes
  router.use(authGuard());
  router.use(adminGuard());

  // ==================== USER MANAGEMENT ====================

  // Get all users with filters
  router.get('/users', adminController.getUsers);

  // Get user details
  router.get('/users/:userId', adminController.getUserDetails);

  // Suspend user
  router.post(
    '/users/:userId/suspend',
    logAdminAction('SUSPEND_USER', 'USER', ':userId'),
    validateBody(suspendUserSchema),
    adminController.suspendUser
  );

  // Activate user
  router.post(
    '/users/:userId/activate',
    logAdminAction('ACTIVATE_USER', 'USER', ':userId'),
    validateBody(activateUserSchema),
    adminController.activateUser
  );

  // Delete user
  router.delete(
    '/users/:userId',
    logAdminAction('DELETE_USER', 'USER', ':userId'),
    validateBody(deleteUserSchema),
    adminController.deleteUser
  );

  // Update user role
  router.patch(
    '/users/:userId/role',
    logAdminAction('UPDATE_USER_ROLE', 'USER', ':userId'),
    validateBody(updateUserRoleSchema),
    adminController.updateUserRole
  );

  // ==================== CONTENT MODERATION ====================

  // Get uploads pending review
  router.get('/moderation/uploads', adminController.getUploadsForReview);

  // Review upload (approve/reject)
  router.post(
    '/moderation/uploads/:uploadId/review',
    logAdminAction('REVIEW_UPLOAD', 'UPLOAD', ':uploadId'),
    validateBody(reviewUploadSchema),
    adminController.reviewUpload
  );

  // Block a song
  router.post(
    '/moderation/songs/:songId/block',
    logAdminAction('BLOCK_SONG', 'SONG', ':songId'),
    validateBody(blockSongSchema),
    adminController.blockSong
  );

  // Unblock a song
  router.post(
    '/moderation/songs/:songId/unblock',
    logAdminAction('UNBLOCK_SONG', 'SONG', ':songId'),
    validateBody(unblockSongSchema),
    adminController.unblockSong
  );

  // ==================== PROMO CODE MANAGEMENT ====================

  // Get all promo codes
  router.get('/promo-codes', adminController.getPromoCodes);

  // Create promo code
  router.post(
    '/promo-codes',
    logAdminAction('CREATE_PROMO_CODE', 'PROMO_CODE', 'NEW'),
    validateBody(createPromoCodeSchema),
    adminController.createPromoCode
  );

  // Update promo code
  router.patch(
    '/promo-codes/:codeId',
    logAdminAction('UPDATE_PROMO_CODE', 'PROMO_CODE', ':codeId'),
    validateBody(updatePromoCodeSchema),
    adminController.updatePromoCode
  );

  // Delete promo code
  router.delete(
    '/promo-codes/:codeId',
    logAdminAction('DELETE_PROMO_CODE', 'PROMO_CODE', ':codeId'),
    adminController.deletePromoCode
  );

  // ==================== PLAN MANAGEMENT ====================

  // Get all plans
  router.get('/plans', adminController.getPlans);

  // Create plan
  router.post(
    '/plans',
    logAdminAction('CREATE_PLAN', 'PLAN', 'NEW'),
    validateBody(createPlanSchema),
    adminController.createPlan
  );

  // Update plan
  router.patch(
    '/plans/:planId',
    logAdminAction('UPDATE_PLAN', 'PLAN', ':planId'),
    validateBody(updatePlanSchema),
    adminController.updatePlan
  );

  // Delete plan
  router.delete(
    '/plans/:planId',
    logAdminAction('DELETE_PLAN', 'PLAN', ':planId'),
    adminController.deletePlan
  );

  // ==================== ANALYTICS & REPORTING ====================

  // Get dashboard stats
  router.get('/analytics/dashboard', adminController.getDashboardStats);

  // Get user growth metrics
  router.get('/analytics/user-growth', adminController.getUserGrowthMetrics);

  // ==================== NOTIFICATIONS ====================

  // Send notification to users
  router.post(
    '/notifications/send',
    logAdminAction('SEND_NOTIFICATION', 'NOTIFICATION', 'NEW'),
    validateBody(sendNotificationSchema),
    adminController.sendNotification
  );

  // Health check
  router.get('/health', (_request, response) => {
    response.status(200).json({ ok: true, scope: 'admin' });
  });

  return router;
}

module.exports = { createAdminRouter };
