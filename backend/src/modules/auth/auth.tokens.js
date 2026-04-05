const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const { AuthError } = require('./auth.errors');

function hashRefreshToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function getTokenExpiryDate(token) {
  const decoded = jwt.decode(token);
  if (!decoded || typeof decoded.exp !== 'number') {
    throw new AuthError(401, 'INVALID_TOKEN', 'Invalid token payload.');
  }

  return new Date(decoded.exp * 1000);
}

function signAccessToken(user, env) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      type: 'access',
    },
    env.auth.jwtSecret,
    { expiresIn: env.auth.jwtExpiresIn }
  );
}

function signRefreshToken(sessionId, user, env) {
  return jwt.sign(
    {
      sub: user.id,
      sid: sessionId,
      role: user.role,
      type: 'refresh',
    },
    env.auth.refreshTokenSecret,
    { expiresIn: env.auth.refreshTokenExpiresIn }
  );
}

function verifyAccessToken(token, env) {
  try {
    const payload = jwt.verify(token, env.auth.jwtSecret);
    if (!payload || payload.type !== 'access') {
      throw new AuthError(401, 'INVALID_TOKEN', 'Invalid access token.');
    }
    return payload;
  } catch (_error) {
    throw new AuthError(401, 'INVALID_TOKEN', 'Invalid access token.');
  }
}

function verifyRefreshToken(token, env) {
  try {
    const payload = jwt.verify(token, env.auth.refreshTokenSecret);
    if (!payload || payload.type !== 'refresh') {
      throw new AuthError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token.');
    }
    return payload;
  } catch (_error) {
    throw new AuthError(401, 'INVALID_REFRESH_TOKEN', 'Invalid refresh token.');
  }
}

module.exports = {
  hashRefreshToken,
  getTokenExpiryDate,
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
