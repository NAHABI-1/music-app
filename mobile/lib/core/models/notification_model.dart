enum NotificationType { announcement, release, feature, promo }

class CloudTuneNotification {
  final String id;
  final String title;
  final String message;
  final NotificationType type;
  final DateTime createdAt;
  final bool isRead;
  final String? actionUrl;
  final String? imageUrl;

  CloudTuneNotification({
    required this.id,
    required this.title,
    required this.message,
    required this.type,
    DateTime? createdAt,
    this.isRead = false,
    this.actionUrl,
    this.imageUrl,
  }) : createdAt = createdAt ?? DateTime.now();

  String get typeLabel {
    switch (type) {
      case NotificationType.announcement:
        return 'Announcement';
      case NotificationType.release:
        return 'New Release';
      case NotificationType.feature:
        return 'New Feature';
      case NotificationType.promo:
        return 'Promotion';
    }
  }
}
