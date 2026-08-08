/**
 * Reusable API Module
 * Handles all HTTP requests with authentication & error handling
 */

const BASE = window.APP_URL || '';

/**
 * Show Bootstrap toast notification
 */
export function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const id = 'toast-' + Date.now();
    const bg = {
        success: 'text-bg-success',
        error: 'text-bg-danger',
        warning: 'text-bg-warning',
        info: 'text-bg-info'
    }[type] || 'text-bg-primary';

    const html = `
        <div id="${id}" class="toast align-items-center ${bg} border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    container.insertAdjacentHTML('beforeend', html);
    const el = document.getElementById(id);
    const toast = new bootstrap.Toast(el, { delay: 4000 });
    toast.show();
    el.addEventListener('hidden.bs.toast', () => el.remove());
}

/**
 * Core request helper
 */
async function request(method, endpoint, data = null, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${BASE}${endpoint}`;

    const config = {
        method,
        credentials: 'same-origin',
        headers: {
            'Accept': 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(options.headers || {})
        }
    };

    if (data && method !== 'GET') {
        if (data instanceof FormData) {
            config.body = data;
            // Let browser set Content-Type with boundary
        } else {
            config.headers['Content-Type'] = 'application/json';
            config.body = JSON.stringify(data);
        }
    }

    try {
        const res = await fetch(url, config);
        const json = await res.json().catch(() => ({}));

        if (res.status === 401) {
            window.location.href = `${BASE}/pages/login.php`;
            throw new Error('Unauthorized');
        }

        if (!res.ok || json.success === false) {
            const msg = json.message || `Request failed (${res.status})`;
            throw new Error(msg);
        }

        return json;
    } catch (err) {
        if (err.message !== 'Unauthorized') {
            console.error('API Error:', err);
        }
        throw err;
    }
}

export const GET  = (url, opts) => request('GET', url, null, opts);
export const POST = (url, data, opts) => request('POST', url, data, opts);
export const PUT  = (url, data, opts) => request('PUT', url, data, opts);
export const DEL  = (url, opts) => request('DELETE', url, null, opts);

/**
 * Auth helpers
 */
export async function login(username, password) {
    return POST('/api/auth/login.php', { username, password });
}

export async function logout() {
    return POST('/api/auth/logout.php', {});
}

export async function me() {
    return GET('/api/auth/me.php');
}

/**
 * Format date for display
 */
export function formatDate(dateStr, withTime = false) {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const opts = { year: 'numeric', month: 'short', day: 'numeric' };
    if (withTime) {
        opts.hour = '2-digit';
        opts.minute = '2-digit';
    }
    return d.toLocaleDateString('en-GB', opts);
}

/**
 * Status badge HTML
 */
export function statusBadge(status) {
    const map = {
        open: 'success',
        draft: 'secondary',
        closed: 'warning',
        archived: 'dark',
        confirmed: 'success',
        pending: 'warning',
        cancelled: 'danger'
    };
    const color = map[status] || 'secondary';
    return `<span class="badge text-bg-${color} badge-status">${status}</span>`;
}

/**
 * Debounce helper
 */
export function debounce(fn, delay = 300) {
    let timer;
    return (...args) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delay);
    };
}

/**
 * Confirm dialog
 */
export function confirmAction(message = 'Are you sure?') {
    return window.confirm(message);
}

/**
 * Export table data to CSV
 */
export function exportToCSV(rows, filename = 'export.csv') {
    if (!rows || !rows.length) return;
    const headers = Object.keys(rows[0]);
    const csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => {
            const val = r[h] ?? '';
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}
