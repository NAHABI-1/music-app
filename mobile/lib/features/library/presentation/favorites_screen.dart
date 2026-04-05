import 'package:flutter/material.dart';
import '../../../core/models/song_model.dart';
import '../../../core/repositories/mock_song_repository.dart';
import '../../../shared/widgets/song_list_tile.dart';
import '../../../shared/widgets/empty_state_widget.dart';
import '../../../shared/widgets/premium_upsell_card.dart';

class FavoritesScreen extends StatefulWidget {
  const FavoritesScreen({super.key});

  @override
  State<FavoritesScreen> createState() => _FavoritesScreenState();
}

class _FavoritesScreenState extends State<FavoritesScreen>
    with AutomaticKeepAliveClientMixin {
  final _repository = MockSongRepository();
  late Future<List<Song>> _favorites;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _favorites = _repository.getFavoriteSongs();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);

    return FutureBuilder<List<Song>>(
      future: _favorites,
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Center(child: CircularProgressIndicator());
        }

        if (snapshot.hasError) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline_rounded, size: 32, color: Colors.red),
                const SizedBox(height: 12),
                Text('Failed to load favorites', style: Theme.of(context).textTheme.labelMedium),
              ],
            ),
          );
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return EmptyStateWidget(
            icon: Icons.favorite_border_rounded,
            title: 'No favorite songs yet',
            description: 'Mark songs as favorite to see them here. Premium members get unlimited favorites!',
            action: FilledButton(
              onPressed: () {},
              child: const Text('Explore Music'),
            ),
          );
        }

        return SingleChildScrollView(
          child: Column(
            children: [
              PremiumUpsellCard(
                title: 'Unlimited Favorites',
                description: 'Go Premium to organize & enjoy unlimited favorites',
                features: [
                  'Store unlimited favorites',
                  'Organize into custom lists',
                  'Sync across devices',
                  'Offline favorites access',
                ],
                onUpgradePressed: () {},
              ),
              ListView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: snapshot.data!.length,
                itemBuilder: (context, index) => SongListTile(
                  title: snapshot.data![index].title,
                  subtitle: snapshot.data![index].artist,
                  imageUrl: snapshot.data![index].albumArt,
                  onTap: () {},
                  onPlayPressed: () {},
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
