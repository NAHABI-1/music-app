class AnnouncementItem {
  const AnnouncementItem({
    required this.id,
    required this.title,
    required this.body,
    required this.category,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String body;
  final String category;
  final DateTime createdAt;
}
