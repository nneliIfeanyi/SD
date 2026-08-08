/**
 * Settings Module Script
 */

import { GET, PUT, showToast } from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    loadOrganization();
    document.getElementById('orgForm')?.addEventListener('submit', saveOrganization);
});

async function loadOrganization() {
    try {
        const res = await GET('/api/settings/organization.php');
        const o = res.data || {};
        document.getElementById('orgName').value = o.name || '';
        document.getElementById('orgAddress').value = o.address || '';
        document.getElementById('orgPhone').value = o.phone || '';
        document.getElementById('orgEmail').value = o.email || '';
        document.getElementById('orgWebsite').value = o.website || '';
        document.getElementById('orgTheme').value = o.theme || 'light';
    } catch (err) {
        showToast('Failed to load settings', 'error');
    }
}

async function saveOrganization(e) {
    e.preventDefault();
    const payload = {
        name: document.getElementById('orgName').value.trim(),
        address: document.getElementById('orgAddress').value.trim(),
        phone: document.getElementById('orgPhone').value.trim(),
        email: document.getElementById('orgEmail').value.trim(),
        website: document.getElementById('orgWebsite').value.trim(),
        theme: document.getElementById('orgTheme').value
    };

    try {
        await PUT('/api/settings/organization.php', payload);
        showToast('Settings saved successfully');
    } catch (err) {
        showToast(err.message || 'Failed to save', 'error');
    }
}
