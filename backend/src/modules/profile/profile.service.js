const { ProfileRepository } = require('../../repositories/profile.repository');
const { ProfileError } = require('./profile.errors');

class ProfileService {
  constructor({ profileRepository = new ProfileRepository() } = {}) {
    this.profileRepository = profileRepository;
  }

  async getCurrentProfile(userId) {
    await this.profileRepository.ensureDefaults(userId);

    const user = await this.profileRepository.findByUserId(userId);
    if (!user) {
      throw new ProfileError(404, 'USER_NOT_FOUND', 'User profile was not found.');
    }

    return this.toDto(user);
  }

  async updateCurrentProfile(userId, input) {
    const profileUpdates = {
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
      ...(input.bio !== undefined ? { bio: input.bio } : {}),
      ...(input.countryCode !== undefined ? { countryCode: input.countryCode } : {}),
      ...(input.dateOfBirth !== undefined
        ? { dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : null }
        : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl } : {}),
      ...(input.avatarStorageKey !== undefined ? { avatarStorageKey: input.avatarStorageKey } : {}),
      ...(input.avatarMetadata !== undefined ? { avatarMetadata: input.avatarMetadata } : {}),
      ...(input.profileMetadata !== undefined ? { profileMetadata: input.profileMetadata } : {}),
    };

    const preferencesUpdates = {
      ...(input.notificationPreferences?.inAppNotificationsEnabled !== undefined
        ? { inAppNotificationsEnabled: input.notificationPreferences.inAppNotificationsEnabled }
        : {}),
      ...(input.notificationPreferences?.pushNotificationsEnabled !== undefined
        ? { pushNotificationsEnabled: input.notificationPreferences.pushNotificationsEnabled }
        : {}),
      ...(input.notificationPreferences?.emailNotificationsEnabled !== undefined
        ? { emailNotificationsEnabled: input.notificationPreferences.emailNotificationsEnabled }
        : {}),
      ...(input.notificationPreferences?.notificationTopics !== undefined
        ? { notificationTopics: input.notificationPreferences.notificationTopics }
        : {}),
      ...(input.emailPreferences?.emailMarketingEnabled !== undefined
        ? { emailMarketingEnabled: input.emailPreferences.emailMarketingEnabled }
        : {}),
      ...(input.emailPreferences?.emailProductUpdatesEnabled !== undefined
        ? { emailProductUpdatesEnabled: input.emailPreferences.emailProductUpdatesEnabled }
        : {}),
      ...(input.emailPreferences?.emailSecurityAlertsEnabled !== undefined
        ? { emailSecurityAlertsEnabled: input.emailPreferences.emailSecurityAlertsEnabled }
        : {}),
    };

    const updated = await this.profileRepository.updateByUserId(userId, {
      profile: profileUpdates,
      preferences: preferencesUpdates,
    });

    if (!updated) {
      throw new ProfileError(404, 'USER_NOT_FOUND', 'User profile was not found.');
    }

    return this.toDto(updated);
  }

  toDto(user) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      status: user.status,
      profile: {
        displayName: user.profile?.displayName || null,
        bio: user.profile?.bio || null,
        countryCode: user.profile?.countryCode || null,
        dateOfBirth: user.profile?.dateOfBirth ? user.profile.dateOfBirth.toISOString().slice(0, 10) : null,
        avatarUrl: user.profile?.avatarUrl || null,
        avatarStorageKey: user.profile?.avatarStorageKey || null,
        avatarMetadata: user.profile?.avatarMetadata || null,
        profileMetadata: user.profile?.profileMetadata || null,
        updatedAt: user.profile?.updatedAt || null,
      },
      preferences: {
        notifications: {
          inAppNotificationsEnabled: user.preferences?.inAppNotificationsEnabled ?? true,
          pushNotificationsEnabled: user.preferences?.pushNotificationsEnabled ?? true,
          emailNotificationsEnabled: user.preferences?.emailNotificationsEnabled ?? true,
          notificationTopics: user.preferences?.notificationTopics || null,
        },
        email: {
          emailMarketingEnabled: user.preferences?.emailMarketingEnabled ?? false,
          emailProductUpdatesEnabled: user.preferences?.emailProductUpdatesEnabled ?? true,
          emailSecurityAlertsEnabled: user.preferences?.emailSecurityAlertsEnabled ?? true,
        },
      },
    };
  }
}

function createProfileService(dependencies) {
  return new ProfileService(dependencies);
}

module.exports = {
  ProfileService,
  createProfileService,
};
