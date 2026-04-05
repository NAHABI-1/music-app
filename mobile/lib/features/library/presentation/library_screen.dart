import 'package:flutter/material.dart';

import '../../monetization/application/monetization_scope.dart';
import '../../monetization/presentation/monetization_components.dart';
import '../../monetization/presentation/premium_plans_screen.dart';
import '../../player/presentation/player_debug_controls.dart';

class LibraryScreen extends StatelessWidget {
  const LibraryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = MonetizationScope.of(context);
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final state = controller.state;
        return ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Text('Library', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text(
              state.isPremium
                  ? 'Ad-free listening is active. Enjoy uninterrupted playback.'
                  : 'Your free plan includes light ad placements to keep listening accessible.',
            ),
            const SizedBox(height: 12),
            if (!state.isPremium && state.upsellBanners.isNotEmpty)
              PremiumUpsellBanner(
                banner: state.upsellBanners.first,
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
                title: 'Recommended sponsor',
                subtitle: 'A calm, non-blocking banner placement for free listeners.',
                height: 72,
              ),
            if (state.showAds) const SizedBox(height: 16),
            AnnouncementsSection(items: state.announcements),
            const SizedBox(height: 16),
            const PlayerDebugControls(),
          ],
        );
      ),
    );
  }
}