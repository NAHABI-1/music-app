const bcrypt = require('bcryptjs');

const { getEnv } = require('../../config/env');
const { AuthError } = require('./auth.errors');
const {
  hashRefreshToken,
  getTokenExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} = require('./auth.tokens');

function getRequestMeta(context = {}) {
  const request = context.request;
  const normalizedDeviceId = String(context.deviceId || request?.headers['x-device-id'] || 'unknown-device')
    .trim()
    .slice(0, 190);
  const normalizedUserAgent = request?.headers['user-agent']
    ? String(request.headers['user-agent']).slice(0, 1024)
    : null;
  return {
    deviceId: normalizedDeviceId || 'unknown-device',
    userAgent: normalizedUserAgent,
    ipAddress: request?.ip || request?.socket?.remoteAddress || null,
  };
}

class AuthService {
  constructor({ prisma, env = getEnv() } = {}) {
    this.prisma = prisma || require('../../repositories/prismaClient').prisma;
    this.env = env;
  }

  async signup(input, context = {}) {
    const email = input.email.trim().toLowerCase();
    const displayName = input.displayName?.trim() || email.split('@')[0];

    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing) {
      throw new AuthError(409, 'EMAIL_ALREADY_EXISTS', 'An account with this email already exists.');
    }

    const passwordHash = await bcrypt.hash(input.password, this.env.auth.passwordHashRounds);

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
        role: 'USER',
        status: 'ACTIVE',
        profile: {
          create: {
            displayName,
            countryCode: input.countryCode?.toUpperCase(),
          },
        },
      },
      include: {
        profile: {
          select: {
            displayName: true,
          },
        },
      },
    });

    return this.issueTokensForUser(user, context);
  }

  async login(input, context = {}) {
    const email = input.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        profile: {
          select: {
            displayName: true,
          },
        },
      },
    });

    if (!user) {
      throw new AuthError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    const passwordMatches = await bcrypt.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AuthError(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
    }

    if (user.status !== 'ACTIVE') {
      throw new AuthError(403, 'ACCOUNT_NOT_ACTIVE', 'Your account is not active.');
    }

    return this.issueTokensForUser(user, context);
  }

  async refresh(refreshToken, context = {}) {
    const payload = verifyRefreshToken(refreshToken, this.env);

    const session = await this.prisma.authSession.findUnique({
      where: { id: payload.sid },
      include: {
        user: {
          include: {
            profile: {
              select: {
                displayName: true,
              },
            },
          },
        },
      },
    });

    if (!session || session.status !== 'ACTIVE' || session.userId !== payload.sub) {
      throw new AuthError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token.');
    }

    if (session.expiresAt < new Date() || !session.refreshTokenHash) {
      throw new AuthError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token.');
    }

    const incomingHash = hashRefreshToken(refreshToken);
    if (incomingHash !== session.refreshTokenHash) {
      await this.prisma.authSession.update({
        where: { id: session.id },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
        },
      });
      throw new AuthError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token.');
    }

    if (session.user.status !== 'ACTIVE') {
      throw new AuthError(403, 'ACCOUNT_NOT_ACTIVE', 'Your account is not active.');
    }

    const newRefreshToken = signRefreshToken(session.id, session.user, this.env);
    const refreshTokenExpiresAt = getTokenExpiryDate(newRefreshToken);

    const meta = getRequestMeta(context);

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: hashRefreshToken(newRefreshToken),
        refreshTokenExpiresAt,
        expiresAt: refreshTokenExpiresAt,
        lastUsedAt: new Date(),
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
      },
    });

    return {
      accessToken: signAccessToken(session.user, this.env),
      refreshToken: newRefreshToken,
      tokenType: 'Bearer',
      user: this.toSafeUser(session.user),
    };
  }

  async logout(refreshToken) {
    if (!refreshToken) {
      return { success: true };
    }

    try {
      const payload = verifyRefreshToken(refreshToken, this.env);
      await this.prisma.authSession.updateMany({
        where: {
          id: payload.sid,
          userId: payload.sub,
          status: 'ACTIVE',
        },
        data: {
          status: 'REVOKED',
          revokedAt: new Date(),
        },
      });
    } catch (_error) {
      // Intentionally swallow invalid token errors for idempotent logout.
    }

    return { success: true };
  }

  async socialLogin(provider, input, _context = {}) {
    if (provider === 'google') {
      if (!this.env.auth.social.google.enabled) {
        throw new AuthError(501, 'SOCIAL_AUTH_NOT_CONFIGURED', 'Google social auth is not configured.');
      }

      throw new AuthError(501, 'SOCIAL_AUTH_NOT_IMPLEMENTED', 'Google social auth verification scaffold is not implemented yet.');
    }

    if (provider === 'apple') {
      if (!this.env.auth.social.apple.enabled) {
        throw new AuthError(501, 'SOCIAL_AUTH_NOT_CONFIGURED', 'Apple social auth is not configured.');
      }

      throw new AuthError(501, 'SOCIAL_AUTH_NOT_IMPLEMENTED', 'Apple social auth verification scaffold is not implemented yet.');
    }

    throw new AuthError(400, 'UNSUPPORTED_PROVIDER', 'Unsupported social auth provider.');
  }

  async issueTokensForUser(user, context = {}) {
    const meta = getRequestMeta(context);

    const session = await this.prisma.authSession.create({
      data: {
        userId: user.id,
        deviceId: meta.deviceId,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        status: 'ACTIVE',
        expiresAt: new Date(),
        refreshTokenExpiresAt: new Date(),
      },
    });

    const refreshToken = signRefreshToken(session.id, user, this.env);
    const refreshTokenExpiresAt = getTokenExpiryDate(refreshToken);

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: hashRefreshToken(refreshToken),
        refreshTokenExpiresAt,
        expiresAt: refreshTokenExpiresAt,
      },
    });

    return {
      accessToken: signAccessToken(user, this.env),
      refreshToken,
      tokenType: 'Bearer',
      user: this.toSafeUser(user),
    };
  }

  toSafeUser(user) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      displayName: user.profile?.displayName || null,
    };
  }
}

function createAuthService(dependencies) {
  return new AuthService(dependencies);
}

module.exports = {
  AuthService,
  createAuthService,
};
