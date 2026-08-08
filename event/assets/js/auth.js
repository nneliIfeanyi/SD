/**
 * Login Page Script
 */

import { login, showToast } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const btn = document.getElementById('loginBtn');
    const spinner = document.getElementById('loginSpinner');

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();

        const username = document.getElementById('username').value.trim();
        const password = document.getElementById('password').value;

        if (!username || !password) {
            showToast('Please enter username and password', 'warning');
            return;
        }

        btn.disabled = true;
        spinner?.classList.remove('d-none');

        try {
            const res = await login(username, password);
            showToast(res.message || 'Login successful', 'success');
            setTimeout(() => {
                window.location.href = (window.APP_URL || '') + '/pages/dashboard.php';
            }, 600);
        } catch (err) {
            showToast(err.message || 'Login failed', 'error');
            btn.disabled = false;
            spinner?.classList.add('d-none');
        }
    });
});
