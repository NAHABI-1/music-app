import 'announcement_item.dart';
import 'plan_comparison_item.dart';
import 'plan_offer.dart';
import 'promo_banner.dart';

class MonetizationSnapshot {
  const MonetizationSnapshot({
    required this.isPremium,
    required this.activePlanCode,
    required this.adsEnabled,
    required this.plans,
    required this.comparison,
    required this.upsellBanners,
    required this.announcements,
  });

  final bool isPremium;
  final String activePlanCode;
  final bool adsEnabled;
  final List<PlanOffer> plans;
  final List<PlanComparisonItem> comparison;
  final List<PromoBanner> upsellBanners;
  final List<AnnouncementItem> announcements;
}
