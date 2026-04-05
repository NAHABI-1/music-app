import 'package:flutter/material.dart';
import '../../../core/models/song_model.dart';
import '../../../core/repositories/mock_song_repository.dart';
import '../../../shared/widgets/song_card.dart';
import '../../../shared/widgets/session_section.dart';
import '../../../shared/widgets/premium_upsell_card.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen>
    with AutomaticKeepAliveClientMixin {
  final _repository = MockSongRepository();
  late Future<List<Song>> _trendingSongs;
  late Future<List<Song>> _recommendedSongs;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _trendingSongs = _repository.getTrendingSongs();
    _recommendedSongs = _repository.getRecommendedSongs();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final theme = Theme.of(context);

    return RefreshIndicator(
      onRefresh: () async {
        _repository.clearCaches();
        setState(() {
          _trendingSongs = _repository.getTrendingSongs();
          _recommendedSongs = _repository.getRecommendedSongs();
        });
        await Future.wait([_trendingSongs, _recommendedSongs]);
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.all(16),
              child: SearchBar(
                hintText: 'Search songs, artists...',
                leading: const Padding(
                  padding: EdgeInsets.only(left: 8),
                  child: Icon(Icons.search_rounded),
                ),
                trailing: [
                  Container(
                    margin: const EdgeInsets.only(right: 8),
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: theme.colorScheme.primaryContainer,
                    ),
                    child: IconButton(
                      onPressed: () {},
                      icon: Icon(
                        Icons.tune_rounded,
                        color: theme.colorScheme.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            PremiumUpsellCard(
              title: 'Upgrade to Premium',
              description: 'Enjoy ad-free listening and offline downloads',
              features: [
                'Ad-free listening',
                '320kbps High Quality',
                'Offline downloads',
              ],
              onUpgradePressed: () {},
            ),
            SessionSection(
              title: 'Trending Now',
              child: FutureBuilder<List<Song>>(
                future: _trendingSongs,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Padding(
                      padding: EdgeInsets.all(20),
                      child: CircularProgressIndicator(),
                    );
                  }

                  if (snapshot.hasError) {
                    return Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          Icon(Icons.error_outline_rounded,
                              size: 32,
                              color: theme.colorScheme.error),
                          const SizedBox(height: 12),
                          Text('Failed to load trending songs',
                              style: theme.textTheme.labelMedium,
                              textAlign: TextAlign.center),
                        ],
                      ),
                    );
                  }

                  if (!snapshot.hasData || snapshot.data!.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.all(20),
                      child: Text('No trending songs available'),
                    );
                  }

                  return SizedBox(
                    height: 260,
                    child: ListView.builder(
                      cacheExtent: 500,
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 8),
                      itemCount: snapshot.data!.length,
                      itemBuilder: (context, index) => Padding(
                        padding: const EdgeInsets.symmetric(horizontal: 8),
                        child: SizedBox(
                          width: 150,
                          child: SongCard(
                            title: snapshot.data![index].title,
                            artist: snapshot.data![index].artist,
                            imageUrl: snapshot.data![index].albumArt,
                            onTap: () {},
                            onPlayPressed: () {},
                            isCompact: true,
                          ),
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
            SessionSection(
              title: 'Recommended for You',
              child: FutureBuilder<List<Song>>(
                future: _recommendedSongs,
                builder: (context, snapshot) {
                  if (snapshot.connectionState == ConnectionState.waiting) {
                    return const Padding(
                      padding: EdgeInsets.all(20),
                      child: CircularProgressIndicator(),
                    );
                  }

                  if (snapshot.hasError) {
                    return Padding(
                      padding: const EdgeInsets.all(20),
                      child: Column(
                        children: [
                          Icon(Icons.error_outline_rounded,
                              size: 32,
                              color: theme.colorScheme.error),
                          const SizedBox(height: 12),
                          Text('Failed to load recommendations',
                              style: theme.textTheme.labelMedium,
                              textAlign: TextAlign.center),
                        ],
                      ),
                    );
                  }

                  if (!snapshot.hasData || snapshot.data!.isEmpty) {
                    return const Padding(
                      padding: EdgeInsets.all(20),
                      child: Text('No recommendations available'),
                    );
                  }

                  return Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                    child: GridView.builder(
                      shrinkWrap: true,
                      cacheExtent: 800,
                      physics: const NeverScrollableScrollPhysics(),
                      gridDelegate:
                          const SliverGridDelegateWithFixedCrossAxisCount(
                        crossAxisCount: 2,
                        childAspectRatio: 0.7,
                        crossAxisSpacing: 12,
                        mainAxisSpacing: 12,
                      ),
                      itemCount: snapshot.data!.length,
                      itemBuilder: (context, index) => SongCard(
                        title: snapshot.data![index].title,
                        artist: snapshot.data![index].artist,
                        imageUrl: snapshot.data![index].albumArt,
                        onTap: () {},
                        onPlayPressed: () {},
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
}
