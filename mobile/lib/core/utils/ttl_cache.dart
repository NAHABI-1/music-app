class TtlCache<T> {
  TtlCache({
    required this.ttl,
    DateTime Function()? now,
  }) : _now = now ?? DateTime.now;

  final Duration ttl;
  final DateTime Function() _now;

  final Map<String, _CacheEntry<T>> _entries = <String, _CacheEntry<T>>{};

  T? get(String key) {
    final entry = _entries[key];
    if (entry == null) {
      return null;
    }
    if (_now().isAfter(entry.expiresAt)) {
      _entries.remove(key);
      return null;
    }
    return entry.value;
  }

  void set(String key, T value) {
    _entries[key] = _CacheEntry<T>(
      value: value,
      expiresAt: _now().add(ttl),
    );
  }

  void invalidate(String key) {
    _entries.remove(key);
  }

  void clear() {
    _entries.clear();
  }
}

class _CacheEntry<T> {
  const _CacheEntry({
    required this.value,
    required this.expiresAt,
  });

  final T value;
  final DateTime expiresAt;
}
