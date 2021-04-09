import { createStore, Plugin, Store } from 'vuex';
import { createLocalStoragePlugin } from '../src/local-storage-plugin';

beforeEach(() => {
  localStorage.clear();
});

describe('createLocalStoragePlugin', () => {
  it('persists string state field to localStorage', () => {
    const store = createSimpleNameStore(
      createLocalStoragePlugin<NameStoreState>({
        name: true,
      })
    );

    store.commit('name', 'Schmo');

    expect(localStorage.getItem('name')).toBe('"Schmo"');
  });

  it('populates state with existing value from localStorage', () => {
    localStorage.setItem('name', '"Schmo"')

    const store = createSimpleNameStore(
      createLocalStoragePlugin<NameStoreState>({
        name: true,
      })
    );

    expect(store.state.name).toBe('Schmo');
  });

  it('stores numeric state field in localStorage with custom serialization', () => {
    const store = createSimpleCountStore(
      createLocalStoragePlugin<CountStoreState>({
        count: {
          serialize: (state) => state.count.toString(),
          deserialize: parseInt
        },
      })
    );

    expect(localStorage.getItem('count')).toBeNull();

    store.dispatch('increment');

    expect(localStorage.getItem('count')).toBe('1')

    store.dispatch('increment');

    expect(localStorage.getItem('count')).toBe('2')
  });

  it('populates numeric state field from localStorage with custom serialization', () => {
    localStorage.setItem('count', '42');

    const store = createSimpleCountStore(
      createLocalStoragePlugin<CountStoreState>({
        count: {
          serialize: (state) => state.count.toString(),
          deserialize: parseInt
        },
      })
    );

    expect(store.state.count).toBe(42);
  });

  it('stores numeric state field in localStorage with default serialization', () => {
    const store = createSimpleCountStore(
      createLocalStoragePlugin<CountStoreState>({
        count: true,
      })
    );

    store.dispatch('increment');

    expect(localStorage.getItem('count')).toBe('1');
  });

  it('populates numeric state field from localStorage with default serialization', () => {
    localStorage.setItem('count', '41')
    const store = createSimpleCountStore(
      createLocalStoragePlugin<CountStoreState>({
        count: true,
      })
    );

    store.dispatch('increment');

    expect(localStorage.getItem('count')).toBe('42');
  });
});

// Begone, boilerplate

interface NameStoreState {
  name: string;
}
function createSimpleNameStore(plugin: Plugin<NameStoreState>): Store<NameStoreState> {
  return createStore<NameStoreState>({
    state() {
      return {
        name: "",
      }
    },
    mutations: {
      name(state, newName: string) {
        state.name = newName;
      }
    },
    plugins: [plugin]
  });
}

interface CountStoreState {
  count: number
};
function createSimpleCountStore(plugin: Plugin<CountStoreState>): Store<CountStoreState> {
  return createStore<CountStoreState>({
    state() {
      return {
        count: 0,
      }
    },
    mutations: {
      count(state, newCount: number) {
        state.count = newCount;
      }
    },
    actions: {
      increment({ state, commit }) {
        commit('count', state.count + 1);
      }
    },
    plugins: [plugin]
  });
}

