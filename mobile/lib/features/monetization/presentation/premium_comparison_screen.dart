import 'package:flutter/material.dart';

import '../application/monetization_scope.dart';

class PremiumComparisonScreen extends StatelessWidget {
  const PremiumComparisonScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = MonetizationScope.of(context);

    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final state = controller.state;
        return Scaffold(
          appBar: AppBar(title: const Text('Free vs Premium')),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (state.isLoading) ...[
                const LinearProgressIndicator(),
                const SizedBox(height: 12),
              ],
              Text(
                'Clear value, no pressure.',
                style: Theme.of(context).textTheme.titleLarge,
              ),
              const SizedBox(height: 8),
              const Text(
                'Premium removes interruptions and expands your listening limits. '
                'Free remains fully usable for casual listening.',
              ),
              const SizedBox(height: 16),
              Container(
                decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: Theme.of(context).colorScheme.outlineVariant),
                ),
                child: Column(
                  children: [
                    const _ComparisonHeader(),
                    ...state.comparison.map(
                      (item) => _ComparisonRow(
                        feature: item.feature,
                        freeValue: item.freeValue,
                        premiumValue: item.premiumValue,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}

class _ComparisonHeader extends StatelessWidget {
  const _ComparisonHeader();

  @override
  Widget build(BuildContext context) {
    final textStyle = Theme.of(context).textTheme.labelLarge?.copyWith(fontWeight: FontWeight.w700);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.surfaceContainerHighest,
        borderRadius: const BorderRadius.only(
          topLeft: Radius.circular(16),
          topRight: Radius.circular(16),
        ),
      ),
      child: Row(
        children: [
          Expanded(flex: 5, child: Text('Feature', style: textStyle)),
          Expanded(flex: 3, child: Text('Free', style: textStyle)),
          Expanded(flex: 3, child: Text('Premium', style: textStyle)),
        ],
      ),
    );
  }
}

class _ComparisonRow extends StatelessWidget {
  const _ComparisonRow({
    required this.feature,
    required this.freeValue,
    required this.premiumValue,
  });

  final String feature;
  final String freeValue;
  final String premiumValue;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 12),
      decoration: BoxDecoration(
        border: Border(
          top: BorderSide(color: Theme.of(context).colorScheme.outlineVariant),
        ),
      ),
      child: Row(
        children: [
          Expanded(flex: 5, child: Text(feature)),
          Expanded(flex: 3, child: Text(freeValue)),
          Expanded(
            flex: 3,
            child: Text(
              premiumValue,
              style: const TextStyle(fontWeight: FontWeight.w700),
            ),
          ),
        ],
      ),
    );
  }
}
