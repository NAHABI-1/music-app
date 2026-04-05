import '../../domain/models/announcement_item.dart';
import '../../domain/models/monetization_snapshot.dart';
import '../../domain/models/plan_comparison_item.dart';
import '../../domain/models/plan_offer.dart';
import '../../domain/models/promo_banner.dart';
import '../../domain/services/monetization_api.dart';

class ScaffoldMonetizationApi implements MonetizationApi {
  bool _isPremium = false;
  String _activePlanCode = 'FREE';
  bool _adsEnabled = true;

  static const Set<String> _instantUnlockCodes = <String>{
    'WELCOME100',
    'PREMIUM30',
  };

  @override
  Future<MonetizationSnapshot> fetchSnapshot() async {
    await Future<void>.delayed(const Duration(milliseconds: 120));

    return MonetizationSnapshot(
      isPremium: _isPremium,
      activePlanCode: _activePlanCode,
      adsEnabled: _adsEnabled,
      plans: const <PlanOffer>[
        PlanOffer(
          code: 'FREE',
          name: 'Free',
          subtitle: 'Casual listening with occasional ads.',
          priceLabel: '\$0',
          intervalLabel: 'forever',
          highlight: 'Good for discovering music',
          recommended: false,
        ),
        PlanOffer(
          code: 'PREMIUM_MONTHLY',
          name: 'Premium Monthly',
          subtitle: 'Ad-free music with offline and high quality.',
          priceLabel: '\$9.99',
          intervalLabel: 'per month',
          highlight: 'Most flexible option',
          recommended: true,
        ),
        PlanOffer(
          code: 'PREMIUM_YEARLY',
          name: 'Premium Yearly',
          subtitle: 'Everything in premium, billed once a year.',
          priceLabel: '\$99.99',
          intervalLabel: 'per year',
          highlight: 'Save over monthly billing',
          recommended: false,
        ),
      ],
      comparison: const <PlanComparisonItem>[
        PlanComparisonItem(feature: 'Ad-free playback', freeValue: 'No', premiumValue: 'Yes'),
        PlanComparisonItem(feature: 'Cloud storage', freeValue: '5 GB', premiumValue: '100 GB'),
        PlanComparisonItem(feature: 'Offline downloads', freeValue: '3 tracks', premiumValue: '500 tracks'),
        PlanComparisonItem(feature: 'Max audio quality', freeValue: 'Medium', premiumValue: 'Lossless'),
      ],
      upsellBanners: const <PromoBanner>[
        PromoBanner(
          id: 'upsell-1',
          title: 'Try Premium for cleaner listening',
          subtitle: 'No ad breaks and better quality on every track.',
          ctaLabel: 'View plans',
        ),
        PromoBanner(
          id: 'upsell-2',
          title: 'Yearly premium discount',
          subtitle: 'Save more with annual billing and keep all premium perks.',
          ctaLabel: 'See yearly plan',
        ),
      ],
      announcements: <AnnouncementItem>[
        AnnouncementItem(
          id: 'announcement-1',
          title: 'New editorial playlists are live',
          body: 'We curated late-night and focus playlists for this week.',
          category: 'Product',
          createdAt: DateTime.now().subtract(const Duration(days: 1)),
        ),
        AnnouncementItem(
          id: 'announcement-2',
          title: 'Premium members now get expanded offline limits',
          body: 'Download more tracks for flights and low-connectivity commutes.',
          category: 'Premium',
          createdAt: DateTime.now().subtract(const Duration(days: 2)),
        ),
      ],
    );
  }

  @override
  Future<PromoCodeResult> applyPromoCode(String code) async {
    await Future<void>.delayed(const Duration(milliseconds: 160));
    final normalized = code.trim().toUpperCase();

    if (normalized.isEmpty) {
      return const PromoCodeResult(
        accepted: false,
        message: 'Enter a promo code first.',
      );
    }

    if (_instantUnlockCodes.contains(normalized)) {
      _isPremium = true;
      _activePlanCode = 'PREMIUM_MONTHLY';
      return const PromoCodeResult(
        accepted: true,
        unlockedPremium: true,
        message: 'Promo code applied. Premium unlocked.',
      );
    }

    return const PromoCodeResult(
      accepted: false,
      message: 'Promo code is invalid or expired.',
    );
  }

  @override
  Future<CheckoutResult> createCheckoutSession(String planCode) async {
    await Future<void>.delayed(const Duration(milliseconds: 220));

    if (planCode == 'FREE') {
      _isPremium = false;
      _activePlanCode = 'FREE';
      return const CheckoutResult(
        success: true,
        planCode: 'FREE',
        message: 'Switched to Free plan.',
        isPremium: false,
      );
    }

    if (planCode == 'PREMIUM_MONTHLY' || planCode == 'PREMIUM_YEARLY') {
      _isPremium = true;
      _activePlanCode = planCode;
      return CheckoutResult(
        success: true,
        planCode: planCode,
        message: 'Premium plan activated.',
        isPremium: true,
      );
    }

    return const CheckoutResult(
      success: false,
      planCode: 'UNKNOWN',
      message: 'Unable to start checkout for this plan.',
      isPremium: false,
    );
  }
}
