import 'song_model.dart';

class Playlist {
  final String id;
  final String name;
  final String description;
  final String? coverImage;
  final List<Song> songs;
  final DateTime createdAt;
  final bool isPublic;
  final String? collab;

  Playlist({
    required this.id,
    required this.name,
    required this.description,
    this.coverImage,
    this.songs = const [],
    DateTime? createdAt,
    this.isPublic = true,
    this.collab,
  }) : createdAt = createdAt ?? DateTime.now();

  int get songCount => songs.length;
  Duration get totalDuration =>
      songs.fold(Duration.zero, (sum, song) => sum + song.duration);
}
