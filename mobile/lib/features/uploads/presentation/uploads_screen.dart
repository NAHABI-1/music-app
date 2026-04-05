import 'package:flutter/material.dart';

import '../../monetization/application/monetization_scope.dart';
import '../../monetization/domain/models/promo_banner.dart';
import '../../monetization/presentation/monetization_components.dart';
import '../../monetization/presentation/premium_plans_screen.dart';

class UploadsScreen extends StatelessWidget {
  const UploadsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = MonetizationScope.of(context);
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final state = controller.state;
        return ListView(
          padding: const EdgeInsets.all(20),
          children: [
            Text('Uploads', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 10),
            Text(
              state.isPremium
                  ? 'Premium storage limits are active for your account.'
                  : 'Free storage is limited. Upgrade for larger upload capacity and better quality tools.',
            ),
            const SizedBox(height: 16),
            if (!state.isPremium)
              PremiumUpsellBanner(
                banner: state.upsellBanners.isEmpty
                    ? const PromoBanner(
                        id: 'fallback',
                        title: 'Need more upload space?',
                        subtitle: 'Premium gives you significantly higher storage limits.',
                        ctaLabel: 'View premium plans',
                      )
                    : state.upsellBanners.last,
                onTap: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const PremiumPlansScreen(),
                    ),
                  );
                },
              ),
            if (!state.isPremium) const SizedBox(height: 12),
            if (state.showAds)
              const AdPlaceholderCard(
                title: 'Sponsor spotlight',
                subtitle: 'Small static placeholder for future upload-page ad inventory.',
              ),
            const SizedBox(height: 20),
            const Text('Upload flow scaffold'),
          ],
        );
      },
    );
  }
}