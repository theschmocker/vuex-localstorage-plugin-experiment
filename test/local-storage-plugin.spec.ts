import { createStore, Plugin, Store } from 'vuex';
import { createLocalStoragePlugin } from '../src/local-storage-plugin';
import { createMockLocalStorage } from '../src/mock-local-store';

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

    expectItemInLocalStorage('name', '"Schmo"');
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

  it('can use a custom storage implementation', () => {
    const customStorage = createMockLocalStorage();

    const store = createSimpleNameStore(
      createLocalStoragePlugin<NameStoreState>({
        name: true,
      }, {
        storageImplementation: customStorage,
      })
    );

    store.commit('name', 'Schmo');

    expect(customStorage.getItem('name')).toBe('"Schmo"');
    expectItemNotToBeInLocalStorage('name')
  });

  it('stores numeric state field in localStorage with custom serialization', () => {
    const store = createSimpleCountStore(
      createLocalStoragePlugin<CountStoreState>({
        count: {
          serialize: (count) => count.toString(),
          deserialize: parseInt
        },
      })
    );

    expectItemNotToBeInLocalStorage('count');

    store.dispatch('increment');

    expectItemInLocalStorage('count', '1');

    store.dispatch('increment');

    expectItemInLocalStorage('count', '2');
  });

  it('populates numeric state field from localStorage with custom serialization', () => {
    localStorage.setItem('count', '42');

    const store = createSimpleCountStore(
      createLocalStoragePlugin<CountStoreState>({
        count: {
          serialize: (count) => count.toString(),
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

    expectItemInLocalStorage('count', '1');
  });

  it('populates numeric state field from localStorage with default serialization', () => {
    localStorage.setItem('count', '41')
    const store = createSimpleCountStore(
      createLocalStoragePlugin<CountStoreState>({
        count: true,
      })
    );

    store.dispatch('increment');

    expectItemInLocalStorage('count', '42');
  });

  it('stores more complex objects', () => {
    const store = createSimpleTodoStore(createLocalStoragePlugin({
      todos: true,
    }));

    store.commit('addTodo', 'red, green, refactor');

    const expected = [{ id: 1, text: 'red, green, refactor', done: false }];

    expectItemInLocalStorage('todos', expected, JSON.parse);
  });

  it('populates more complex objects', () => {
    const expected = [{ id: 1, text: 'red, green, refactor', done: false }];

    localStorage.setItem('todos', JSON.stringify(expected));

    const store = createSimpleTodoStore(createLocalStoragePlugin({
      todos: true,
    }));

    const actual = store.state.todos;

    expect(actual).toEqual(expected);
  });

  it('stores multiple state fields', () => {
    const store = createSimpleTodoStore(createLocalStoragePlugin({
      todos: true,
      lastId: true,
    }));

    store.commit('addTodo', 'red, green, refactor');

    expectItemInLocalStorage(
      'todos',
      [{ id: 1, text: 'red, green, refactor', done: false }],
      JSON.parse
    );

    expectItemInLocalStorage('lastId', 1, JSON.parse);
  });

  it('populates multiple state fields', () => {
    const expectedTodos = [{ id: 1, text: 'red, green, refactor', done: false }];
    const expectedLastId = 1;

    localStorage.setItem('todos', JSON.stringify(expectedTodos));
    localStorage.setItem('lastId', JSON.stringify(expectedLastId));

    const store = createSimpleTodoStore(createLocalStoragePlugin({
      todos: true,
      lastId: true,
    }));

    const actualTodos = store.state.todos;
    const actualLastId = store.state.lastId;

    expect(actualTodos).toEqual(expectedTodos);
    expect(actualLastId).toEqual(expectedLastId);
  });

  it('correctly persists value when mutation name does not match state name', () => {
    interface StopLightState {
      color: 'green' | 'yellow' | 'red';
    }

    const CHANGE = 'CHANGE';
    const store = createStore<StopLightState>({
      state() {
        return {
          color: 'green',
        };
      },
      mutations: {
        [CHANGE](state) {
          const { color } = state;

          let nextColor: StopLightState['color'];
          if (color === 'green') {
            nextColor = 'yellow';
          } else if (color === 'yellow') {
            nextColor = 'red';
          } else {
            nextColor = 'green';
          }

          state.color = nextColor;
        },
      },
      plugins: [createLocalStoragePlugin({
        color: true,
      })],
    });

    store.commit(CHANGE);

    expectItemInLocalStorage('color', store.state.color, JSON.parse)
  });

  it('persists deep changes to an object', () => {
    const store = createSimpleTodoStore(createLocalStoragePlugin({
      todos: true,
    }));

    store.commit('addTodo', 'red, green, refactor');

    expectItemInLocalStorage(
      'todos',
      [{ id: 1, text: 'red, green, refactor', done: false }],
      JSON.parse
    )

    store.commit('toggleDone', 1);

    expectItemInLocalStorage(
      'todos',
      [{ id: 1, text: 'red, green, refactor', done: true }],
      JSON.parse
    )
  });

  it('persists and populates a field using a custom key prefix', () => {
    const prefix = 'TEST-';
    const countStorageKey = `${prefix}count`;
    localStorage.setItem(countStorageKey, '41')
    const store = createSimpleCountStore(
      createLocalStoragePlugin<CountStoreState>({
        count: true,
      }, {
        keyPrefix: prefix,
      })
    );

    expect(store.state.count).toBe(41);

    store.dispatch('increment');

    expectItemInLocalStorage(countStorageKey, '42');
    expectItemNotToBeInLocalStorage('count');
  })
});

// Test Helpers

function expectItemInLocalStorage(key: string, item: any, deserializer: (s: string) => any = (s: string) => s) {
  const serializedValue = localStorage.getItem(key);
  expect(serializedValue).not.toBeNull();
  if (serializedValue !== null) {
    expect(deserializer(serializedValue)).toEqual(item);
  }
}

function expectItemNotToBeInLocalStorage(key: string) {
  expect(localStorage.getItem(key)).toBeNull();
}

// Store Creators

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

interface Todo {
  id: number;
  text: string;
  done: boolean;
}
interface TodoStoreState {
  lastId: number;
  todos: Todo[];
}
function createSimpleTodoStore(plugin: Plugin<TodoStoreState>): Store<TodoStoreState> {
  return createStore<TodoStoreState>({
    state() {
      return {
        lastId: 0,
        todos: [],
      }
    },
    mutations: {
      todos(state, newTodos: Todo[]) {
        state.todos = newTodos;
      },
      addTodo(state, text: string) {
        const { lastId, todos } = state;
        const nextId = lastId + 1;
        state.lastId = nextId;
        todos.push({ id: nextId, text, done: false });
      },
      toggleDone(state, id: number) {
        const todo = state.todos.find(todo => todo.id === id);
        if (todo) {
          todo.done = !todo.done;
        }
      },
      lastId(state, id: number) {
        state.lastId = id;
      }
    },
    actions: {
    },
    plugins: [plugin]
  });
}
