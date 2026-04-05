import 'package:flutter/material.dart';

import '../../../core/config/app_config.dart';
import '../../monetization/application/monetization_scope.dart';
import '../../monetization/presentation/monetization_components.dart';
import '../../monetization/presentation/premium_comparison_screen.dart';
import '../../monetization/presentation/premium_plans_screen.dart';

class SettingsScreen extends StatelessWidget {
  const SettingsScreen({super.key});

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
            Text('Settings', style: Theme.of(context).textTheme.titleLarge),
            const SizedBox(height: 8),
            Text('API base URL: ${AppConfig.apiBaseUrl}'),
            const SizedBox(height: 16),
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                color: Theme.of(context).colorScheme.surface,
                border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Monetization', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(
                    state.isPremium
                        ? 'Premium active: ads are disabled for your account.'
                        : 'Free plan: low-frequency ads keep the service accessible.',
                  ),
                  const SizedBox(height: 12),
                  Wrap(
                    spacing: 10,
                    runSpacing: 8,
                    children: [
                      FilledButton.tonal(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => const PremiumPlansScreen(),
                            ),
                          );
                        },
                        child: const Text('View plans'),
                      ),
                      OutlinedButton(
                        onPressed: () {
                          Navigator.of(context).push(
                            MaterialPageRoute<void>(
                              builder: (_) => const PremiumComparisonScreen(),
                            ),
                          );
                        },
                        child: const Text('Compare free vs premium'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),
            AnnouncementsSection(items: state.announcements),
          ],
        );
      ),
    );
  }
}