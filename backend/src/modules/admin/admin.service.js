const { AdminError } = require('./admin.errors');

const USER_SORT_FIELDS = new Set(['createdAt', 'email', 'role', 'status']);

function parseDateRange(startDate, endDate) {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new AdminError(400, 'INVALID_DATE_RANGE', 'startDate and endDate must be valid ISO date values.');
  }

  if (start > end) {
    throw new AdminError(400, 'INVALID_DATE_RANGE', 'startDate must be before or equal to endDate.');
  }

  return { start, end };
}

class AdminService {
  constructor({ prisma } = {}) {
    this.prisma = prisma || require('../../repositories/prismaClient').prisma;
  }

  // ==================== USER MANAGEMENT ====================

  async getUsers(filters = {}) {
    const { page = 1, limit = 20, search = '', sort = 'desc', sortBy = 'createdAt' } = filters;

    const skip = (page - 1) * limit;
    const where = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { profile: { is: { displayName: { contains: search, mode: 'insensitive' } } } },
      ];
    }

    const orderField = USER_SORT_FIELDS.has(sortBy) ? sortBy : 'createdAt';
    const orderDirection = sort === 'asc' ? 'asc' : 'desc';

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          profile: { select: { displayName: true, avatarUrl: true } },
        },
        skip,
        take: limit,
        orderBy: { [orderField]: orderDirection },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async getUserDetails(userId) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        preferences: true,
        subscriptions: { include: { plan: true } },
        uploads: { take: 10, orderBy: { createdAt: 'desc' } },
        _count: {
          select: {
            songsUploaded: true,
            playlists: true,
            favorites: true,
            recentPlays: true,
              payments: true,
          },
        },
      },
    });

    if (!user) {
      throw new AdminError(404, 'USER_NOT_FOUND', 'User not found.');
    }

    return user;
  }

  async suspendUser(userId, input) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AdminError(404, 'USER_NOT_FOUND', 'User not found.');
    }

    if (user.status === 'SUSPENDED') {
      throw new AdminError(400, 'USER_ALREADY_SUSPENDED', 'User is already suspended.');
    }

    // Update user status
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED' },
      select: { id: true, email: true, status: true },
    });

    // Invalidate all active sessions
    await this.prisma.authSession.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });

    // Revoke device sessions
    await this.prisma.deviceSession.updateMany({
      where: { userId, status: 'ACTIVE' },
      data: { status: 'REVOKED', revokedAt: new Date() },
    });

    return { success: true, user: updated, reason: input.reason };
  }

  async activateUser(userId, input = {}) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AdminError(404, 'USER_NOT_FOUND', 'User not found.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE' },
      select: { id: true, email: true, status: true },
    });

    return { success: true, user: updated, reason: input.reason || 'Manually activated by admin' };
  }

  async deleteUser(userId, input) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AdminError(404, 'USER_NOT_FOUND', 'User not found.');
    }

    if (input.anonymize) {
      // Anonymize user data instead of deleting
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          email: `deleted_${userId}@deleted.local`,
          passwordHash: '',
          status: 'DELETED',
          deletedAt: new Date(),
          profile: {
            upsert: {
              update: {
                displayName: 'Deleted User',
                bio: null,
                avatarUrl: null,
              },
              create: {
                displayName: 'Deleted User',
              },
            },
          },
        },
      });
    } else {
      // Hard delete
      await this.prisma.user.delete({ where: { id: userId } });
    }

    return { success: true, userId, anonymized: input.anonymize };
  }

  async updateUserRole(userId, input) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new AdminError(404, 'USER_NOT_FOUND', 'User not found.');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { role: input.role },
      select: { id: true, email: true, role: true },
    });

    return updated;
  }

  // ==================== CONTENT MODERATION ====================

  async getUploadsForReview(filters = {}) {
    const { page = 1, limit = 20, sort = 'asc' } = filters;
    const skip = (page - 1) * limit;

    const [uploads, total] = await Promise.all([
      this.prisma.upload.findMany({
        where: { status: 'PROCESSING' },
        include: {
          user: { select: { id: true, email: true, profile: { select: { displayName: true } } } },
          song: true,
        },
        skip,
        take: limit,
        orderBy: { createdAt: sort },
      }),
      this.prisma.upload.count({ where: { status: 'PROCESSING' } }),
    ]);

    return {
      data: uploads,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async reviewUpload(uploadId, input) {
    const upload = await this.prisma.upload.findUnique({
      where: { id: uploadId },
      include: { song: true },
    });

    if (!upload) {
      throw new AdminError(404, 'UPLOAD_NOT_FOUND', 'Upload not found.');
    }

    const status = input.status === 'APPROVED' ? 'COMPLETED' : 'REJECTED';

    const updated = await this.prisma.upload.update({
      where: { id: uploadId },
      data: {
        status,
        metadata: {
          ...upload.metadata,
          moderationNotes: input.moderationNotes,
          actionItems: input.actionItems || [],
          reviewedAt: new Date().toISOString(),
        },
      },
    });

    if (upload.songId) {
      // If approved, mark linked song as ready.
      if (status === 'COMPLETED') {
        await this.prisma.song.update({
          where: { id: upload.songId },
          data: { status: 'READY' },
        });
      }

      // If rejected, mark linked song as blocked.
      if (status === 'REJECTED') {
        await this.prisma.song.update({
          where: { id: upload.songId },
          data: { status: 'BLOCKED' },
        });
      }
    }

    return updated;
  }

  async blockSong(songId, input) {
    const song = await this.prisma.song.findUnique({
      where: { id: songId },
      include: { uploadedBy: true },
    });

    if (!song) {
      throw new AdminError(404, 'SONG_NOT_FOUND', 'Song not found.');
    }

    if (song.status === 'BLOCKED') {
      throw new AdminError(400, 'SONG_ALREADY_BLOCKED', 'Song is already blocked.');
    }

    const updated = await this.prisma.song.update({
      where: { id: songId },
      data: {
        status: 'BLOCKED',
        metadata: {
          ...song.metadata,
          blockReason: input.reason,
          blockDetails: input.details,
          blockDate: new Date().toISOString(),
          permanent: input.permanent,
        },
      },
    });

    // Optionally clear search index cache
    // await clearSearchCache(songId);

    return updated;
  }

  async unblockSong(songId, input) {
    const song = await this.prisma.song.findUnique({ where: { id: songId } });

    if (!song) {
      throw new AdminError(404, 'SONG_NOT_FOUND', 'Song not found.');
    }

    if (song.status !== 'BLOCKED') {
      throw new AdminError(400, 'SONG_NOT_BLOCKED', 'Song is not blocked.');
    }

    const updated = await this.prisma.song.update({
      where: { id: songId },
      data: {
        status: 'READY',
        metadata: {
          ...song.metadata,
          unblockReason: input.reason,
          unblockDate: new Date().toISOString(),
        },
      },
    });

    return updated;
  }

  // ==================== PROMO CODE MANAGEMENT ====================

  async getPromoCodes(filters = {}) {
    const { page = 1, limit = 20, isActive } = filters;
    const skip = (page - 1) * limit;

    const where = isActive !== undefined ? { isActive } : {};

    const [codes, total] = await Promise.all([
      this.prisma.promoCode.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { createdBy: { select: { email: true } } },
      }),
      this.prisma.promoCode.count({ where }),
    ]);

    return {
      data: codes,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async createPromoCode(input, adminId) {
    // Check if code already exists
    const existing = await this.prisma.promoCode.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new AdminError(409, 'PROMO_CODE_EXISTS', 'This promo code already exists.');
    }

    const created = await this.prisma.promoCode.create({
      data: {
        code: input.code,
        description: input.description,
        discountType: input.discountType,
        discountValue: input.discountValue,
        maxRedemptions: input.maxRedemptions,
        startsAt: input.startsAt ? new Date(input.startsAt) : null,
        expiresAt: new Date(input.expiresAt),
        isActive: true,
        createdByUserId: adminId,
      },
    });

    return created;
  }

  async updatePromoCode(codeId, input) {
    const code = await this.prisma.promoCode.findUnique({ where: { id: codeId } });

    if (!code) {
      throw new AdminError(404, 'PROMO_CODE_NOT_FOUND', 'Promo code not found.');
    }

    const updated = await this.prisma.promoCode.update({
      where: { id: codeId },
      data: {
        description: input.description,
        isActive: input.isActive,
        maxRedemptions: input.maxRedemptions,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : undefined,
      },
    });

    return updated;
  }

  async deletePromoCode(codeId) {
    const code = await this.prisma.promoCode.findUnique({ where: { id: codeId } });

    if (!code) {
      throw new AdminError(404, 'PROMO_CODE_NOT_FOUND', 'Promo code not found.');
    }

    await this.prisma.promoCode.delete({ where: { id: codeId } });

    return { success: true, codeId };
  }

  // ==================== PLAN MANAGEMENT ====================

  async getPlans(filters = {}) {
    const { isActive } = filters;
    const where = isActive !== undefined ? { isActive } : {};

    return this.prisma.plan.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        _count: { select: { subscriptions: true } },
      },
    });
  }

  async createPlan(input) {
    // Check if plan code already exists
    const existing = await this.prisma.plan.findUnique({
      where: { code: input.code },
    });

    if (existing) {
      throw new AdminError(409, 'PLAN_EXISTS', 'A plan with this code already exists.');
    }

    const created = await this.prisma.plan.create({
      data: {
        code: input.code,
        name: input.name,
        description: input.description,
        interval: input.interval,
        priceCents: input.priceCents,
        currency: input.currency,
        isActive: input.isActive,
      },
    });

    return created;
  }

  async updatePlan(planId, input) {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });

    if (!plan) {
      throw new AdminError(404, 'PLAN_NOT_FOUND', 'Plan not found.');
    }

    const updated = await this.prisma.plan.update({
      where: { id: planId },
      data: {
        name: input.name,
        description: input.description,
        priceCents: input.priceCents,
        currency: input.currency,
        isActive: input.isActive,
      },
    });

    return updated;
  }

  async deletePlan(planId) {
    const plan = await this.prisma.plan.findUnique({
      where: { id: planId },
      include: { _count: { select: { subscriptions: true } } },
    });

    if (!plan) {
      throw new AdminError(404, 'PLAN_NOT_FOUND', 'Plan not found.');
    }

    if (plan._count.subscriptions > 0) {
      throw new AdminError(
        400,
        'PLAN_IN_USE',
        'Cannot delete a plan that has active subscriptions.'
      );
    }

    await this.prisma.plan.delete({ where: { id: planId } });

    return { success: true, planId };
  }

  // ==================== ANALYTICS & REPORTING ====================

  async getDashboardStats(startDate, endDate) {
    const { start, end } = parseDateRange(startDate, endDate);

    const [totalUsers, activeUsers, totalPlays, totalRevenue, totalSubscriptions] =
      await Promise.all([
        this.prisma.user.count(),
        this.prisma.user.count({
          where: {
            playbackSessions: {
              some: {
                createdAt: { gte: start, lte: end },
              },
            },
          },
        }),
        this.prisma.recentPlay.count({
          where: { playedAt: { gte: start, lte: end } },
        }),
        this.prisma.payment.aggregate({
          _sum: { amountCents: true },
          where: {
            paidAt: { gte: start, lte: end },
            status: 'SUCCEEDED',
          },
        }),
        this.prisma.subscription.count({
          where: { createdAt: { gte: start, lte: end } },
        }),
      ]);

    return {
      totalUsers,
      activeUsers: Math.round((activeUsers / totalUsers) * 100 || 0),
      totalPlays,
      totalRevenue: totalRevenue._sum?.amountCents || 0,
      totalSubscriptions,
      periodStart: start,
      periodEnd: end,
    };
  }

  async getUserGrowthMetrics(startDate, endDate, breakdown = 'DAILY') {
    const { start, end } = parseDateRange(startDate, endDate);
    const normalizedBreakdown = ['DAILY', 'WEEKLY', 'MONTHLY'].includes(breakdown)
      ? breakdown
      : 'DAILY';

    const periods = [];
    let cursor = new Date(start);

    while (cursor <= end) {
      const periodStart = new Date(cursor);
      let periodEnd = new Date(cursor);
      let label = '';

      if (normalizedBreakdown === 'DAILY') {
        periodEnd.setUTCHours(23, 59, 59, 999);
        label = periodStart.toISOString().slice(0, 10);
        cursor.setUTCDate(cursor.getUTCDate() + 1);
      } else if (normalizedBreakdown === 'WEEKLY') {
        periodEnd.setUTCDate(periodEnd.getUTCDate() + 6);
        periodEnd.setUTCHours(23, 59, 59, 999);
        label = `${periodStart.getUTCFullYear()}-W${String(Math.ceil(periodStart.getUTCDate() / 7)).padStart(2, '0')}`;
        cursor.setUTCDate(cursor.getUTCDate() + 7);
      } else {
        periodEnd = new Date(Date.UTC(periodStart.getUTCFullYear(), periodStart.getUTCMonth() + 1, 0, 23, 59, 59, 999));
        label = `${periodStart.getUTCFullYear()}-${String(periodStart.getUTCMonth() + 1).padStart(2, '0')}`;
        cursor = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth() + 1, 1));
      }

      if (periodEnd > end) {
        periodEnd = new Date(end);
      }

      periods.push({ label, periodStart, periodEnd });
    }

    return Promise.all(
      periods.map(async ({ label, periodStart, periodEnd }) => {
        const [signups, total] = await Promise.all([
          this.prisma.user.count({
            where: {
              createdAt: {
                gte: periodStart,
                lte: periodEnd,
              },
            },
          }),
          this.prisma.user.count({
            where: {
              createdAt: {
                lte: periodEnd,
              },
            },
          }),
        ]);

        return {
          period: label,
          signups,
          total,
        };
      })
    );
  }

  // ==================== NOTIFICATIONS ====================

  async sendNotification(input) {
    const recipients = new Set();

    // Determine recipients based on input
    if (input.recipientType === 'USER') {
      if (!input.recipientIds?.length) {
        throw new AdminError(400, 'RECIPIENTS_REQUIRED', 'recipientIds is required for recipientType USER.');
      }
      recipients.add(input.recipientIds[0]);
    } else if (input.recipientType === 'USERS') {
      if (!input.recipientIds?.length) {
        throw new AdminError(400, 'RECIPIENTS_REQUIRED', 'recipientIds is required for recipientType USERS.');
      }
      input.recipientIds.forEach((recipientId) => recipients.add(recipientId));
    } else if (input.recipientType === 'ALL') {
      const allUsers = await this.prisma.user.findMany({
        select: { id: true },
        where: { status: 'ACTIVE' },
      });
      allUsers.forEach((user) => recipients.add(user.id));
    } else if (input.recipientType === 'SEGMENT' && input.segment) {
      // Implement segment-based targeting
      const segment = await this.getSegmentUsers(input.segment);
      segment.forEach((user) => recipients.add(user.id));
    }

    const recipientIds = [...recipients];
    if (!recipientIds.length) {
      return {
        success: true,
        notificationsSent: 0,
        recipientCount: 0,
      };
    }

    // Create notifications for all recipients
    const rows = recipientIds.flatMap((userId) =>
      input.channels.map((channel) => ({
        userId,
        channel,
        type: 'ADMIN_BROADCAST',
        title: input.title,
        body: input.message,
        metadata: input.actionUrl ? { actionUrl: input.actionUrl } : undefined,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : new Date(),
        status: 'QUEUED',
      }))
    );

    const notifications = await this.prisma.notification.createMany({
      data: rows,
    });

    return {
      success: true,
      notificationsSent: notifications.count,
      recipientCount: recipientIds.length,
    };
  }

  async getSegmentUsers(segment) {
    // Implement logic to get users based on segment
    // Examples: PREMIUM_USERS, INACTIVE_30_DAYS, HIGH_ENGAGEMENT, etc.
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let users = [];

    switch (segment) {
      case 'PREMIUM_USERS':
        users = await this.prisma.user.findMany({
          where: {
            subscriptions: {
              some: {
                status: 'ACTIVE',
              },
            },
          },
          select: { id: true },
        });
        break;

      case 'INACTIVE_30_DAYS':
        users = await this.prisma.user.findMany({
          where: {
            recentPlays: {
              none: {
                playedAt: { gte: thirtyDaysAgo },
              },
            },
            status: 'ACTIVE',
          },
          select: { id: true },
        });
        break;

      case 'HIGH_ENGAGEMENT':
        users = await this.prisma.user.findMany({
          where: {
            recentPlays: {
              some: {
                playedAt: { gte: thirtyDaysAgo },
              },
            },
          },
          select: { id: true },
        });
        break;

      default:
        throw new AdminError(400, 'UNKNOWN_SEGMENT', `Unsupported segment: ${segment}`);
    }

    return users;
  }
}

function createAdminService(options = {}) {
  return new AdminService(options);
}

module.exports = { AdminService, createAdminService };
