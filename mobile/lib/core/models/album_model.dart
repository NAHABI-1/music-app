import 'song_model.dart';

class Album {
  final String id;
  final String name;
  final String artist;
  final String albumArt;
  final List<Song> songs;
  final int releaseYear;
  final String genre;

  Album({
    required this.id,
    required this.name,
    required this.artist,
    required this.albumArt,
    this.songs = const [],
    required this.releaseYear,
    this.genre = 'Pop',
  });

  int get songCount => songs.length;
}
