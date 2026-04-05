const { PrismaClient, Prisma } = require('@prisma/client');
const { getEnv } = require('../src/config/env');

const prisma = new PrismaClient();

const env = getEnv();

if (env.app.env === 'production' || env.app.nodeEnv === 'production') {
  throw new Error('Refusing to run seed in production environment.');
}

async function resetData() {
  const deleteOrder = [
    'analyticsEvent',
    'notification',
    'adCampaign',
    'payment',
    'subscription',
    'promoCode',
    'plan',
    'storageUsage',
    'offlineDownload',
    'recentPlay',
    'favorite',
    'playlistItem',
    'playlist',
    'upload',
    'song',
    'album',
    'artist',
    'deviceSession',
    'authSession',
    'userPreference',
    'userProfile',
    'user',
  ];

  for (const model of deleteOrder) {
    await prisma[model].deleteMany();
  }
}

async function seed() {
  await resetData();

  const [freePlan, plusPlan] = await Promise.all([
    prisma.plan.create({
      data: {
        code: 'FREE',
        name: 'Free',
        description: 'Ad-supported baseline access',
        interval: 'MONTHLY',
        priceCents: 0,
        currency: 'USD',
      },
    }),
    prisma.plan.create({
      data: {
        code: 'PLUS_MONTHLY',
        name: 'CloudTune Plus Monthly',
        description: 'Premium monthly access with expanded offline limits',
        interval: 'MONTHLY',
        priceCents: 999,
        currency: 'USD',
      },
    }),
  ]);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@cloudtune.local',
      passwordHash: 'placeholder-admin-hash',
      role: 'ADMIN',
      status: 'ACTIVE',
      profile: {
        create: {
          displayName: 'CloudTune Admin',
          bio: 'Local development admin account',
          countryCode: 'US',
        },
      },
    },
  });

  const alice = await prisma.user.create({
    data: {
      email: 'alice@cloudtune.local',
      passwordHash: 'placeholder-alice-hash',
      role: 'USER',
      status: 'ACTIVE',
      profile: {
        create: {
          displayName: 'Alice Listener',
          bio: 'Owns and uploads licensed indie music',
          countryCode: 'US',
        },
      },
    },
  });

  const bob = await prisma.user.create({
    data: {
      email: 'bob@cloudtune.local',
      passwordHash: 'placeholder-bob-hash',
      role: 'USER',
      status: 'ACTIVE',
      profile: {
        create: {
          displayName: 'Bob Producer',
          bio: 'Uploads authorized masters for testing',
          countryCode: 'GB',
        },
      },
    },
  });

  const northHarbor = await prisma.artist.create({
    data: {
      name: 'North Harbor',
      slug: 'north-harbor',
      status: 'ACTIVE',
      createdByUserId: admin.id,
    },
  });

  const eveningSignals = await prisma.album.create({
    data: {
      artistId: northHarbor.id,
      title: 'Evening Signals',
      slug: 'evening-signals',
      status: 'PUBLISHED',
      releaseDate: new Date('2023-09-14'),
    },
  });

  const slowLight = await prisma.song.create({
    data: {
      artistId: northHarbor.id,
      albumId: eveningSignals.id,
      uploadedByUserId: bob.id,
      title: 'Slow Light',
      slug: 'slow-light',
      genre: 'Indie',
      trackNumber: 1,
      durationSeconds: 224,
      filePath: 'songs/north-harbor/slow-light.flac',
      mimeType: 'audio/flac',
      fileSizeBytes: BigInt(9876543),
      checksumSha256: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      rightsStatus: 'AUTHORIZED',
      status: 'READY',
      publishedAt: new Date('2023-09-14T00:00:00.000Z'),
    },
  });

  const paperSatellites = await prisma.song.create({
    data: {
      artistId: northHarbor.id,
      albumId: eveningSignals.id,
      uploadedByUserId: alice.id,
      title: 'Paper Satellites',
      slug: 'paper-satellites',
      genre: 'Indie',
      trackNumber: 2,
      durationSeconds: 201,
      filePath: 'songs/north-harbor/paper-satellites.flac',
      mimeType: 'audio/flac',
      fileSizeBytes: BigInt(8452345),
      checksumSha256: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
      rightsStatus: 'OWNED',
      status: 'READY',
      publishedAt: new Date('2023-09-14T00:00:00.000Z'),
    },
  });

  const aliceSession = await prisma.deviceSession.create({
    data: {
      userId: alice.id,
      deviceId: 'alice-iphone-15',
      platform: 'IOS',
      appVersion: '1.0.0-dev',
      ipAddress: '10.0.0.5',
      status: 'ACTIVE',
      lastSeenAt: new Date(),
    },
  });

  await prisma.upload.create({
    data: {
      userId: alice.id,
      songId: paperSatellites.id,
      originalFilename: 'north-harbor-paper-satellites.flac',
      mimeType: 'audio/flac',
      fileSizeBytes: BigInt(8452345),
      storageKey: 'incoming/alice/paper-satellites.flac',
      status: 'COMPLETED',
    },
  });

  const playlist = await prisma.playlist.create({
    data: {
      userId: alice.id,
      title: 'Evening Focus',
      description: 'Licensed tracks for focused work sessions',
      visibility: 'PRIVATE',
      status: 'ACTIVE',
    },
  });

  await prisma.playlistItem.createMany({
    data: [
      {
        playlistId: playlist.id,
        songId: slowLight.id,
        position: 1,
        addedByUserId: alice.id,
      },
      {
        playlistId: playlist.id,
        songId: paperSatellites.id,
        position: 2,
        addedByUserId: alice.id,
      },
    ],
  });

  await prisma.favorite.create({
    data: {
      userId: alice.id,
      songId: slowLight.id,
    },
  });

  await prisma.recentPlay.createMany({
    data: [
      {
        userId: alice.id,
        songId: slowLight.id,
        playbackSource: 'STREAM',
        playDurationSecs: 224,
      },
      {
        userId: alice.id,
        songId: paperSatellites.id,
        playbackSource: 'OFFLINE',
        playDurationSecs: 180,
      },
    ],
  });

  await prisma.offlineDownload.create({
    data: {
      userId: alice.id,
      songId: slowLight.id,
      deviceSessionId: aliceSession.id,
      localPath: '/secure-cache/songs/slow-light.enc',
      encryptionKeyId: 'kek-local-dev-001',
      status: 'READY',
      downloadedAt: new Date(),
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
    },
  });

  const promoCode = await prisma.promoCode.create({
    data: {
      code: 'WELCOME20',
      description: '20% off first premium cycle',
      discountType: 'PERCENT',
      discountValue: new Prisma.Decimal('20.00'),
      maxRedemptions: 500,
      redeemedCount: 1,
      startsAt: new Date('2026-01-01T00:00:00.000Z'),
      expiresAt: new Date('2026-12-31T23:59:59.000Z'),
      createdByUserId: admin.id,
      isActive: true,
    },
  });

  const subscription = await prisma.subscription.create({
    data: {
      userId: alice.id,
      planId: plusPlan.id,
      status: 'ACTIVE',
      startsAt: new Date('2026-04-01T00:00:00.000Z'),
      currentPeriodStart: new Date('2026-04-01T00:00:00.000Z'),
      currentPeriodEnd: new Date('2026-05-01T00:00:00.000Z'),
      externalRef: 'sub_local_001',
    },
  });

  await prisma.payment.create({
    data: {
      userId: alice.id,
      subscriptionId: subscription.id,
      planId: plusPlan.id,
      promoCodeId: promoCode.id,
      amountCents: 799,
      currency: 'USD',
      provider: 'mock-gateway',
      providerRef: 'pay_local_001',
      status: 'SUCCEEDED',
      paidAt: new Date('2026-04-01T00:05:00.000Z'),
    },
  });

  await prisma.adCampaign.create({
    data: {
      name: 'Spring Free Tier Awareness',
      status: 'ACTIVE',
      startsAt: new Date('2026-03-01T00:00:00.000Z'),
      endsAt: new Date('2026-06-01T00:00:00.000Z'),
      budgetCents: 250000,
      impressionsTarget: 300000,
      clicksTarget: 12000,
      createdByUserId: admin.id,
    },
  });

  await prisma.notification.createMany({
    data: [
      {
        userId: alice.id,
        type: 'subscription_renewal',
        title: 'Subscription renewed',
        body: 'Your CloudTune Plus plan has been renewed successfully.',
        channel: 'IN_APP',
        status: 'SENT',
        sentAt: new Date('2026-04-01T00:06:00.000Z'),
      },
      {
        userId: bob.id,
        type: 'upload_review',
        title: 'Upload rights check complete',
        body: 'Your latest upload passed authorization checks.',
        channel: 'EMAIL',
        status: 'QUEUED',
      },
    ],
  });

  await prisma.analyticsEvent.createMany({
    data: [
      {
        userId: alice.id,
        deviceSessionId: aliceSession.id,
        eventName: 'song_play_started',
        eventCategory: 'playback',
        source: 'MOBILE',
        properties: { songId: slowLight.id, playbackSource: 'STREAM' },
      },
      {
        userId: alice.id,
        deviceSessionId: aliceSession.id,
        eventName: 'offline_download_ready',
        eventCategory: 'offline',
        source: 'BACKEND',
        properties: { songId: slowLight.id },
      },
      {
        userId: null,
        deviceSessionId: null,
        eventName: 'ad_campaign_impression',
        eventCategory: 'ads',
        source: 'ADMIN',
        properties: { campaignName: 'Spring Free Tier Awareness' },
      },
    ],
  });

  await prisma.storageUsage.createMany({
    data: [
      {
        userId: alice.id,
        snapshotDate: new Date('2026-04-05'),
        totalBytes: BigInt(255000000),
        uploadedBytes: BigInt(164000000),
        cachedBytes: BigInt(61000000),
        downloadedBytes: BigInt(30000000),
      },
      {
        userId: bob.id,
        snapshotDate: new Date('2026-04-05'),
        totalBytes: BigInt(130000000),
        uploadedBytes: BigInt(125000000),
        cachedBytes: BigInt(2000000),
        downloadedBytes: BigInt(3000000),
      },
    ],
  });

  console.log('CloudTune local seed complete:', {
    users: 3,
    plans: [freePlan.code, plusPlan.code],
    songs: 2,
  });
}

seed()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
