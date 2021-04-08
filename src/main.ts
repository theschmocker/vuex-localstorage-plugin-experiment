import { createApp } from 'vue'
import { createStore } from 'vuex';
import App from './App.vue'

const store = createStore<{count: number}>({
  state() {
    return { count: 1 }
  },

  mutations: {
    increment(state) {
      state.count++;
    }
  }
});

const app = createApp(App);

app.use(store);

app.mount('#app');
