const test = require('node:test');
const assert = require('node:assert/strict');
const bcrypt = require('bcryptjs');

const { AuthService } = require('../../src/modules/auth/auth.service');
const { AuthError } = require('../../src/modules/auth/auth.errors');
const { hashRefreshToken, signRefreshToken } = require('../../src/modules/auth/auth.tokens');

function createEnv() {
  return {
    app: { env: 'development', nodeEnv: 'development' },
    auth: {
      jwtSecret: 'jwt-secret-for-tests-12345',
      jwtExpiresIn: '15m',
      refreshTokenSecret: 'refresh-secret-for-tests-12345',
      refreshTokenExpiresIn: '30d',
      passwordHashRounds: 10,
      social: {
        google: { enabled: false, clientId: '' },
        apple: { enabled: false, serviceId: '' },
      },
    },
  };
}

function createMockPrisma() {
  return {
    user: {
      findUnique: async () => null,
      create: async () => null,
    },
    authSession: {
      create: async () => ({ id: 'session-1' }),
      update: async () => ({}),
      findUnique: async () => null,
      updateMany: async () => ({ count: 0 }),
    },
  };
}

test('signup creates user and returns token payload', async () => {
  const prisma = createMockPrisma();
  const env = createEnv();

  prisma.user.create = async ({ data }) => ({
    id: 'user-1',
    email: data.email,
    role: 'USER',
    status: 'ACTIVE',
    passwordHash: data.passwordHash,
    profile: { displayName: data.profile.create.displayName },
  });

  let createdSessionData;
  prisma.authSession.create = async ({ data }) => {
    createdSessionData = data;
    return { id: 'session-1' };
  };

  const service = new AuthService({ prisma, env });
  const result = await service.signup({
    email: 'new.user@example.com',
    password: 'StrongPass1',
    displayName: 'New User',
  });

  assert.equal(result.user.email, 'new.user@example.com');
  assert.equal(result.user.displayName, 'New User');
  assert.equal(result.tokenType, 'Bearer');
  assert.equal(typeof result.accessToken, 'string');
  assert.equal(typeof result.refreshToken, 'string');
  assert.equal(createdSessionData.userId, 'user-1');
});

test('login rejects invalid credentials', async () => {
  const prisma = createMockPrisma();
  const env = createEnv();

  prisma.user.findUnique = async () => ({
    id: 'user-2',
    email: 'a@b.com',
    role: 'USER',
    status: 'ACTIVE',
    passwordHash: await bcrypt.hash('ValidPass1', 10),
    profile: { displayName: 'Alice' },
  });

  const service = new AuthService({ prisma, env });

  await assert.rejects(
    () => service.login({ email: 'a@b.com', password: 'WrongPass1' }),
    (error) => error instanceof AuthError && error.code === 'INVALID_CREDENTIALS'
  );
});

test('refresh rotates token for active session', async () => {
  const prisma = createMockPrisma();
  const env = createEnv();

  const user = {
    id: 'user-9',
    email: 'refresh@example.com',
    role: 'USER',
    status: 'ACTIVE',
    profile: { displayName: 'Refresh User' },
  };

  const incomingRefreshToken = signRefreshToken('session-9', user, env);
  prisma.authSession.findUnique = async () => ({
    id: 'session-9',
    userId: user.id,
    status: 'ACTIVE',
    refreshTokenHash: hashRefreshToken(incomingRefreshToken),
    expiresAt: new Date(Date.now() + 60_000),
    user,
  });

  let updatePayload;
  prisma.authSession.update = async (payload) => {
    updatePayload = payload;
    return payload;
  };

  const service = new AuthService({ prisma, env });
  const refreshed = await service.refresh(incomingRefreshToken);

  assert.equal(refreshed.user.id, user.id);
  assert.equal(typeof refreshed.accessToken, 'string');
  assert.equal(typeof refreshed.refreshToken, 'string');
  assert.ok(updatePayload.data.refreshTokenHash);
});

test('social auth returns scaffold error when not configured', async () => {
  const service = new AuthService({ prisma: createMockPrisma(), env: createEnv() });

  await assert.rejects(
    () => service.socialLogin('google', { idToken: 'some-id-token-value' }),
    (error) => error instanceof AuthError && error.code === 'SOCIAL_AUTH_NOT_CONFIGURED'
  );
});

test('login uses provided device id in auth session', async () => {
  const prisma = createMockPrisma();
  const env = createEnv();

  prisma.user.findUnique = async () => ({
    id: 'user-device',
    email: 'device@example.com',
    role: 'USER',
    status: 'ACTIVE',
    passwordHash: await bcrypt.hash('ValidPass1', 10),
    profile: { displayName: 'Device User' },
  });

  let createdSessionData;
  prisma.authSession.create = async ({ data }) => {
    createdSessionData = data;
    return { id: 'session-device' };
  };

  const service = new AuthService({ prisma, env });
  await service.login(
    {
      email: 'device@example.com',
      password: 'ValidPass1',
      deviceId: 'mobile-ios-123',
    },
    {
      deviceId: 'mobile-ios-123',
    }
  );

  assert.equal(createdSessionData.deviceId, 'mobile-ios-123');
});

test('signup rejects duplicate email addresses', async () => {
  const prisma = createMockPrisma();
  const env = createEnv();

  prisma.user.findUnique = async () => ({ id: 'existing-user' });

  const service = new AuthService({ prisma, env });

  await assert.rejects(
    () => service.signup({ email: 'taken@example.com', password: 'StrongPass1' }),
    (error) => error instanceof AuthError && error.code === 'EMAIL_ALREADY_EXISTS'
  );
});

test('refresh revokes session on refresh token hash mismatch', async () => {
  const prisma = createMockPrisma();
  const env = createEnv();

  const user = {
    id: 'user-x',
    email: 'user-x@example.com',
    role: 'USER',
    status: 'ACTIVE',
    profile: { displayName: 'User X' },
  };

  const incomingRefreshToken = signRefreshToken('session-x', user, env);
  let revokedPayload;

  prisma.authSession.findUnique = async () => ({
    id: 'session-x',
    userId: user.id,
    status: 'ACTIVE',
    refreshTokenHash: hashRefreshToken('different-token'),
    expiresAt: new Date(Date.now() + 60_000),
    user,
  });

  prisma.authSession.update = async (payload) => {
    revokedPayload = payload;
    return payload;
  };

  const service = new AuthService({ prisma, env });

  await assert.rejects(
    () => service.refresh(incomingRefreshToken),
    (error) => error instanceof AuthError && error.code === 'INVALID_REFRESH_TOKEN'
  );

  assert.equal(revokedPayload.data.status, 'REVOKED');
});

test('issueTokensForUser sanitizes very long device id', async () => {
  const prisma = createMockPrisma();
  const env = createEnv();
  const service = new AuthService({ prisma, env });

  let createdSessionData;
  prisma.authSession.create = async ({ data }) => {
    createdSessionData = data;
    return { id: 'session-long-device' };
  };

  await service.issueTokensForUser(
    {
      id: 'user-long-device',
      email: 'device@example.com',
      role: 'USER',
      status: 'ACTIVE',
      profile: { displayName: 'Long Device User' },
    },
    {
      deviceId: 'x'.repeat(400),
    }
  );

  assert.equal(createdSessionData.deviceId.length, 190);
});
