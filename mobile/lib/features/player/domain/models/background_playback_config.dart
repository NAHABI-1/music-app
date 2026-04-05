class BackgroundPlaybackConfig {
  const BackgroundPlaybackConfig({
    required this.androidNotificationChannelId,
    required this.androidNotificationChannelName,
    required this.androidOngoingNotification,
    required this.enableLockScreenControls,
  });

  final String androidNotificationChannelId;
  final String androidNotificationChannelName;
  final bool androidOngoingNotification;
  final bool enableLockScreenControls;
}
