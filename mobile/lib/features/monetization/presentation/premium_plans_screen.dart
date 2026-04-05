import 'package:flutter/material.dart';

import '../application/monetization_scope.dart';
import 'premium_comparison_screen.dart';

class PremiumPlansScreen extends StatefulWidget {
  const PremiumPlansScreen({super.key});

  @override
  State<PremiumPlansScreen> createState() => _PremiumPlansScreenState();
}

class _PremiumPlansScreenState extends State<PremiumPlansScreen> {
  final TextEditingController _promoController = TextEditingController();

  @override
  void dispose() {
    _promoController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = MonetizationScope.of(context);
    return AnimatedBuilder(
      animation: controller,
      builder: (context, _) {
        final state = controller.state;
        return Scaffold(
          appBar: AppBar(
            title: const Text('Premium plans'),
            actions: [
              IconButton(
                tooltip: 'Compare plans',
                icon: const Icon(Icons.table_rows_outlined),
                onPressed: () {
                  Navigator.of(context).push(
                    MaterialPageRoute<void>(
                      builder: (_) => const PremiumComparisonScreen(),
                    ),
                  );
                },
              ),
            ],
          ),
          body: ListView(
            padding: const EdgeInsets.all(16),
            children: [
              if (state.isLoading) ...[
                const LinearProgressIndicator(),
                const SizedBox(height: 12),
              ],
              _HeroCard(isPremium: state.isPremium),
              const SizedBox(height: 16),
              Text('Choose your plan', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              ...state.plans.map(
                (plan) => Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: _PlanCard(
                    isCurrent: plan.code == state.activePlanCode,
                    isBusy: state.isSubmitting,
                    planName: plan.name,
                    subtitle: plan.subtitle,
                    priceLabel: plan.priceLabel,
                    intervalLabel: plan.intervalLabel,
                    highlight: plan.highlight,
                    recommended: plan.recommended,
                    onTap: () => controller.activatePlan(plan.code),
                  ),
                ),
              ),
              const SizedBox(height: 8),
              Text('Have a promo code?', style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _promoController,
                      decoration: const InputDecoration(
                        hintText: 'Enter code',
                        border: OutlineInputBorder(),
                      ),
                    ),
                  ),
                  const SizedBox(width: 10),
                  FilledButton(
                    onPressed: state.isSubmitting
                        ? null
                        : () => controller.applyPromoCode(_promoController.text),
                    child: const Text('Apply'),
                  ),
                ],
              ),
              if (state.lastMessage != null) ...[
                const SizedBox(height: 8),
                Text(state.lastMessage!),
              ],
            ],
          ),
        );
      },
    );
  }
}

class _HeroCard extends StatelessWidget {
  const _HeroCard({required this.isPremium});

  final bool isPremium;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(20),
        gradient: LinearGradient(
          colors: [
            colorScheme.primary,
            colorScheme.tertiary,
          ],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
      ),
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isPremium ? 'You are on Premium' : 'Upgrade for uninterrupted listening',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  color: colorScheme.onPrimary,
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 8),
          Text(
            isPremium
                ? 'Enjoy ad-free sessions, better quality, and bigger offline limits.'
                : 'Premium removes ad breaks, unlocks higher quality audio, and expands downloads.',
            style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: colorScheme.onPrimary),
          ),
        ],
      ),
    );
  }
}

class _PlanCard extends StatelessWidget {
  const _PlanCard({
    required this.isCurrent,
    required this.isBusy,
    required this.planName,
    required this.subtitle,
    required this.priceLabel,
    required this.intervalLabel,
    required this.highlight,
    required this.recommended,
    required this.onTap,
  });

  final bool isCurrent;
  final bool isBusy;
  final String planName;
  final String subtitle;
  final String priceLabel;
  final String intervalLabel;
  final String highlight;
  final bool recommended;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;
    return Container(
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        color: colorScheme.surface,
        border: Border.all(
          color: isCurrent ? colorScheme.primary : colorScheme.outlineVariant,
          width: isCurrent ? 1.8 : 1,
        ),
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Text(planName, style: Theme.of(context).textTheme.titleMedium),
                const Spacer(),
                if (recommended)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: colorScheme.secondaryContainer,
                      borderRadius: BorderRadius.circular(999),
                    ),
                    child: Text('Popular', style: Theme.of(context).textTheme.labelSmall),
                  ),
              ],
            ),
            const SizedBox(height: 6),
            Text(subtitle),
            const SizedBox(height: 10),
            Text(
              '$priceLabel  $intervalLabel',
              style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w700),
            ),
            const SizedBox(height: 6),
            Text(highlight, style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: FilledButton.tonal(
                onPressed: (isBusy || isCurrent) ? null : onTap,
                child: Text(isCurrent ? 'Current plan' : 'Choose'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
