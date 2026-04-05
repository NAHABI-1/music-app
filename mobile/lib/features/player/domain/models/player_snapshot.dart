class PlayerSnapshot {
  const PlayerSnapshot({
    required this.currentIndex,
    required this.isPlaying,
    required this.position,
    required this.bufferedPosition,
    this.duration,
  });

  final int? currentIndex;
  final bool isPlaying;
  final Duration position;
  final Duration bufferedPosition;
  final Duration? duration;
}
