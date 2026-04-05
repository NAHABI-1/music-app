class AppConfig {
  static const String appName = 'CloudTune';
  static const String apiBaseUrl = String.fromEnvironment(
    'CLOUDTUNE_API_BASE_URL',
    defaultValue: 'http://localhost:4000',
  );
}