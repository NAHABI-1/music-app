class Song {
  final String id;
  final String title;
  final String artist;
  final String albumArt;
  final Duration duration;
  final int releaseYear;
  final bool isExplicit;
  final int plays;
  final bool isFavorite;
  final String genre;

  Song({
    required this.id,
    required this.title,
    required this.artist,
    required this.albumArt,
    required this.duration,
    required this.releaseYear,
    this.isExplicit = false,
    this.plays = 0,
    this.isFavorite = false,
    this.genre = 'Pop',
  });

  String get durationString {
    final minutes = duration.inMinutes;
    final seconds = duration.inSeconds % 60;
    return '$minutes:${seconds.toString().padLeft(2, '0')}';
  }
}
