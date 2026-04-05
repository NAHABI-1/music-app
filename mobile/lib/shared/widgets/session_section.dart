import 'package:flutter/material.dart';

class SessionSection extends StatelessWidget {
  final String title;
  final Widget child;
  final EdgeInsets padding;
  final bool showDivider;

  const SessionSection({
    super.key,
    required this.title,
    required this.child,
    this.padding = const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    this.showDivider = true,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: padding,
          child: Text(
            title,
            style: theme.textTheme.titleMedium?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
        ),
        child,
        if (showDivider)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Divider(
              height: 1,
              color: theme.colorScheme.outlineVariant.withOpacity(0.3),
            ),
          ),
      ],
    );
  }
}
