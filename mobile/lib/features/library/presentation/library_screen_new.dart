import 'package:flutter/material.dart';

import '../../../core/models/song_model.dart';
import '../../../core/models/album_model.dart';
import '../../../core/models/playlist_model.dart';
import '../../../core/repositories/mock_song_repository.dart';
import '../../../shared/widgets/empty_state_widget.dart';
import '../../../shared/widgets/song_list_tile.dart';
import '../../../shared/widgets/playlist_card.dart';
import '../../../shared/widgets/safe_future_builder.dart';

class LibraryScreen extends StatefulWidget {
  const LibraryScreen({super.key});

  @override
  State<LibraryScreen> createState() => _LibraryScreenState();
}

class _LibraryScreenState extends State<LibraryScreen>
    with TickerProviderStateMixin, AutomaticKeepAliveClientMixin, RestorationMixin {
  final _repository = MockSongRepository();
  final RestorableInt _restoredTabIndex = RestorableInt(0);
  final ScrollController _favoritesScrollController = ScrollController();

  static const int _favoritesPageSize = 20;

  late TabController _tabController;
  final List<Song> _favoriteSongs = <Song>[];
  int _favoritePage = 0;
  bool _hasMoreFavorites = true;
  bool _isLoadingFavorites = false;
  bool _isLoadingMoreFavorites = false;
  Object? _favoriteLoadError;

  late Future<List<Album>> _albums;
  late Future<List<Playlist>> _playlists;

  @override
  String get restorationId => 'library_screen';

  @override
  void restoreState(RestorationBucket? oldBucket, bool initialRestore) {
    registerForRestoration(_restoredTabIndex, 'library_tab');
    if (_tabController.index != _restoredTabIndex.value) {
      _tabController.index = _restoredTabIndex.value.clamp(0, 2);
    }
  }

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this, initialIndex: _restoredTabIndex.value);
    _tabController.addListener(() {
      if (!_tabController.indexIsChanging) {
        _restoredTabIndex.value = _tabController.index;
      }
    });

    _albums = _repository.getTrendingAlbums();
    _playlists = _repository.getUserPlaylists();
    _favoritesScrollController.addListener(_onFavoritesScroll);

    _loadInitialFavorites();
  }

  @override
  void dispose() {
    _restoredTabIndex.dispose();
    _favoritesScrollController.dispose();
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadInitialFavorites() async {
    if (_isLoadingFavorites) {
      return;
    }

    setState(() {
      _isLoadingFavorites = true;
      _favoriteLoadError = null;
      _favoriteSongs.clear();
      _favoritePage = 0;
      _hasMoreFavorites = true;
    });

    try {
      await _loadMoreFavorites();
    } catch (error) {
      setState(() {
        _favoriteLoadError = error;
      });
    } finally {
      if (mounted) {
        setState(() {
          _isLoadingFavorites = false;
        });
      }
    }
  }

  Future<void> _loadMoreFavorites() async {
    if (_isLoadingMoreFavorites || !_hasMoreFavorites) {
      return;
    }

    setState(() {
      _isLoadingMoreFavorites = true;
    });

    final nextPage = _favoritePage + 1;
    final result = await _repository.getFavoriteSongsPage(
      page: nextPage,
      pageSize: _favoritesPageSize,
    );

    if (!mounted) {
      return;
    }

    setState(() {
      _favoritePage = nextPage;
      _favoriteSongs.addAll(result.items);
      _hasMoreFavorites = result.hasMore;
      _isLoadingMoreFavorites = false;
      _favoriteLoadError = null;
    });
  }

  void _onFavoritesScroll() {
    if (!_favoritesScrollController.hasClients) {
      return;
    }

    final remaining = _favoritesScrollController.position.maxScrollExtent - _favoritesScrollController.offset;
    if (remaining < 300) {
      _loadMoreFavorites();
    }
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final theme = Theme.of(context);

    return Column(
      children: [
        TabBar(
          controller: _tabController,
          tabs: const [
            Tab(text: 'Liked Songs'),
            Tab(text: 'Albums'),
            Tab(text: 'Playlists'),
          ],
        ),
        Expanded(
          child: TabBarView(
            controller: _tabController,
            children: [
              // Liked Songs Tab
              _buildFavoritesTab(theme),
              // Albums Tab
              SafeFutureBuilder<List<Album>>(
                future: _albums,
                onRetry: () {
                  setState(() {
                    _albums = _repository.getTrendingAlbums();
                  });
                },
                builder: (context, albums) {
                  if (albums.isEmpty) {
                    return EmptyStateWidget(
                      icon: Icons.album_rounded,
                      title: 'No albums',
                      description: 'Albums you follow will appear here',
                    );
                  }

                  return ListView.builder(
                    cacheExtent: 400,
                    itemCount: albums.length,
                    itemBuilder: (context, index) {
                      final album = albums[index];
                      return SongListTile(
                        title: album.name,
                        subtitle:
                            '${album.songCount} songs • ${album.artist}',
                        imageUrl: album.albumArt,
                        onTap: () {},
                      );
                    },
                  );
                },
              ),
              // Playlists Tab
              SafeFutureBuilder<List<Playlist>>(
                future: _playlists,
                onRetry: () {
                  setState(() {
                    _playlists = _repository.getUserPlaylists();
                  });
                },
                builder: (context, playlists) {
                  if (playlists.isEmpty) {
                    return EmptyStateWidget(
                      icon: Icons.playlist_play_rounded,
                      title: 'No playlists yet',
                      description: 'Create your first playlist to get started',
                      action: FilledButton(
                        onPressed: () {},
                        child: const Text('Create Playlist'),
                      ),
                    );
                  }

                  return ListView.builder(
                    cacheExtent: 600,
                    padding: const EdgeInsets.all(12),
                    itemCount: playlists.length,
                    itemBuilder: (context, index) => SizedBox(
                      height: 180,
                      child: PlaylistCard(
                        name: playlists[index].name,
                        description:
                            playlists[index].description,
                        coverImage:
                            playlists[index].coverImage,
                        songCount:
                            playlists[index].songCount,
                        onTap: () {},
                      ),
                    ),
                  );
                },
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildFavoritesTab(ThemeData theme) {
    if (_isLoadingFavorites && _favoriteSongs.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_favoriteLoadError != null && _favoriteSongs.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline_rounded, size: 32, color: theme.colorScheme.error),
            const SizedBox(height: 12),
            Text('Failed to load liked songs', style: theme.textTheme.labelMedium),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: _loadInitialFavorites,
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
            ),
          ],
        ),
      );
    }

    if (_favoriteSongs.isEmpty) {
      return EmptyStateWidget(
        icon: Icons.favorite_border_rounded,
        title: 'No liked songs yet',
        description: 'Mark songs as favorite to see them here',
        action: FilledButton(
          onPressed: () {},
          child: const Text('Explore Music'),
        ),
      );
    }

    return RefreshIndicator(
      onRefresh: _loadInitialFavorites,
      child: ListView.builder(
        controller: _favoritesScrollController,
        cacheExtent: 500,
        itemCount: _favoriteSongs.length + (_hasMoreFavorites || _isLoadingMoreFavorites ? 1 : 0),
        itemBuilder: (context, index) {
          if (index >= _favoriteSongs.length) {
            return const Padding(
              padding: EdgeInsets.symmetric(vertical: 16),
              child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
            );
          }

          final song = _favoriteSongs[index];
          return SongListTile(
            title: song.title,
            subtitle: song.artist,
            imageUrl: song.albumArt,
            onTap: () {},
            onPlayPressed: () {},
          );
        },
      ),
    );
  }
}
