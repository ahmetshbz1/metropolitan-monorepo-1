// "redis.mock.ts"
// Mock Redis implementation for testing

export class MockRedis {
  private store = new Map<string, string>();
  private locks = new Map<string, {userId: string, expiry: number}>();

  // Simulate Redis commands
  async set(key: string, value: string, ...args: any[]): Promise<string | null> {
    // Handle SET with PX (milliseconds) and NX (if not exists)
    if (args.includes('NX')) {
      if (this.store.has(key) || this.isLocked(key)) {
        return null; // Key exists or locked, NX fails
      }
    }
    
    const pxIndex = args.indexOf('PX');
    if (pxIndex !== -1 && args[pxIndex + 1]) {
      const expiry = Date.now() + parseInt(args[pxIndex + 1]);
      this.locks.set(key, { userId: value, expiry });
    }
    
    this.store.set(key, value);
    return 'OK';
  }

  async get(key: string): Promise<string | null> {
    // Check if lock expired
    const lock = this.locks.get(key);
    if (lock && Date.now() > lock.expiry) {
      this.locks.delete(key);
      this.store.delete(key);
      return null;
    }
    
    return this.store.get(key) || null;
  }

  async del(key: string): Promise<number> {
    const deleted = this.store.delete(key) ? 1 : 0;
    this.locks.delete(key);
    return deleted;
  }

  async decrby(key: string, amount: number): Promise<number> {
    const current = parseInt(this.store.get(key) || '0');
    const newValue = Math.max(0, current - amount); // Don't go below 0
    this.store.set(key, newValue.toString());
    return newValue;
  }

  async incrby(key: string, amount: number): Promise<number> {
    const current = parseInt(this.store.get(key) || '0');
    const newValue = current + amount;
    this.store.set(key, newValue.toString());
    return newValue;
  }

  async setex(key: string, seconds: number, value: string): Promise<string> {
    this.store.set(key, value);
    // In real Redis, this would expire after seconds
    return 'OK';
  }

  async mget(...keys: string[]): Promise<(string | null)[]> {
    return keys.map(key => this.store.get(key) || null);
  }

  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.store.keys()).filter(key => regex.test(key));
  }

  private isLocked(key: string): boolean {
    const lock = this.locks.get(key);
    if (!lock) return false;
    
    if (Date.now() > lock.expiry) {
      this.locks.delete(key);
      return false;
    }
    
    return true;
  }

  // Test utilities
  clear(): void {
    this.store.clear();
    this.locks.clear();
  }

  getStoreSize(): number {
    return this.store.size;
  }

  getStore(): Map<string, string> {
    return new Map(this.store);
  }
}