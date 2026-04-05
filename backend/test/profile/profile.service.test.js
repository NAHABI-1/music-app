const test = require('node:test');
const assert = require('node:assert/strict');

const { ProfileService } = require('../../src/modules/profile/profile.service');

function createRepositoryMock() {
  return {
    ensureDefaults: async () => {},
    findByUserId: async () => null,
    updateByUserId: async () => null,
  };
}

function baseUser(overrides = {}) {
  return {
    id: 'user-1',
    email: 'profile@example.com',
    role: 'USER',
    status: 'ACTIVE',
    profile: {
      displayName: 'Profile User',
      bio: null,
      countryCode: 'US',
      dateOfBirth: new Date('1999-01-01'),
      avatarUrl: null,
      avatarStorageKey: null,
      avatarMetadata: null,
      profileMetadata: null,
      updatedAt: new Date('2026-04-05T10:00:00.000Z'),
    },
    preferences: {
      inAppNotificationsEnabled: true,
      pushNotificationsEnabled: true,
      emailNotificationsEnabled: true,
      emailMarketingEnabled: false,
      emailProductUpdatesEnabled: true,
      emailSecurityAlertsEnabled: true,
      notificationTopics: { releases: true },
    },
    ...overrides,
  };
}

test('getCurrentProfile returns normalized dto', async () => {
  const repository = createRepositoryMock();
  repository.findByUserId = async () => baseUser();

  const service = new ProfileService({ profileRepository: repository });
  const profile = await service.getCurrentProfile('user-1');

  assert.equal(profile.id, 'user-1');
  assert.equal(profile.profile.displayName, 'Profile User');
  assert.equal(profile.preferences.notifications.inAppNotificationsEnabled, true);
  assert.equal(profile.preferences.email.emailMarketingEnabled, false);
});

test('updateCurrentProfile maps nested preference updates', async () => {
  const repository = createRepositoryMock();
  let receivedUpdates;
  repository.updateByUserId = async (_userId, updates) => {
    receivedUpdates = updates;
    return baseUser({
      profile: {
        ...baseUser().profile,
        displayName: 'Updated Name',
        avatarUrl: 'https://cdn.example.com/avatar.png',
      },
      preferences: {
        ...baseUser().preferences,
        pushNotificationsEnabled: false,
        emailMarketingEnabled: true,
      },
    });
  };

  const service = new ProfileService({ profileRepository: repository });
  const updated = await service.updateCurrentProfile('user-1', {
    displayName: 'Updated Name',
    avatarUrl: 'https://cdn.example.com/avatar.png',
    notificationPreferences: {
      pushNotificationsEnabled: false,
    },
    emailPreferences: {
      emailMarketingEnabled: true,
    },
  });

  assert.equal(receivedUpdates.profile.displayName, 'Updated Name');
  assert.equal(receivedUpdates.preferences.pushNotificationsEnabled, false);
  assert.equal(receivedUpdates.preferences.emailMarketingEnabled, true);
  assert.equal(updated.profile.displayName, 'Updated Name');
});
