import { createMockLocalStorage } from './mock-local-store';

describe('createMockLocalStorage', () => {
  it('can set and get an item', () => {
    const store = createMockLocalStorage();

    store.setItem('test', "123");

    expect(store.getItem('test')).toBe("123");
  });
  it('returns null from getItem when not set', () => {
    const store = createMockLocalStorage();
    expect(store.getItem('test')).toBeNull();
  })
})

describe('createMockLocalStorage.key', () => {
  it('returns the correct key in a simple case', () => {
    const store = createMockLocalStorage();
    store.setItem("theAnswer", "42");
    expect(store.key(0)).toBe("theAnswer");
  });

  it('returns null with negative index', () => {
    const store = createMockLocalStorage();
    store.setItem("theAnswer", "42");
    expect(store.key(-1)).toBeNull();
  });

  it('returns null with too high of an index', () => {
    const store = createMockLocalStorage();
    store.setItem("theAnswer", "42");
    expect(store.key(1)).toBeNull();
  });

  it('returns the correct key with more entries', () => {
    const store = createMockLocalStorage();

    store.setItem("theAnswer", "42");
    store.setItem("one", "42");
    store.setItem("two", "42");
    store.setItem("three", "42");
    store.setItem("four", "42");

    Object.entries({
      1: 'one',
      2: 'two',
      3: 'three',
      4: 'four',
    }).map(([index, key]) => expect(store.key(parseInt(index))).toBe(key))

  });
});

describe('createMockLocalStorage.removeItem', () => {
  it('removes an entry by key from storage', () => {
    const store = createMockLocalStorage();
    store.setItem("theAnswer", "42");
    store.removeItem('theAnswer');
    expect(store.getItem('theAnswer')).toBeNull();
  });

  it('doesn\'t throw when called with a nonexistent key', () => {
    const store = createMockLocalStorage();
    store.setItem("theAnswer", "42");
    store.removeItem('asdf');
    expect(store.getItem('theAnswer')).toBe('42');
  });
});

describe('createMockLocalStorage.clear', () => {
  it('removes all entries from storage', () => {
    const store = createMockLocalStorage();

    const keys = [...Array(20).keys()].map(i => i.toString());
    keys.forEach(k => store.setItem(k, 'test'))

    keys.forEach(k => expect(store.getItem(k)).not.toBeNull())

    store.clear();

    keys.forEach(k => expect(store.getItem(k)).toBeNull())
  });
});

describe('createMockLocalStorage.length', () => {
  it('empty store has length 0', () => {
    const store = createMockLocalStorage();
    expect(store.length).toBe(0);
  });
  it('length is correct for many items', () => {
    const store = createMockLocalStorage();

    const length = 20

    const keys = [...Array(length).keys()].map(i => i.toString());
    keys.forEach(k => store.setItem(k, 'test'))

    expect(store.length).toBe(length);
  });
});
