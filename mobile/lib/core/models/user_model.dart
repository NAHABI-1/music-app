import 'premium_plan_model.dart';

class User {
  final String id;
  final String name;
  final String email;
  final String? profileImage;
  final DateTime createdAt;
  final PremiumPlanType planType;
  final DateTime? premiumExpiry;
  final int totalListens;
  final List<String> favoriteGenres;

  User({
    required this.id,
    required this.name,
    required this.email,
    this.profileImage,
    DateTime? createdAt,
    this.planType = PremiumPlanType.free,
    this.premiumExpiry,
    this.totalListens = 0,
    this.favoriteGenres = const [],
  }) : createdAt = createdAt ?? DateTime.now();

  bool get isPremium => planType != PremiumPlanType.free;
}
