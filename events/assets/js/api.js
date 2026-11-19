/**
 * Reusable API Module
 * Handles all HTTP requests with authentication & error handling
 */

import { OfflineError, showOfflineState } from './offline-state.js?v=1';
export { OfflineError };

const API_ORIGIN = (window.APP_API_URL || '').replace(/\/+$/, '');
export const APP_BASE_URL = new URL('../../', import.meta.url);

export function renderTableSkeleton(tbody, columns, rows = 5) {
    if (!tbody) return;

    tbody.innerHTML = Array.from({ length: rows }, () => `
        <tr class="skeleton-row" aria-hidden="true">
            ${Array.from({ length: columns }, (_, index) => `
                <td><span class="skeleton-line ${index === 0 ? 'skeleton-line-wide' : ''}"></span></td>
            `).join('')}
        </tr>
    `).join('');
}

export function renderTableMessage(tbody, columns, message) {
    if (!tbody) return;
    tbody.innerHTML = `<tr><td colspan="${columns}" class="text-center text-muted py-4">${message}</td></tr>`;
}

export function setChartLoading(canvas, loading) {
    if (!canvas?.parentElement) return;

    const parent = canvas.parentElement;
    const existing = parent.querySelector('.chart-skeleton');
    if (loading && !existing) {
        const skeleton = document.createElement('div');
        skeleton.className = 'chart-skeleton';
        skeleton.setAttribute('role', 'status');
        skeleton.setAttribute('aria-label', 'Loading chart data');
        skeleton.innerHTML = '<span></span><span></span><span></span><span></span><span></span>';
        parent.classList.add('chart-loading-container');
        parent.insertBefore(skeleton, canvas);
        canvas.classList.add('invisible');
    } else if (!loading) {
        existing?.remove();
        parent.classList.remove('chart-loading-container');
        canvas.classList.remove('invisible');
    }
}

export async function withButtonLoading(button, action, label = 'Loading...') {
    if (!button) return action();

    const originalContent = button.innerHTML;
    button.disabled = true;
    button.setAttribute('aria-busy', 'true');
    button.innerHTML = `<span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>${label}`;

    try {
        return await action();
    } finally {
        button.disabled = false;
        button.removeAttribute('aria-busy');
        button.innerHTML = originalContent;
    }
}

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
    const url = endpoint.startsWith('http') ? endpoint : `${API_ORIGIN}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

    const config = {
        method,
        credentials: 'include',
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
        if (navigator.onLine === false) {
            showOfflineState();
            throw new OfflineError();
        }

        const res = await fetch(url, config);

        if (res.status === 401) {
            if (window.location.pathname !== APP_BASE_URL.pathname && !window.location.pathname.endsWith('/index.html')) {
                window.location.replace(APP_BASE_URL.href);
            }
            throw new Error('Unauthorized');
        }

        let json;
        try {
            json = await res.json();
        } catch (error) {
            throw new Error(`Invalid API response (${res.status})`);
        }
        if (!json || typeof json !== 'object' || Array.isArray(json)) {
            throw new Error(`Invalid API response (${res.status})`);
        }

        if (!res.ok || json.success === false) {
            const msg = json.message || `Request failed (${res.status})`;
            throw new Error(msg);
        }

        return json;
    } catch (err) {
        if (err instanceof OfflineError) throw err;
        if (err instanceof TypeError || navigator.onLine === false) {
            showOfflineState();
            throw new OfflineError();
        }
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
    return POST('/auth/login.php', { username, password });
}

export async function logout() {
    return POST('/auth/logout.php', {});
}

export async function me() {
    return GET('/auth/me.php');
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

let confirmationActive = false;

export function confirmAction(message = 'Are you sure?', confirmLabel = 'Confirm') {
    if (!window.bootstrap?.Modal) {
        return Promise.reject(new Error('Bootstrap modal support is unavailable.'));
    }
    if (confirmationActive) return Promise.resolve(false);

    let modalElement = document.getElementById('appConfirmModal');
    if (!modalElement) {
        modalElement = document.createElement('div');
        modalElement.id = 'appConfirmModal';
        modalElement.className = 'modal fade';
        modalElement.tabIndex = -1;
        modalElement.setAttribute('aria-labelledby', 'appConfirmModalLabel');
        modalElement.setAttribute('aria-hidden', 'true');
        modalElement.innerHTML = `
            <div class="modal-dialog modal-dialog-centered">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="appConfirmModalLabel">Please confirm</h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body" id="appConfirmMessage"></div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
                        <button type="button" class="btn btn-danger" id="appConfirmButton"></button>
                    </div>
                </div>
            </div>`;
        document.body.append(modalElement);
    }

    const messageElement = modalElement.querySelector('#appConfirmMessage');
    const confirmButton = modalElement.querySelector('#appConfirmButton');
    messageElement.textContent = message;
    confirmButton.textContent = confirmLabel;

    const modal = window.bootstrap.Modal.getOrCreateInstance(modalElement);
    confirmationActive = true;
    return new Promise((resolve) => {
        let confirmed = false;
        confirmButton.onclick = () => {
            confirmed = true;
            modal.hide();
        };
        modalElement.addEventListener('hidden.bs.modal', () => {
            confirmButton.onclick = null;
            confirmationActive = false;
            resolve(confirmed);
        }, { once: true });
        modal.show();
    });
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
