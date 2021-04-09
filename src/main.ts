import { createApp } from 'vue'
import { createStore } from 'vuex';
import { createLocalStoragePlugin } from './local-storage-plugin'

import App from './App.vue'

interface State {
  count: number;
}

const store = createStore<State>({
  state() {
    return { count: 0 }
  },

  mutations: {
    count(state, newCount: number) {
      state.count = newCount;
    }
  },

  actions: {
    increment({ commit, state }) {
      commit('count', state.count + 1);
    },
    decrement({ commit, state }) {
      commit('count', state.count - 1);
    }
  },

  plugins: [createLocalStoragePlugin<State>({
    count: true,
  })]
});

const app = createApp(App);

app.use(store);

app.mount('#app');
