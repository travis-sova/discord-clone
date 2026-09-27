import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { createWebHistory, createRouter } from 'vue-router'
import { checkSession, authError, authDestination } from './services/auth.js'

import home from './views/home.vue'
import login from './views/login.vue'
import register from './views/register.vue'
import terms from './views/terms.vue'
import privacy from './views/privacy.vue'
import main from './views/main.vue'

const routes = [
    { path: '/', component: home },
    { path: '/login', component: login },
    { path: '/register', component: register },
    { path: '/app', redirect: '/channels/@me' },
    { path: '/terms', component: terms },
    { path: '/privacy', component: privacy },
    { path: '/channels/@me/:channelId?', name: 'dm', component: main, meta: { requiresAuth: true } },
    { path: '/channels/:serverId', name: 'server', component: main, meta: { requiresAuth: true } },
    { path: '/channels/:serverId/:channelId', name: 'channel', component: main, meta: { requiresAuth: true } },
]

export const router = createRouter({
    history: createWebHistory(),
    routes,
})

router.beforeEach(async (to) => {
    authError.value = '';
    if (!to.meta.requiresAuth) return true;
    try {
        if (await checkSession()) return true;
        return { path: '/login', query: { redirect: to.fullPath } };
    } catch (error) {
        authError.value = error.message;
        authDestination.value = to.fullPath;
        return false;
    }
});

createApp(App).use(router).mount('#app')