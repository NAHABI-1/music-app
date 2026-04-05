import 'package:flutter/material.dart';

class ProgressUploadCard extends StatelessWidget {
  final String fileName;
  final double progress; // 0.0 to 1.0
  final String status; // 'Uploading', 'Processing', 'Done'
  final VoidCallback? onRetry;
  final VoidCallback? onCancel;

  const ProgressUploadCard({
    super.key,
    required this.fileName,
    required this.progress,
    required this.status,
    this.onRetry,
    this.onCancel,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final isComplete = progress >= 1.0;
    final hasError = status.toLowerCase().contains('error');

    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: theme.colorScheme.surfaceContainerLow,
        border: Border.all(
          color: theme.colorScheme.outlineVariant,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                Icons.music_note_rounded,
                color: theme.colorScheme.primary,
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      fileName,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: theme.textTheme.labelLarge,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      status,
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: hasError
                            ? theme.colorScheme.error
                            : theme.colorScheme.onSurface.withOpacity(0.6),
                      ),
                    ),
                  ],
                ),
              ),
              if (isComplete)
                Icon(
                  Icons.check_circle_rounded,
                  color: theme.colorScheme.primary,
                )
              else if (hasError)
                Icon(
                  Icons.error_rounded,
                  color: theme.colorScheme.error,
                ),
            ],
          ),
          const SizedBox(height: 12),
          ClipRRect(
            borderRadius: BorderRadius.circular(8),
            child: LinearProgressIndicator(
              value: isComplete ? 1.0 : progress,
              minHeight: 6,
              backgroundColor: theme.colorScheme.outlineVariant.withOpacity(0.3),
              valueColor: AlwaysStoppedAnimation(
                hasError
                    ? theme.colorScheme.error
                    : theme.colorScheme.primary,
              ),
            ),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                '${(progress * 100).toStringAsFixed(0)}%',
                style: theme.textTheme.labelSmall,
              ),
              if (!isComplete)
                Row(
                  children: [
                    if (hasError && onRetry != null)
                      TextButton.icon(
                        onPressed: onRetry,
                        icon: const Icon(Icons.refresh_rounded, size: 16),
                        label: const Text('Retry'),
                        style: TextButton.styleFrom(
                          foregroundColor: theme.colorScheme.error,
                        ),
                      ),
                    if (onCancel != null)
                      TextButton(
                        onPressed: onCancel,
                        child: const Text('Cancel'),
                      ),
                  ],
                ),
            ],
          ),
        ],
      ),
    );
  }
}
