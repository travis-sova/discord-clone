import { createApp } from 'vue'
import './style.css'
import App from './App.vue'

import { createWebHistory, createRouter } from 'vue-router'

import home from './views/home.vue'
import login from './views/login.vue'

const routes = [
  { path: '/', component: home },
  { path: '/login', component: login },
]

export const router = createRouter({
  history: createWebHistory(),
  routes,
})

createApp(App).use(router).mount('#app')
