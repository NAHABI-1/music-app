import 'package:flutter/material.dart';
import '../../../core/models/notification_model.dart';
import '../../../shared/widgets/session_section.dart';
import '../../../shared/widgets/empty_state_widget.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});

  @override
  State<NotificationsScreen> createState() => _NotificationsScreenState();
}

class _NotificationsScreenState extends State<NotificationsScreen> {
  final _notifications = [
    CloudTuneNotification(
      id: '1',
      title: 'New Feature: Collaborative Playlists',
      message: 'Invite friends to create and edit playlists together',
      type: NotificationType.feature,
      imageUrl: 'https://picsum.photos/300/200?random=1',
    ),
    CloudTuneNotification(
      id: '2',
      title: 'Luna Wave Released New Album',
      message: 'Listen to "Neon Dreams" now featuring exclusive tracks',
      type: NotificationType.release,
      imageUrl: 'https://picsum.photos/300/200?random=2',
    ),
    CloudTuneNotification(
      id: '3',
      title: 'Announcement: Server Maintenance',
      message: 'CloudTune will be undergoing maintenance on Sunday',
      type: NotificationType.announcement,
    ),
    CloudTuneNotification(
      id: '4',
      title: 'Get Premium for \$4.99/month',
      message: 'Limited time offer: 50% off the first 3 months',
      type: NotificationType.promo,
      imageUrl: 'https://picsum.photos/300/200?random=3',
    ),
  ];

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    if (_notifications.isEmpty) {
      return Scaffold(
        appBar: AppBar(title: const Text('Notifications')),
        body: EmptyStateWidget(
          icon: Icons.notifications_none_rounded,
          title: 'No notifications',
          description: 'Stay tuned for updates about new features and releases',
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
        actions: [
          TextButton(
            onPressed: () {},
            child: const Text('Mark all'),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            SessionSection(
              title: 'Today',
              child: ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _notifications.length,
                itemBuilder: (context, index) {
                  final notification = _notifications[index];
                  return Dismissible(
                    key: ValueKey(notification.id),
                    onDismissed: (direction) {},
                    child: Container(
                      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      decoration: BoxDecoration(
                        borderRadius: BorderRadius.circular(12),
                        color: notification.isRead
                            ? null
                            : theme.colorScheme.primaryContainer
                                .withOpacity(0.2),
                      ),
                      child: ListTile(
                        leading: notification.imageUrl != null
                            ? ClipRRect(
                                borderRadius: BorderRadius.circular(8),
                                child: Image.network(
                                  notification.imageUrl!,
                                  width: 48,
                                  height: 48,
                                  fit: BoxFit.cover,
                                  errorBuilder: (_, __, ___) =>
                                      _notificationIcon(
                                        notification.type,
                                        theme,
                                      ),
                                ),
                              )
                            : _notificationIcon(notification.type, theme),
                        title: Text(
                          notification.title,
                          style: theme.textTheme.labelLarge?.copyWith(
                            fontWeight: notification.isRead
                                ? FontWeight.w500
                                : FontWeight.w600,
                          ),
                        ),
                        subtitle: Text(
                          notification.message,
                          maxLines: 2,
                          overflow: TextOverflow.ellipsis,
                          style: theme.textTheme.labelSmall,
                        ),
                        trailing: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            if (!notification.isRead)
                              Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  shape: BoxShape.circle,
                                  color: theme.colorScheme.primary,
                                ),
                              ),
                          ],
                        ),
                        onTap: () {},
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _notificationIcon(
    NotificationType type,
    ThemeData theme,
  ) {
    IconData icon;
    Color? color;

    switch (type) {
      case NotificationType.announcement:
        icon = Icons.info_rounded;
        color = Colors.blue;
        break;
      case NotificationType.release:
        icon = Icons.new_releases_rounded;
        color = Colors.green;
        break;
      case NotificationType.feature:
        icon = Icons.lightbulb_rounded;
        color = Colors.amber;
        break;
      case NotificationType.promo:
        icon = Icons.local_offer_rounded;
        color = Colors.red;
        break;
    }

    return Container(
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: color?.withOpacity(0.2),
      ),
      padding: const EdgeInsets.all(8),
      child: Icon(
        icon,
        color: color,
        size: 20,
      ),
    );
  }
}
