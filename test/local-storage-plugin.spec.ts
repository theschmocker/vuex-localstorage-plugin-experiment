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

  it('stores more complex objects', () => {
    const store = createSimpleTodoStore(createLocalStoragePlugin({
      todos: true,
    }));

    store.dispatch('addTodo', 'red, green, refactor');

    const expected = [{ id: 1, text: 'red, green, refactor', done: false }];
    const actual = JSON.parse(localStorage.getItem('todos')!)

    expect(actual).toEqual(expected);
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

    store.dispatch('addTodo', 'red, green, refactor');

    const expectedTodos = [{ id: 1, text: 'red, green, refactor', done: false }];
    const actualTodos = JSON.parse(localStorage.getItem('todos')!)

    expect(actualTodos).toEqual(expectedTodos);

    const expectedLastId = 1;
    const actualLastId = JSON.parse(localStorage.getItem('lastId')!);

    expect(actualLastId).toEqual(expectedLastId);
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

  it('can watch for custom mutation name', () => {
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
        color: {
          mutation: CHANGE,
        }
      })],
    });

    store.commit(CHANGE);

    const expected = store.state.color;
    const actual = JSON.parse(localStorage.getItem('color')!);

    expect(actual).toBe(expected);
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
      lastId(state, id: number) {
        state.lastId = id;
      }
    },
    actions: {
      addTodo({ state, commit }, text: string) {
        const { lastId, todos } = state;
        const nextId = lastId + 1;
        commit('lastId', nextId);
        commit('todos', [...todos, { id: nextId, text, done: false }]);
      }
    },
    plugins: [plugin]
  });
}
