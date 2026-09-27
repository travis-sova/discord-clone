import { ref } from 'vue';
import { apiJson, resetCsrfToken } from './api.js';

export const currentUser = ref(null);

export const authError = ref('');
export const authDestination = ref('');

export async function checkSession() {
    try {
        const data = await apiJson('/me', { cache: 'no-store' });
        currentUser.value = data.user;
        return data.user;
    } catch (error) {
        if (error.status === 401) {
            currentUser.value = null;
            return null;
        }
        throw error;
    }
}

export async function login(name, pass) {
    const data = await apiJson('/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pass })
    });
    currentUser.value = data.user;
    resetCsrfToken();
    return data;
}

export function register(name, pass) {
    return apiJson('/register', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, pass })
    });
}

export async function logout() {
    await apiJson('/logout', { method: 'POST' });;
    currentUser.value = null;
    resetCsrfToken();
}
