import 'package:flutter/material.dart';

/// Reusable FutureBuilder with error handling and retry capability
class SafeFutureBuilder<T> extends StatelessWidget {
  final Future<T> future;
  final Function(BuildContext, T) builder;
  final Function(BuildContext)? onLoading;
  final Function(BuildContext, Object)? onError;
  final VoidCallback? onRetry;

  const SafeFutureBuilder({
    super.key,
    required this.future,
    required this.builder,
    this.onLoading,
    this.onError,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    return FutureBuilder<T>(
      future: future,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return onLoading?.call(context) ??
              const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return onError?.call(context, snapshot.error!) ??
              _defaultErrorWidget(context, snapshot.error!, onRetry);
        }

        if (!snapshot.hasData) {
          return Center(
            child: Text(
              'No data available',
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          );
        }

        return builder(context, snapshot.data as T);
      },
    );
  }

  static Widget _defaultErrorWidget(
    BuildContext context,
    Object error,
    VoidCallback? onRetry,
  ) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline_rounded,
              size: 48,
              color: theme.colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              'Failed to load data',
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              error.toString(),
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
            if (onRetry != null) ...[
              const SizedBox(height: 16),
              FilledButton.icon(
                onPressed: onRetry,
                icon: const Icon(Icons.refresh_rounded),
                label: const Text('Retry'),
              ),
            ],
          ],
        ),
      ),
    );
  }
}
