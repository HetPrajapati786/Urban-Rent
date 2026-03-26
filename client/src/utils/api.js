const API_BASE = 'http://localhost:5000/api';

/**
 * Get the Clerk user ID for auth headers.
 * Returns 'demo-manager' for demo mode (no Clerk session).
 */
const getClerkUserId = () => {
    // Check for active impersonation
    const impersonatedId = localStorage.getItem('urbanrent_impersonate');
    if (impersonatedId) {
        return impersonatedId;
    }

    // Check for admin session (stored after admin login)
    if (window.location.pathname.startsWith('/admin')) {
        const adminSession = localStorage.getItem('urbanrent_admin');
        if (adminSession) {
            try {
                return JSON.parse(adminSession).clerkId;
            } catch { /* ignore */ }
        }
        return null;
    }

    // Try to get from Clerk's session (window.__clerk_frontend_api)
    try {
        const clerkUser = window.Clerk?.user;
        if (clerkUser?.id) return clerkUser.id;
    } catch {
        // Clerk not available
    }

    // Check if we're in demo mode
    if (window.location.pathname.startsWith('/demo')) {
        if (window.location.pathname.startsWith('/demo/admin')) return 'demo-admin';
        if (window.location.pathname.startsWith('/demo/tenant')) return 'demo-tenant';
        return 'demo-manager';
    }

    return null;
};

/**
 * Build common headers for API requests.
 */
const getHeaders = (isJson = true) => {
    const headers = {};
    const userId = getClerkUserId();
    if (userId) headers['x-clerk-user-id'] = userId;
    if (isJson) headers['Content-Type'] = 'application/json';
    return headers;
};

/**
 * GET request
 */
export const apiGet = async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
};

/**
 * POST request (JSON body)
 */
export const apiPost = async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
};

/**
 * POST request with FormData (for file uploads)
 */
export const apiPostForm = async (path, formData) => {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: getHeaders(false), // No Content-Type — browser sets it with boundary
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
};

/**
 * PATCH request
 */
export const apiPatch = async (path, body = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
};

/**
 * PUT request
 */
export const apiPut = async (path, body) => {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
};

/**
 * PUT request with FormData (for file uploads during edits)
 */
export const apiPutForm = async (path, formData) => {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'PUT',
        headers: getHeaders(false),
        body: formData,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
};

/**
 * DELETE request
 */
export const apiDelete = async (path) => {
    const res = await fetch(`${API_BASE}${path}`, {
        method: 'DELETE',
        headers: getHeaders(),
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
};
