import 'package:flutter/material.dart';
import '../../../core/models/song_model.dart';
import '../../../shared/widgets/session_section.dart';

class SongDetailsScreen extends StatelessWidget {
  final Song song;

  const SongDetailsScreen({
    super.key,
    required this.song,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Song Details'),
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ClipRRect(
              borderRadius: const BorderRadius.only(
                bottomLeft: Radius.circular(24),
                bottomRight: Radius.circular(24),
              ),
              child: Image.network(
                song.albumArt,
                width: double.infinity,
                height: 300,
                fit: BoxFit.cover,
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    song.title,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    song.artist,
                    style: theme.textTheme.titleMedium?.copyWith(
                      color: theme.colorScheme.onSurface.withOpacity(0.7),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      Column(
                        children: [
                          Icon(Icons.play_circle_rounded,
                              size: 32,
                              color: theme.colorScheme.primary),
                          const SizedBox(height: 8),
                          Text('${song.plays}',
                              style: theme.textTheme.labelLarge),
                          Text('Plays',
                              style: theme.textTheme.labelSmall),
                        ],
                      ),
                      Column(
                        children: [
                          Icon(Icons.favorite_rounded,
                              size: 32,
                              color: theme.colorScheme.error),
                          const SizedBox(height: 8),
                          Text('Like',
                              style: theme.textTheme.labelLarge),
                        ],
                      ),
                      Column(
                        children: [
                          Icon(Icons.share_rounded,
                              size: 32,
                              color: theme.colorScheme.primary),
                          const SizedBox(height: 8),
                          Text('Share',
                              style: theme.textTheme.labelLarge),
                        ],
                      ),
                    ],
                  ),
                  const SizedBox(height: 32),
                  SessionSection(
                    title: 'Info',
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Row(
                            mainAxisAlignment:
                                MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Duration',
                                  style: theme.textTheme.labelMedium),
                              Text(song.durationString,
                                  style: theme.textTheme.labelLarge),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment:
                                MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Genre',
                                  style: theme.textTheme.labelMedium),
                              Text(song.genre,
                                  style: theme.textTheme.labelLarge),
                            ],
                          ),
                          const SizedBox(height: 12),
                          Row(
                            mainAxisAlignment:
                                MainAxisAlignment.spaceBetween,
                            children: [
                              Text('Released',
                                  style: theme.textTheme.labelMedium),
                              Text('${song.releaseYear}',
                                  style: theme.textTheme.labelLarge),
                            ],
                          ),
                          if (song.isExplicit) ...[
                            const SizedBox(height: 12),
                            Container(
                              padding: const EdgeInsets.symmetric(
                                horizontal: 8,
                                vertical: 4,
                              ),
                              decoration: BoxDecoration(
                                color:
                                    theme.colorScheme.error.withOpacity(0.2),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                'Explicit',
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: theme.colorScheme.error,
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ),
                  ),
                ],
              ),
            ),
            Padding(
              padding: const EdgeInsets.all(20),
              child: SizedBox(
                width: double.infinity,
                child: FilledButton.icon(
                  onPressed: () {},
                  icon: const Icon(Icons.play_arrow_rounded),
                  label: const Text('Play Now'),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
