import 'dart:async';

import 'package:flutter/material.dart';

import '../../../core/models/album_model.dart';
import '../../../core/models/song_model.dart';
import '../../../core/repositories/mock_song_repository.dart';
import '../../../shared/widgets/session_section.dart';
import '../../../shared/widgets/song_list_tile.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen>
    with AutomaticKeepAliveClientMixin, RestorationMixin {
  final _repository = MockSongRepository();
  final RestorableTextEditingController _searchController = RestorableTextEditingController();
  final ScrollController _scrollController = ScrollController();

  Timer? _debounce;
  int _searchNonce = 0;

  static const int _songPageSize = 20;

  List<Song> _searchResults = <Song>[];
  List<Album> _albumResults = <Album>[];
  int _songPage = 0;
  bool _hasMoreSongs = false;
  bool _loadingMoreSongs = false;
  bool _isSearching = false;
  Object? _error;

  @override
  String get restorationId => 'search_screen';

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  @override
  void restoreState(RestorationBucket? oldBucket, bool initialRestore) {
    registerForRestoration(_searchController, 'search_query');
    final query = _searchController.value.text.trim();
    if (query.isNotEmpty) {
      _performSearch(query, reset: true);
    }
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _performSearch(String query, {required bool reset}) async {
    if (query.isEmpty) {
      setState(() {
        _searchResults = <Song>[];
        _albumResults = <Album>[];
        _songPage = 0;
        _hasMoreSongs = false;
        _loadingMoreSongs = false;
        _error = null;
        _isSearching = false;
      });
      return;
    }

    final nonce = ++_searchNonce;

    if (reset) {
      setState(() {
        _isSearching = true;
        _error = null;
        _searchResults = <Song>[];
        _albumResults = <Album>[];
        _songPage = 0;
        _hasMoreSongs = false;
      });
    }

    final nextPage = reset ? 1 : (_songPage + 1);

    try {
      final songsPage = await _repository.searchSongsPage(
        query,
        page: nextPage,
        pageSize: _songPageSize,
      );
      final albums = await _repository.getTrendingAlbums();

      if (!mounted || nonce != _searchNonce) {
        return;
      }

      setState(() {
        _searchResults = reset ? songsPage.items : [..._searchResults, ...songsPage.items];
        _albumResults = albums
            .where((a) => a.name.toLowerCase().contains(query.toLowerCase()))
            .toList(growable: false);
        _songPage = nextPage;
        _hasMoreSongs = songsPage.hasMore;
        _loadingMoreSongs = false;
        _isSearching = false;
        _error = null;
      });
    } catch (error) {
      if (!mounted || nonce != _searchNonce) {
        return;
      }

      setState(() {
        _loadingMoreSongs = false;
        _isSearching = false;
        _error = error;
      });
    }
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 250), () {
      _performSearch(value.trim(), reset: true);
    });
  }

  void _onScroll() {
    if (!_scrollController.hasClients || _isSearching || _loadingMoreSongs || !_hasMoreSongs) {
      return;
    }

    final remaining = _scrollController.position.maxScrollExtent - _scrollController.offset;
    if (remaining < 280) {
      setState(() {
        _loadingMoreSongs = true;
      });
      _performSearch(_searchController.value.text.trim(), reset: false);
    }
  }

  Widget _buildError(ThemeData theme) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.cloud_off_rounded, size: 48, color: theme.colorScheme.error),
            const SizedBox(height: 12),
            Text('Search failed', style: theme.textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              _error.toString(),
              textAlign: TextAlign.center,
              style: theme.textTheme.bodySmall,
            ),
            const SizedBox(height: 12),
            FilledButton.icon(
              onPressed: () => _performSearch(_searchController.value.text.trim(), reset: true),
              icon: const Icon(Icons.refresh_rounded),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final theme = Theme.of(context);
    final query = _searchController.value.text.trim();

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.all(16),
          child: SearchBar(
            controller: _searchController.value,
            hintText: 'Search songs, artists, albums...',
            leading: const Padding(
              padding: EdgeInsets.only(left: 8),
              child: Icon(Icons.search_rounded),
            ),
            onChanged: _onSearchChanged,
            trailing: [
              if (_searchController.value.text.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: IconButton(
                    onPressed: () {
                      _searchController.value.clear();
                      _performSearch('', reset: true);
                    },
                    icon: const Icon(Icons.close_rounded),
                  ),
                ),
            ],
          ),
        ),
        if (query.isEmpty)
          Expanded(
            child: Center(
              child: Icon(
                Icons.search_rounded,
                size: 56,
                color: theme.colorScheme.onSurface.withOpacity(0.3),
              ),
            ),
          )
        else if (_isSearching && _searchResults.isEmpty && _albumResults.isEmpty)
          Expanded(
            child: Center(
              child: CircularProgressIndicator(color: theme.colorScheme.primary),
            ),
          )
        else if (_error != null && _searchResults.isEmpty && _albumResults.isEmpty)
          Expanded(child: _buildError(theme))
        else if (_searchResults.isEmpty && _albumResults.isEmpty)
          Expanded(
            child: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.music_note_rounded,
                    size: 48,
                    color: theme.colorScheme.onSurface.withOpacity(0.3),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'No results found',
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.6),
                    ),
                  ),
                ],
              ),
            ),
          )
        else
          Expanded(
            child: ListView(
              controller: _scrollController,
              children: [
                if (_albumResults.isNotEmpty)
                  SessionSection(
                    title: 'Albums',
                    child: ListView.builder(
                      shrinkWrap: true,
                      cacheExtent: 400,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _albumResults.length,
                      itemBuilder: (context, index) => SongListTile(
                        title: _albumResults[index].name,
                        subtitle: _albumResults[index].artist,
                        imageUrl: _albumResults[index].albumArt,
                        onTap: () {},
                        isPlaylist: true,
                      ),
                    ),
                  ),
                if (_searchResults.isNotEmpty)
                  SessionSection(
                    title: 'Songs',
                    child: ListView.builder(
                      shrinkWrap: true,
                      cacheExtent: 700,
                      physics: const NeverScrollableScrollPhysics(),
                      itemCount: _searchResults.length + (_loadingMoreSongs || _hasMoreSongs ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (index >= _searchResults.length) {
                          return const Padding(
                            padding: EdgeInsets.symmetric(vertical: 16),
                            child: Center(child: CircularProgressIndicator(strokeWidth: 2)),
                          );
                        }

                        return SongListTile(
                          title: _searchResults[index].title,
                          subtitle: _searchResults[index].artist,
                          imageUrl: _searchResults[index].albumArt,
                          onTap: () {},
                          onPlayPressed: () {},
                        );
                      },
                    ),
                  ),
              ],
            ),
          ),
      ],
    );
  }
}
