import '../models/song_model.dart';
import '../models/album_model.dart';
import '../models/playlist_model.dart';
import '../models/paged_result.dart';
import '../utils/retry_policy.dart';
import '../utils/ttl_cache.dart';

class MockSongRepository {
  static final MockSongRepository _instance = MockSongRepository._internal();

  factory MockSongRepository() {
    return _instance;
  }

  MockSongRepository._internal();

  final TtlCache<List<Song>> _songsCache = TtlCache<List<Song>>(ttl: const Duration(seconds: 15));
  final TtlCache<List<Album>> _albumsCache = TtlCache<List<Album>>(ttl: const Duration(seconds: 20));
  final TtlCache<List<Playlist>> _playlistsCache = TtlCache<List<Playlist>>(ttl: const Duration(seconds: 20));

  static final _seedSongs = [
    Song(
      id: '1',
      title: 'Midnight Dreams',
      artist: 'Luna Wave',
      albumArt: 'https://picsum.photos/300/300?random=1',
      duration: const Duration(minutes: 3, seconds: 45),
      releaseYear: 2024,
      genre: 'Synthwave',
      plays: 125000,
    ),
    Song(
      id: '2',
      title: 'Digital Sunset',
      artist: 'Neon Lights',
      albumArt: 'https://picsum.photos/300/300?random=2',
      duration: const Duration(minutes: 4, seconds: 12),
      releaseYear: 2024,
      genre: 'Electronic',
      plays: 98000,
    ),
    Song(
      id: '3',
      title: 'Rise & Shine',
      artist: 'Aurora Sky',
      albumArt: 'https://picsum.photos/300/300?random=3',
      duration: const Duration(minutes: 3, seconds: 28),
      releaseYear: 2024,
      genre: 'Pop',
      plays: 156000,
      isFavorite: true,
    ),
    Song(
      id: '4',
      title: 'Echoes',
      artist: 'Sonic Horizon',
      albumArt: 'https://picsum.photos/300/300?random=4',
      duration: const Duration(minutes: 5, seconds: 3),
      releaseYear: 2023,
      genre: 'Ambient',
      plays: 67000,
    ),
    Song(
      id: '5',
      title: 'Electric Pulse',
      artist: 'Voltage',
      albumArt: 'https://picsum.photos/300/300?random=5',
      duration: const Duration(minutes: 3, seconds: 56),
      releaseYear: 2024,
      genre: 'Synthwave',
      plays: 184000,
    ),
    Song(
      id: '6',
      title: 'Velvet Night',
      artist: 'Luna Wave',
      albumArt: 'https://picsum.photos/300/300?random=6',
      duration: const Duration(minutes: 4, seconds: 22),
      releaseYear: 2023,
      genre: 'R&B',
      plays: 92000,
      isFavorite: true,
    ),
    Song(
      id: '7',
      title: 'Neon City',
      artist: 'Urban Echo',
      albumArt: 'https://picsum.photos/300/300?random=7',
      duration: const Duration(minutes: 3, seconds: 34),
      releaseYear: 2024,
      genre: 'Hip-Hop',
      plays: 210000,
    ),
    Song(
      id: '8',
      title: 'Crystal Waters',
      artist: 'Flow State',
      albumArt: 'https://picsum.photos/300/300?random=8',
      duration: const Duration(minutes: 4, seconds: 48),
      releaseYear: 2023,
      genre: 'House',
      plays: 156000,
    ),
  ];

  Future<T> _withRetry<T>(Future<T> Function() action) {
    return runWithRetry<T>(
      action,
      policy: const RetryPolicy(maxAttempts: 3),
    );
  }

  Future<List<Song>> getTrendingSongs() async {
    const key = 'trending';
    final cached = _songsCache.get(key);
    if (cached != null) {
      return cached;
    }

    final value = await _withRetry(() async {
      await Future.delayed(const Duration(milliseconds: 300));
      final songs = [..._seedSongs]..sort((a, b) => b.plays.compareTo(a.plays));
      return songs;
    });
    _songsCache.set(key, value);
    return value;
  }

  Future<List<Song>> getRecommendedSongs() async {
    const key = 'recommended';
    final cached = _songsCache.get(key);
    if (cached != null) {
      return cached;
    }

    final value = await _withRetry(() async {
      await Future.delayed(const Duration(milliseconds: 200));
      return _seedSongs.take(8).toList(growable: false);
    });
    _songsCache.set(key, value);
    return value;
  }

  Future<List<Song>> getFavoriteSongs() async {
    const key = 'favorites';
    final cached = _songsCache.get(key);
    if (cached != null) {
      return cached;
    }

    final value = await _withRetry(() async {
      await Future.delayed(const Duration(milliseconds: 150));
      return _seedSongs.where((s) => s.isFavorite).toList(growable: false);
    });
    _songsCache.set(key, value);
    return value;
  }

  Future<PagedResult<Song>> getFavoriteSongsPage({
    required int page,
    required int pageSize,
  }) async {
    final items = await getFavoriteSongs();
    return _paginate(items, page: page, pageSize: pageSize);
  }

  Future<List<Song>> searchSongs(String query) async {
    final result = await searchSongsPage(query, page: 1, pageSize: 200);
    return result.items;
  }

  Future<PagedResult<Song>> searchSongsPage(
    String query, {
    required int page,
    required int pageSize,
  }) async {
    final lowerQuery = query.trim().toLowerCase();
    final key = 'search:$lowerQuery';
    final cached = _songsCache.get(key);

    final results = cached ?? await _withRetry(() async {
      await Future.delayed(const Duration(milliseconds: 350));
      return _seedSongs
          .where((s) => s.title.toLowerCase().contains(lowerQuery) || s.artist.toLowerCase().contains(lowerQuery))
          .toList(growable: false);
    });

    if (cached == null) {
      _songsCache.set(key, results);
    }

    return _paginate(results, page: page, pageSize: pageSize);
  }

  Future<List<Album>> getTrendingAlbums() async {
    const key = 'albums';
    final cached = _albumsCache.get(key);
    if (cached != null) {
      return cached;
    }

    final value = await _withRetry(() async {
      await Future.delayed(const Duration(milliseconds: 280));
      return [
        Album(
          id: 'a1',
          name: 'Neon Nights',
          artist: 'Luna Wave',
          albumArt: 'https://picsum.photos/300/300?random=10',
          releaseYear: 2024,
          genre: 'Synthwave',
          songs: _seedSongs.sublist(0, 3),
        ),
        Album(
          id: 'a2',
          name: 'Digital Dreams',
          artist: 'Neon Lights',
          albumArt: 'https://picsum.photos/300/300?random=11',
          releaseYear: 2024,
          genre: 'Electronic',
          songs: _seedSongs.sublist(2, 5),
        ),
        Album(
          id: 'a3',
          name: 'Sonic Landscapes',
          artist: 'Sonic Horizon',
          albumArt: 'https://picsum.photos/300/300?random=12',
          releaseYear: 2023,
          genre: 'Ambient',
          songs: _seedSongs.sublist(3, 6),
        ),
      ];
    });
    _albumsCache.set(key, value);
    return value;
  }

  Future<List<Playlist>> getUserPlaylists() async {
    const key = 'playlists';
    final cached = _playlistsCache.get(key);
    if (cached != null) {
      return cached;
    }

    final value = await _withRetry(() async {
      await Future.delayed(const Duration(milliseconds: 220));
      return [
        Playlist(
          id: 'p1',
          name: 'Chill Vibes',
          description: 'Relaxing tracks for any mood',
          coverImage: 'https://picsum.photos/300/300?random=20',
          songs: _seedSongs.sublist(0, 3),
        ),
        Playlist(
          id: 'p2',
          name: 'Workout Energy',
          description: 'High-energy beats to keep you motivated',
          coverImage: 'https://picsum.photos/300/300?random=21',
          songs: _seedSongs.sublist(3, 6),
        ),
        Playlist(
          id: 'p3',
          name: 'Late Night Sessions',
          description: 'Perfect for late-night listening',
          coverImage: 'https://picsum.photos/300/300?random=22',
          songs: _seedSongs.sublist(4, 7),
        ),
      ];
    });
    _playlistsCache.set(key, value);
    return value;
  }

  Future<List<Song>> getSongsByGenre(String genre) async {
    final normalizedGenre = genre.toLowerCase();
    final key = 'genre:$normalizedGenre';
    final cached = _songsCache.get(key);
    if (cached != null) {
      return cached;
    }

    final value = await _withRetry(() async {
      await Future.delayed(const Duration(milliseconds: 260));
      return _seedSongs.where((s) => s.genre.toLowerCase() == normalizedGenre).toList(growable: false);
    });
    _songsCache.set(key, value);
    return value;
  }

  void clearCaches() {
    _songsCache.clear();
    _albumsCache.clear();
    _playlistsCache.clear();
  }

  PagedResult<T> _paginate<T>(
    List<T> items, {
    required int page,
    required int pageSize,
  }) {
    // Keep paging behavior consistent across repository methods.
    final boundedPage = page < 1 ? 1 : page;
    final boundedSize = pageSize.clamp(1, 100) as int;
    final start = (boundedPage - 1) * boundedSize;
    final end = (start + boundedSize).clamp(0, items.length);
    final pageItems = start >= items.length ? <T>[] : items.sublist(start, end);

    return PagedResult<T>(
      items: pageItems,
      page: boundedPage,
      pageSize: boundedSize,
      total: items.length,
    );
  }
}
