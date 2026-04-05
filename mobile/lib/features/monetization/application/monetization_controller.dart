import 'package:flutter/foundation.dart';

import '../domain/services/monetization_api.dart';
import 'monetization_state.dart';

class MonetizationController extends ChangeNotifier {
  MonetizationController({required MonetizationApi api}) : _api = api;

  final MonetizationApi _api;

  MonetizationState _state = MonetizationState.initial();
  MonetizationState get state => _state;

  Future<void> initialize() async {
    await refresh();
  }

  Future<void> refresh() async {
    _state = _state.copyWith(isLoading: true, clearLastMessage: true);
    notifyListeners();

    try {
      final snapshot = await _api.fetchSnapshot();
      _state = _state.copyWith(
        isLoading: false,
        isPremium: snapshot.isPremium,
        activePlanCode: snapshot.activePlanCode,
        adsEnabled: snapshot.adsEnabled,
        plans: snapshot.plans,
        comparison: snapshot.comparison,
        upsellBanners: snapshot.upsellBanners,
        announcements: snapshot.announcements,
      );
    } catch (_) {
      _state = _state.copyWith(
        isLoading: false,
        lastMessage: 'Unable to load premium data right now.',
      );
    }
    notifyListeners();
  }

  Future<void> applyPromoCode(String code) async {
    await _runSubmission(
      errorMessage: 'Could not apply promo code. Please try again.',
      action: () async {
        final result = await _api.applyPromoCode(code);
        await refresh();
        _state = _state.copyWith(lastMessage: result.message);
      },
    );
  }

  Future<void> activatePlan(String planCode) async {
    await _runSubmission(
      errorMessage: 'Unable to start checkout right now. Please try again.',
      action: () async {
        final result = await _api.createCheckoutSession(planCode);
        await refresh();
        _state = _state.copyWith(
          isPremium: result.isPremium,
          activePlanCode: result.planCode,
          lastMessage: result.message,
        );
      },
    );
  }

  Future<void> _runSubmission({
    required Future<void> Function() action,
    required String errorMessage,
  }) async {
    _state = _state.copyWith(isSubmitting: true, clearLastMessage: true);
    notifyListeners();

    try {
      await action();
    } catch (_) {
      _state = _state.copyWith(
        lastMessage: errorMessage,
      );
    } finally {
      _state = _state.copyWith(isSubmitting: false, isLoading: false);
    }
    notifyListeners();
  }
}
