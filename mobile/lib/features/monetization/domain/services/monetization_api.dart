import '../models/monetization_snapshot.dart';

class PromoCodeResult {
  const PromoCodeResult({
    required this.accepted,
    required this.message,
    this.unlockedPremium = false,
  });

  final bool accepted;
  final String message;
  final bool unlockedPremium;
}

class CheckoutResult {
  const CheckoutResult({
    required this.success,
    required this.planCode,
    required this.message,
    required this.isPremium,
  });

  final bool success;
  final String planCode;
  final String message;
  final bool isPremium;
}

abstract class MonetizationApi {
  Future<MonetizationSnapshot> fetchSnapshot();

  Future<PromoCodeResult> applyPromoCode(String code);

  Future<CheckoutResult> createCheckoutSession(String planCode);
}
