import 'package:flutter/material.dart';

class SongListTile extends StatelessWidget {
  final String title;
  final String subtitle;
  final String? imageUrl;
  final VoidCallback onTap;
  final VoidCallback? onPlayPressed;
  final bool isPlaylist;

  const SongListTile({
    super.key,
    required this.title,
    required this.subtitle,
    this.imageUrl,
    required this.onTap,
    this.onPlayPressed,
    this.isPlaylist = false,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: theme.colorScheme.surfaceContainerLow,
      ),
      child: ListTile(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        leading: ClipRRect(
          borderRadius: BorderRadius.circular(8),
          child: imageUrl != null
              ? Image.network(
                  imageUrl!,
                  width: 50,
                  height: 50,
                  fit: BoxFit.cover,
                  errorBuilder: (_, __, ___) => Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primaryContainer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Icon(
                      Icons.music_note_rounded,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                )
              : Container(
                  width: 50,
                  height: 50,
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(8),
                  ),
                  child: Icon(
                    isPlaylist ? Icons.playlist_play_rounded : Icons.music_note_rounded,
                    color: theme.colorScheme.primary,
                  ),
                ),
        ),
        title: Text(title, style: theme.textTheme.labelLarge),
        subtitle: Text(
          subtitle,
          maxLines: 1,
          overflow: TextOverflow.ellipsis,
          style: theme.textTheme.labelSmall?.copyWith(
            color: theme.colorScheme.onSurface.withOpacity(0.6),
          ),
        ),
        trailing: onPlayPressed != null
            ? IconButton(
                onPressed: onPlayPressed,
                icon: Icon(Icons.play_circle_rounded,
                    color: theme.colorScheme.primary),
              )
            : null,
        onTap: onTap,
      ),
    );
  }
}
