class ProfileRepository {
  constructor(prisma) {
    this.prisma = prisma || require('./prismaClient').prisma;
  }

  async findByUserId(userId) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        status: true,
        profile: true,
        preferences: true,
      },
    });
  }

  async ensureDefaults(userId, defaults) {
    const profileDefaults = defaults?.profile || {};
    const defaultDisplayName = profileDefaults.displayName || 'CloudTune User';

    await this.prisma.userProfile.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
        displayName: defaultDisplayName,
      },
    });

    await this.prisma.userPreference.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
      },
    });
  }

  async updateByUserId(userId, updates) {
    const profileData = updates.profile || {};
    const preferencesData = updates.preferences || {};
    const defaultDisplayName = 'CloudTune User';

    return this.prisma.$transaction(async (tx) => {
      if (Object.keys(profileData).length > 0) {
        await tx.userProfile.upsert({
          where: { userId },
          update: profileData,
          create: {
            userId,
            displayName: profileData.displayName || defaultDisplayName,
            ...profileData,
          },
        });
      }

      if (Object.keys(preferencesData).length > 0) {
        await tx.userPreference.upsert({
          where: { userId },
          update: preferencesData,
          create: {
            userId,
            ...preferencesData,
          },
        });
      }

      return tx.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          profile: true,
          preferences: true,
        },
      });
    });
  }
}

module.exports = {
  ProfileRepository,
};
