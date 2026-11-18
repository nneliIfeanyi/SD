/**
 * Settings Module Script
 */

import { GET, PUT, showToast, withButtonLoading } from './api.js?v=4';

document.addEventListener('DOMContentLoaded', () => {
    loadOrganization();
    document.getElementById('orgForm')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const button = event.submitter || form.querySelector('[type="submit"]');
        withButtonLoading(button, () => saveOrganization(event), 'Saving...');
    });
});

async function loadOrganization() {
    const form = document.getElementById('orgForm');
    const fields = form?.querySelectorAll('input, select, textarea, button');
    form?.classList.add('form-skeleton');
    form?.setAttribute('aria-busy', 'true');
    fields?.forEach((field) => { field.disabled = true; });
    try {
        const res = await GET('/settings/organization.php');
        const o = res.data || {};
        document.getElementById('orgName').value = o.name || '';
        document.getElementById('orgAddress').value = o.address || '';
        document.getElementById('orgPhone').value = o.phone || '';
        document.getElementById('orgEmail').value = o.email || '';
        document.getElementById('orgWebsite').value = o.website || '';
        document.getElementById('orgTheme').value = o.theme || 'light';
    } catch (err) {
        showToast(err.message || 'Failed to load settings', 'error');
    } finally {
        form?.classList.remove('form-skeleton');
        form?.removeAttribute('aria-busy');
        fields?.forEach((field) => { field.disabled = false; });
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
        await PUT('/settings/organization.php', payload);
        showToast('Settings saved successfully');
    } catch (err) {
        showToast(err.message || 'Failed to save', 'error');
    }
}
