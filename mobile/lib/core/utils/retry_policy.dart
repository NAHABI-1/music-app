import 'dart:async';
import 'dart:math';

class RetryPolicy {
  const RetryPolicy({
    this.maxAttempts = 3,
    this.baseDelay = const Duration(milliseconds: 300),
    this.maxDelay = const Duration(seconds: 3),
    this.backoffFactor = 2.0,
    this.jitterFactor = 0.2,
  });

  final int maxAttempts;
  final Duration baseDelay;
  final Duration maxDelay;
  final double backoffFactor;
  final double jitterFactor;
}

Future<T> runWithRetry<T>(
  Future<T> Function() action, {
  RetryPolicy policy = const RetryPolicy(),
  bool Function(Object error)? shouldRetry,
}) async {
  final random = Random();
  Object? lastError;
  StackTrace? lastStackTrace;

  for (var attempt = 1; attempt <= policy.maxAttempts; attempt++) {
    try {
      return await action();
    } catch (error, stackTrace) {
      lastError = error;
      lastStackTrace = stackTrace;

      final retryAllowed = attempt < policy.maxAttempts && (shouldRetry?.call(error) ?? true);
      if (!retryAllowed) {
        break;
      }

      final exponential = policy.baseDelay.inMilliseconds * pow(policy.backoffFactor, attempt - 1);
      final capped = min(exponential.toInt(), policy.maxDelay.inMilliseconds);
      final jitterRange = (capped * policy.jitterFactor).toInt();
      final jitter = jitterRange > 0 ? random.nextInt(jitterRange * 2 + 1) - jitterRange : 0;
      final delayMs = max(0, capped + jitter);
      await Future<void>.delayed(Duration(milliseconds: delayMs));
    }
  }

  Error.throwWithStackTrace(lastError!, lastStackTrace!);
}
