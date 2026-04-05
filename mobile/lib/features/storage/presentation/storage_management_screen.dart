import 'package:flutter/material.dart';
import '../../../core/models/storage_stat_model.dart';
import '../../../shared/widgets/session_section.dart';

class StorageManagementScreen extends StatefulWidget {
  const StorageManagementScreen({super.key});

  @override
  State<StorageManagementScreen> createState() =>
      _StorageManagementScreenState();
}

class _StorageManagementScreenState extends State<StorageManagementScreen> {
  final _storageStat = StorageStat(
    totalBytes: 26843545600, // 25GB
    usedBytes: 8053063680, // 7.5GB
  );

  final _storageBreakdown = [
    {
      'label': 'Downloaded Songs',
      'bytes': 4026531840, // 3.75GB
      'icon': Icons.music_note_rounded,
      'color': Colors.blue,
    },
    {
      'label': 'Uploads',
      'bytes': 2147483648, // 2GB
      'icon': Icons.upload_file_rounded,
      'color': Colors.green,
    },
    {
      'label': 'Cache',
      'bytes': 1073741824, // 1GB
      'icon': Icons.cleaning_services_rounded,
      'color': Colors.orange,
    },
    {
      'label': 'Other',
      'bytes': 805306368, // 750MB
      'icon': Icons.folder_rounded,
      'color': Colors.purple,
    },
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Storage Management'),
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Storage Overview',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildStorageBar(theme),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Used',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: theme.colorScheme.onSurface.withOpacity(0.6),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _storageStat.usedFormatted,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Available',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: theme.colorScheme.onSurface.withOpacity(0.6),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _storageStat.availableFormatted,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                              color: theme.colorScheme.primary,
                            ),
                          ),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            'Total',
                            style: theme.textTheme.labelSmall?.copyWith(
                              color: theme.colorScheme.onSurface.withOpacity(0.6),
                            ),
                          ),
                          const SizedBox(height: 4),
                          Text(
                            _storageStat.totalFormatted,
                            style: theme.textTheme.titleMedium?.copyWith(
                              fontWeight: FontWeight.w700,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),
            SessionSection(
              title: 'Storage Breakdown',
              child: ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _storageBreakdown.length,
                itemBuilder: (context, index) {
                  final item = _storageBreakdown[index];
                  final bytes = item['bytes'] as int;
                  // Safe division: if usedBytes is 0, percentage will be 0
                  final percentage = _storageStat.usedBytes == 0
                      ? 0.0
                      : (bytes / _storageStat.usedBytes) * 100;
                  final sizeLabel = StorageStat._formatBytes(bytes);

                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 12),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 8),
                      child: Column(
                        children: [
                          Row(
                            children: [
                              Container(
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: (item['color'] as Color)
                                      .withOpacity(0.2),
                                ),
                                padding: const EdgeInsets.all(8),
                                child: Icon(
                                  item['icon'] as IconData,
                                  color: item['color'] as Color,
                                  size: 20,
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment:
                                      CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      item['label'] as String,
                                      style:
                                          theme.textTheme.labelLarge,
                                    ),
                                    const SizedBox(height: 4),
                                    ClipRRect(
                                      borderRadius:
                                          BorderRadius.circular(4),
                                      child:
                                          LinearProgressIndicator(
                                        value: percentage / 100,
                                        minHeight: 6,
                                        backgroundColor:
                                            theme.colorScheme
                                                .outlineVariant
                                                .withOpacity(0.3),
                                        valueColor:
                                            AlwaysStoppedAnimation(
                                          item['color'] as Color,
                                        ),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Column(
                                crossAxisAlignment:
                                    CrossAxisAlignment.end,
                                children: [
                                  Text(
                                    sizeLabel,
                                    style:
                                        theme.textTheme.labelLarge,
                                  ),
                                  Text(
                                    '${percentage.toStringAsFixed(0)}%',
                                    style:
                                        theme.textTheme.labelSmall
                                            ?.copyWith(
                                      color: theme.colorScheme
                                          .onSurface
                                          .withOpacity(0.6),
                                    ),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
            SessionSection(
              title: 'Actions',
              showDivider: false,
              child: ListView(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                children: [
                  ListTile(
                    leading: const Icon(Icons.cleaning_services_rounded),
                    title: const Text('Clear Cache'),
                    subtitle: const Text('Free up ~1GB of space'),
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Cache cleared successfully'),
                        ),
                      );
                    },
                  ),
                  ListTile(
                    leading: const Icon(Icons.delete_rounded),
                    title: const Text('Remove Downloaded Songs'),
                    subtitle: const Text('Free up the storage from downloads'),
                    onTap: () {},
                  ),
                  ListTile(
                    leading: const Icon(Icons.upgrade_rounded),
                    title: const Text('Get Premium Storage'),
                    subtitle: const Text('Upgrade for unlimited storage'),
                    trailing: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 8,
                        vertical: 4,
                      ),
                      decoration: BoxDecoration(
                        color: theme.colorScheme.primaryContainer,
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: Text(
                        'Upgrade',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                    onTap: () {},
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStorageBar(ThemeData theme) {
    return Column(
      children: [
        ClipRRect(
          borderRadius: BorderRadius.circular(12),
          child: LinearProgressIndicator(
            value: _storageStat.usagePercentage / 100,
            minHeight: 24,
            backgroundColor:
                theme.colorScheme.outlineVariant.withOpacity(0.3),
            valueColor: AlwaysStoppedAnimation<Color>(
              _storageStat.usagePercentage > 80
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
              '${_storageStat.usagePercentage.toStringAsFixed(1)}% Full',
              style: theme.textTheme.labelSmall?.copyWith(
                color: theme.colorScheme.onSurface.withOpacity(0.6),
              ),
            ),
            if (_storageStat.usagePercentage > 80)
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: theme.colorScheme.error.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(
                      Icons.warning_rounded,
                      size: 14,
                      color: theme.colorScheme.error,
                    ),
                    const SizedBox(width: 4),
                    Text(
                      'Running low on space',
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.error,
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ],
    );
  }
}
