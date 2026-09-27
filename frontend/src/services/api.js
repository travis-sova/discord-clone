const API_BASE = (import.meta.env?.VITE_API_URL || 'http://localhost:3000').replace(/\/$/, '');
let csrfToken = null;
let csrfRequest = null;

export class ApiError extends Error {
    constructor(message, status = 0, code = 'NETWORK_ERROR') {
        super(message);
        this.status = status;
    }
}

async function request(path, options = {}) {
    try {
        return await fetch(`${API_BASE}${path}`, { ...options, credentials: 'include' });
    } catch (error) {
        if (error.name === 'AbortError') throw error;
        throw new ApiError('Cannot reach the server. Please try again.');
    }
}

async function readResponse(response) {
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new ApiError(data?.error || 'The request failed. Please try again.', response.status, data?.code);
    }
    if (data === null) throw new ApiError('The server returned an invalid response.', 502, 'INVALID_RESPONSE');
    return data;
}

export function resetCsrfToken() {
    csrfToken = null;
}

export async function getCsrfToken(forceRefresh = false) {
    if (forceRefresh) resetCsrfToken();
    if (csrfToken) return csrfToken;
    if (!csrfRequest) {
        csrfRequest = (async () => {
            const data = await readResponse(await request('/csrf-token', { cache: 'no-store' }));
            if (typeof data.csrfToken !== 'string') throw new ApiError('Could not initialize the session.', 502);
            csrfToken = data.csrfToken;
            return csrfToken;
        })().finally(() => { csrfRequest = null; });
    }
    return csrfRequest;
}

export async function apiFetch(path, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = new Headers(options.headers);
    const unsafe = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (unsafe) headers.set('x-csrf-token', await getCsrfToken());
    let response = await request(path, { ...options, method, headers });
    // Retry only an explicit CSRF rejection, which occurs before the route runs.
    if (unsafe && response.status === 403) {
        const data = await response.clone().json().catch(() => null);
        if (data?.code === 'EBADCSRFTOKEN') {
            headers.set('x-csrf-token', await getCsrfToken(true));
            response = await request(path, { ...options, method, headers });
        }
    }
    return response;
}

export async function apiJson(path, options = {}) {
    return readResponse(await apiFetch(path, options));
}
