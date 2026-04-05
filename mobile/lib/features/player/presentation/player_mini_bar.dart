import 'package:flutter/material.dart';

import '../application/player_scope.dart';

class PlayerMiniBar extends StatelessWidget {
  const PlayerMiniBar({super.key});

  @override
  Widget build(BuildContext context) {
    final controller = PlayerScope.of(context);
    final state = controller.state;
    final item = state.currentItem;

    if (item == null) {
      return const SizedBox.shrink();
    }

    return Material(
      color: Theme.of(context).colorScheme.surfaceContainerHigh,
      child: SafeArea(
        top: false,
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          child: Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(
                      item.title,
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                    Text(
                      item.artist ?? 'Unknown Artist',
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ],
                ),
              ),
              IconButton(
                onPressed: state.hasPrevious ? controller.previous : null,
                icon: const Icon(Icons.skip_previous),
              ),
              IconButton(
                onPressed: controller.togglePlayPause,
                icon: Icon(state.isPlaying ? Icons.pause : Icons.play_arrow),
              ),
              IconButton(
                onPressed: state.hasNext ? controller.next : null,
                icon: const Icon(Icons.skip_next),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
