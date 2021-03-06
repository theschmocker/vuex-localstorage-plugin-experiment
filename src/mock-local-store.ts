// I wrote this without realizing that jest (or some dep) implements localStorage.
// don't really need, but I'll keep it around for now
export function createMockLocalStorage(): Storage {
  let store: Record<string, string> = {};

  return {
    key(index: number): string | null {
      return Object.keys(store)[index] ?? null;
    },
    getItem(key: string): string | null {
      return store[key] ?? null;
    },
    setItem(key: string, value: string): void {
      store[key] = value;
    },
    removeItem(key: string): void {
      delete store[key];
    },
    clear(): void {
      store = {};
    },
    get length(): number {
      return Object.keys(store).length;
    },
  }
}
