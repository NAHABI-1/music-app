enum PremiumPlanType { free, pro, family }

class PremiumPlan {
  final PremiumPlanType type;
  final String name;
  final String description;
  final double monthlyPrice;
  final double yearlyPrice;
  final List<String> features;
  final int maxDevices;
  final bool adFree;
  final bool highQuality;
  final bool offlineDownloads;

  PremiumPlan({
    required this.type,
    required this.name,
    required this.description,
    required this.monthlyPrice,
    required this.yearlyPrice,
    required this.features,
    required this.maxDevices,
    this.adFree = false,
    this.highQuality = false,
    this.offlineDownloads = false,
  });

  static final free = PremiumPlan(
    type: PremiumPlanType.free,
    name: 'Free',
    description: 'Enjoy CloudTune with ads',
    monthlyPrice: 0,
    yearlyPrice: 0,
    features: [
      'Ad-supported listening',
      'Standard quality',
      '1 device',
      'Browse and search',
    ],
    maxDevices: 1,
    adFree: false,
    highQuality: false,
    offlineDownloads: false,
  );

  static final pro = PremiumPlan(
    type: PremiumPlanType.pro,
    name: 'Pro',
    description: 'No ads, high quality audio',
    monthlyPrice: 9.99,
    yearlyPrice: 99.99,
    features: [
      'Ad-free listening',
      'High quality audio (320kbps)',
      '3 devices',
      'Offline downloads (25GB)',
      'Early access to new features',
    ],
    maxDevices: 3,
    adFree: true,
    highQuality: true,
    offlineDownloads: true,
  );

  static final family = PremiumPlan(
    type: PremiumPlanType.family,
    name: 'Family',
    description: 'Up to 6 accounts',
    monthlyPrice: 14.99,
    yearlyPrice: 149.99,
    features: [
      'Ad-free for all',
      'High quality audio (320kbps)',
      'Up to 6 accounts',
      'Unlimited offline downloads',
      'Family mix playlist',
      'Parental controls',
    ],
    maxDevices: 6,
    adFree: true,
    highQuality: true,
    offlineDownloads: true,
  );
}
