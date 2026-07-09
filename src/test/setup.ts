// jsdom's bundled localStorage is a partial stub in this version — replace it with a
// full in-memory Storage so the txHistory tests exercise the real code path.
class MemStorage {
  private m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.has(k) ? (this.m.get(k) as string) : null; }
  key(i: number) { return Array.from(this.m.keys())[i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, String(v)); }
}

Object.defineProperty(globalThis, "localStorage", {
  value: new MemStorage(),
  writable: true,
  configurable: true,
});
