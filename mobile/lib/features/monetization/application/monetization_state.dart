import '../domain/models/announcement_item.dart';
import '../domain/models/plan_comparison_item.dart';
import '../domain/models/plan_offer.dart';
import '../domain/models/promo_banner.dart';

class MonetizationState {
  const MonetizationState({
    required this.isLoading,
    required this.isSubmitting,
    required this.isPremium,
    required this.activePlanCode,
    required this.adsEnabled,
    required this.plans,
    required this.comparison,
    required this.upsellBanners,
    required this.announcements,
    required this.lastMessage,
  });

  factory MonetizationState.initial() {
    return const MonetizationState(
      isLoading: true,
      isSubmitting: false,
      isPremium: false,
      activePlanCode: 'FREE',
      adsEnabled: true,
      plans: <PlanOffer>[],
      comparison: <PlanComparisonItem>[],
      upsellBanners: <PromoBanner>[],
      announcements: <AnnouncementItem>[],
      lastMessage: null,
    );
  }

  final bool isLoading;
  final bool isSubmitting;
  final bool isPremium;
  final String activePlanCode;
  final bool adsEnabled;
  final List<PlanOffer> plans;
  final List<PlanComparisonItem> comparison;
  final List<PromoBanner> upsellBanners;
  final List<AnnouncementItem> announcements;
  final String? lastMessage;

  bool get showAds => adsEnabled && !isPremium;

  MonetizationState copyWith({
    bool? isLoading,
    bool? isSubmitting,
    bool? isPremium,
    String? activePlanCode,
    bool? adsEnabled,
    List<PlanOffer>? plans,
    List<PlanComparisonItem>? comparison,
    List<PromoBanner>? upsellBanners,
    List<AnnouncementItem>? announcements,
    String? lastMessage,
    bool clearLastMessage = false,
  }) {
    return MonetizationState(
      isLoading: isLoading ?? this.isLoading,
      isSubmitting: isSubmitting ?? this.isSubmitting,
      isPremium: isPremium ?? this.isPremium,
      activePlanCode: activePlanCode ?? this.activePlanCode,
      adsEnabled: adsEnabled ?? this.adsEnabled,
      plans: plans ?? this.plans,
      comparison: comparison ?? this.comparison,
      upsellBanners: upsellBanners ?? this.upsellBanners,
      announcements: announcements ?? this.announcements,
      lastMessage: clearLastMessage ? null : (lastMessage ?? this.lastMessage),
    );
  }
}
