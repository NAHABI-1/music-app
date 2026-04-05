import 'package:flutter/material.dart';
import '../../../core/models/playlist_model.dart';
import '../../../core/repositories/mock_song_repository.dart';
import '../../../shared/widgets/playlist_card.dart';
import '../../../shared/widgets/empty_state_widget.dart';

class PlaylistsScreen extends StatefulWidget {
  const PlaylistsScreen({super.key});

  @override
  State<PlaylistsScreen> createState() => _PlaylistsScreenState();
}

class _PlaylistsScreenState extends State<PlaylistsScreen>
    with AutomaticKeepAliveClientMixin {
  final _repository = MockSongRepository();
  late Future<List<Playlist>> _playlists;

  @override
  bool get wantKeepAlive => true;

  @override
  void initState() {
    super.initState();
    _playlists = _repository.getUserPlaylists();
  }

  @override
  Widget build(BuildContext context) {
    super.build(context);
    final theme = Theme.of(context);

    return FutureBuilder<List<Playlist>>(
      future: _playlists,
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
                Text('Failed to load playlists', style: Theme.of(context).textTheme.labelMedium),
              ],
            ),
          );
        }

        if (!snapshot.hasData || snapshot.data!.isEmpty) {
          return EmptyStateWidget(
            icon: Icons.playlist_play_rounded,
            title: 'No playlists yet',
            description: 'Create your first playlist to organize your favorite music',
            action: FilledButton.icon(
              onPressed: () {},
              icon: const Icon(Icons.add_rounded),
              label: const Text('Create Playlist'),
            ),
          );
        }

        return SingleChildScrollView(
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: SizedBox(
                  width: double.infinity,
                  child: FilledButton.icon(
                    onPressed: () {},
                    icon: const Icon(Icons.add_rounded),
                    label: const Text('New Playlist'),
                  ),
                ),
              ),
              GridView.builder(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                padding: const EdgeInsets.all(12),
                gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                  crossAxisCount: 1,
                  childAspectRatio: 2.5,
                  mainAxisSpacing: 12,
                ),
                itemCount: snapshot.data!.length,
                itemBuilder: (context, index) => PlaylistCard(
                  name: snapshot.data![index].name,
                  description: snapshot.data![index].description,
                  coverImage: snapshot.data![index].coverImage,
                  songCount: snapshot.data![index].songCount,
                  onTap: () {},
                ),
              ),
            ],
          ),
        );
      },
    );
  }
}
