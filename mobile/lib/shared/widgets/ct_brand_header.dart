import 'package:flutter/material.dart';

class CtBrandHeader extends StatelessWidget {
  const CtBrandHeader({
    super.key,
    required this.title,
    required this.subtitle,
  });

  final String title;
  final String subtitle;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: 56,
          height: 56,
          decoration: BoxDecoration(
            color: theme.colorScheme.primaryContainer,
            borderRadius: BorderRadius.circular(16),
          ),
          child: Icon(
            Icons.graphic_eq_rounded,
            color: theme.colorScheme.onPrimaryContainer,
            size: 30,
          ),
        ),
        const SizedBox(height: 14),
        Text(title, style: theme.textTheme.headlineSmall),
        const SizedBox(height: 6),
        Text(subtitle, style: theme.textTheme.bodyMedium),
      ],
    );
  }
}
