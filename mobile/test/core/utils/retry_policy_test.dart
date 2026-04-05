import 'package:flutter_test/flutter_test.dart';

import 'package:cloudtune/core/utils/retry_policy.dart';

void main() {
  test('runWithRetry retries until success', () async {
    var attempts = 0;

    final value = await runWithRetry<int>(
      () async {
        attempts += 1;
        if (attempts < 3) {
          throw StateError('temporary');
        }
        return 42;
      },
      policy: const RetryPolicy(
        maxAttempts: 3,
        baseDelay: Duration(milliseconds: 1),
        maxDelay: Duration(milliseconds: 2),
        jitterFactor: 0,
      ),
    );

    expect(value, 42);
    expect(attempts, 3);
  });

  test('runWithRetry honors shouldRetry gate', () async {
    var attempts = 0;

    await expectLater(
      () => runWithRetry<void>(
        () async {
          attempts += 1;
          throw ArgumentError('do not retry');
        },
        policy: const RetryPolicy(
          maxAttempts: 5,
          baseDelay: Duration(milliseconds: 1),
          maxDelay: Duration(milliseconds: 2),
          jitterFactor: 0,
        ),
        shouldRetry: (error) => error is! ArgumentError,
      ),
      throwsA(isA<ArgumentError>()),
    );

    expect(attempts, 1);
  });
}
