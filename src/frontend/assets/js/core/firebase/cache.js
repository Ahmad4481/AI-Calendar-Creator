class TimedCache {
  constructor(ttl = 60000) {
    this.ttl = ttl;
    this.store = new Map();
    this.pending = new Map();
  }

  now() {
    return Date.now();
  }

  get(key) {
    const entry = this.store.get(key);
    if (!entry) return null;

    if (this.now() - entry.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }

    return entry.value;
  }

  set(key, value) {
    this.store.set(key, { value, timestamp: this.now() });
    return value;
  }

  delete(key) {
    this.store.delete(key);
    this.pending.delete(key);
  }

  clear() {
    this.store.clear();
    this.pending.clear();
  }

  async remember(key, loader) {
    const cached = this.get(key);
    if (cached !== null && cached !== undefined) {
      return cached;
    }

    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    const promise = Promise.resolve()
      .then(loader)
      .then((result) => {
        this.set(key, result);
        this.pending.delete(key);
        return result;
      })
      .catch((error) => {
        this.pending.delete(key);
        throw error;
      });

    this.pending.set(key, promise);
    return promise;
  }
}

export default TimedCache;

