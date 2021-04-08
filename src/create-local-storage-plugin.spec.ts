import { createStore } from 'vuex';
import { createLocalStoragePlugin } from './create-local-storage-plugin';
import { createMockLocalStorage } from './mock-local-store';

beforeEach(() => {
  localStorage.clear();
});

describe('createLocalStoragePlugin', () => {
  it('persists string state field to localStorage', () => {
    type Store = {
      name: string;
    };

    const plugin = createLocalStoragePlugin<Store>(
      {
        name: true,
      },
    );

    const store = createStore<Store>({
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

    store.commit('name', 'Schmo');

    expect(localStorage.getItem('name')).toBe('Schmo');
  });

  it('populates state with existing value from localStorage', () => {
    type Store = {
      name: string;
    };

    localStorage.setItem('name', 'Schmo')

    const plugin = createLocalStoragePlugin<Store>(
      {
        name: true,
      },
    );

    const store = createStore<Store>({
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

    expect(store.state.name).toBe('Schmo');
  });

  it('stores non-string state field in localStorage with custom serialization', () => {
    type Store = {
      count: number
    };

    const plugin = createLocalStoragePlugin<Store>(
      {
        count: {
          serialize: (state) => state.count.toString(),
          deserialize: parseInt
        },
      },
    );

    const store = createStore<Store>({
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

    expect(localStorage.getItem('count')).toBeNull();

    store.dispatch('increment');

    expect(localStorage.getItem('count')).toBe('1')

    store.dispatch('increment');

    expect(localStorage.getItem('count')).toBe('2')
  });

  it('populates non-string state field from localStorage with custom serialization', () => {
    type Store = {
      count: number
    };

    localStorage.setItem('count', '42');

    const plugin = createLocalStoragePlugin<Store>(
      {
        count: {
          serialize: (state) => state.count.toString(),
          deserialize: parseInt
        },
      },
    );

    const store = createStore<Store>({
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

    expect(store.state.count).toBe(42);
  });
});
