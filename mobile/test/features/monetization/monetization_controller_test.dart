import 'package:flutter_test/flutter_test.dart';

import 'package:cloudtune/features/monetization/application/monetization_controller.dart';
import 'package:cloudtune/features/monetization/data/services/scaffold_monetization_api.dart';
import 'package:cloudtune/features/monetization/domain/models/announcement_item.dart';
import 'package:cloudtune/features/monetization/domain/models/monetization_snapshot.dart';
import 'package:cloudtune/features/monetization/domain/models/plan_comparison_item.dart';
import 'package:cloudtune/features/monetization/domain/models/plan_offer.dart';
import 'package:cloudtune/features/monetization/domain/models/promo_banner.dart';
import 'package:cloudtune/features/monetization/domain/services/monetization_api.dart';

class ThrowingMonetizationApi implements MonetizationApi {
  @override
  Future<PromoCodeResult> applyPromoCode(String code) async {
    throw Exception('promo failed');
  }

  @override
  Future<CheckoutResult> createCheckoutSession(String planCode) async {
    throw Exception('checkout failed');
  }

  @override
  Future<MonetizationSnapshot> fetchSnapshot() async {
    return const MonetizationSnapshot(
      isPremium: false,
      activePlanCode: 'FREE',
      adsEnabled: true,
      plans: <PlanOffer>[],
      comparison: <PlanComparisonItem>[],
      upsellBanners: <PromoBanner>[],
      announcements: <AnnouncementItem>[],
    );
  }
}

void main() {
  test('initialize loads monetization snapshot', () async {
    final controller = MonetizationController(api: ScaffoldMonetizationApi());

    await controller.initialize();

    expect(controller.state.isLoading, false);
    expect(controller.state.plans.isNotEmpty, true);
    expect(controller.state.comparison.isNotEmpty, true);
  });

  test('applyPromoCode unlocks premium for valid codes', () async {
    final controller = MonetizationController(api: ScaffoldMonetizationApi());

    await controller.initialize();
    await controller.applyPromoCode('WELCOME100');

    expect(controller.state.isPremium, true);
    expect(controller.state.activePlanCode, 'PREMIUM_MONTHLY');
    expect(controller.state.lastMessage?.isNotEmpty, true);
    expect(controller.state.showAds, false);
  });

  test('activatePlan updates premium state and ad visibility', () async {
    final controller = MonetizationController(api: ScaffoldMonetizationApi());

    await controller.initialize();
    await controller.activatePlan('PREMIUM_YEARLY');

    expect(controller.state.isPremium, true);
    expect(controller.state.activePlanCode, 'PREMIUM_YEARLY');
    expect(controller.state.showAds, false);

    await controller.activatePlan('FREE');

    expect(controller.state.isPremium, false);
    expect(controller.state.activePlanCode, 'FREE');
    expect(controller.state.showAds, true);
  });

  test('applyPromoCode handles API failures gracefully', () async {
    final controller = MonetizationController(api: ThrowingMonetizationApi());

    await controller.initialize();
    await controller.applyPromoCode('WELCOME100');

    expect(controller.state.isSubmitting, false);
    expect(controller.state.lastMessage, 'Could not apply promo code. Please try again.');
  });

  test('activatePlan handles checkout failures gracefully', () async {
    final controller = MonetizationController(api: ThrowingMonetizationApi());

    await controller.initialize();
    await controller.activatePlan('PREMIUM_MONTHLY');

    expect(controller.state.isSubmitting, false);
    expect(controller.state.lastMessage, 'Unable to start checkout right now. Please try again.');
  });
}
