import 'package:flutter_test/flutter_test.dart';

import 'package:cloudtune/core/utils/ttl_cache.dart';

void main() {
  test('returns value before ttl expiry', () {
    var now = DateTime(2026, 1, 1, 0, 0, 0);
    final cache = TtlCache<String>(
      ttl: const Duration(seconds: 10),
      now: () => now,
    );

    cache.set('k', 'v');
    now = now.add(const Duration(seconds: 9));

    expect(cache.get('k'), 'v');
  });

  test('evicts value after ttl expiry', () {
    var now = DateTime(2026, 1, 1, 0, 0, 0);
    final cache = TtlCache<String>(
      ttl: const Duration(seconds: 10),
      now: () => now,
    );

    cache.set('k', 'v');
    now = now.add(const Duration(seconds: 11));

    expect(cache.get('k'), isNull);
  });
}
