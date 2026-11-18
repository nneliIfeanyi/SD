/**
 * Settings Module Script
 */

import {
    GET, POST, PUT, DEL, formatDate, showToast, confirmAction,
    renderTableMessage, renderTableSkeleton, withButtonLoading
} from './api.js?v=5';

let users = [];
let roles = [];

document.addEventListener('DOMContentLoaded', () => {
    loadOrganization();
    loadUsers();

    document.getElementById('orgForm')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const button = event.submitter || form.querySelector('[type="submit"]');
        withButtonLoading(button, () => saveOrganization(event), 'Saving...');
    });

    document.getElementById('btnAddUser')?.addEventListener('click', () => openUserModal());
    document.getElementById('userForm')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const button = event.submitter || form.querySelector('[type="submit"]');
        withButtonLoading(button, () => saveUser(event), 'Saving...');
    });

    document.getElementById('usersTableBody')?.addEventListener('click', handleUserAction);
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

async function loadUsers() {
    const usersBody = document.getElementById('usersTableBody');
    const rolesBody = document.getElementById('rolesTableBody');
    renderTableSkeleton(usersBody, 7);
    renderTableSkeleton(rolesBody, 2, 4);

    try {
        const res = await GET('/users/index.php');
        users = res.data?.users || [];
        roles = res.data?.roles || [];
        renderUsers(usersBody);
        renderRoles(rolesBody);
    } catch (err) {
        renderTableMessage(usersBody, 7, 'Failed to load users');
        renderTableMessage(rolesBody, 2, 'Failed to load roles');
        showToast(err.message || 'Failed to load users', 'error');
    }
}

function renderUsers(tbody) {
    if (!tbody) return;
    if (!users.length) {
        renderTableMessage(tbody, 7, 'No users found');
        return;
    }

    const rows = users.map((user) => {
        const row = document.createElement('tr');
        const name = document.createElement('td');
        const nameText = document.createElement('div');
        nameText.className = 'fw-semibold';
        nameText.textContent = user.full_name;
        name.append(nameText);
        if (user.phone) {
            const phone = document.createElement('small');
            phone.className = 'text-muted';
            phone.textContent = user.phone;
            name.append(phone);
        }
        row.append(name);
        appendCell(row, user.username);
        appendCell(row, user.email);
        appendCell(row, user.role_name);

        const statusCell = document.createElement('td');
        const badge = document.createElement('span');
        badge.className = `badge text-bg-${Number(user.is_active) === 1 ? 'success' : 'secondary'}`;
        badge.textContent = Number(user.is_active) === 1 ? 'Active' : 'Inactive';
        statusCell.append(badge);
        row.append(statusCell);

        appendCell(row, user.last_login ? formatDate(user.last_login, true) : 'Never');

        const actions = document.createElement('td');
        const group = document.createElement('div');
        group.className = 'btn-group btn-group-sm';
        group.append(
            createActionButton('edit', user.id, 'btn-outline-primary', 'bi-pencil', 'Edit user'),
            createActionButton('delete', user.id, 'btn-outline-danger', 'bi-trash', 'Delete user')
        );
        actions.append(group);
        row.append(actions);
        return row;
    });
    tbody.replaceChildren(...rows);
}

function renderRoles(tbody) {
    if (!tbody) return;
    const rows = roles.map((role) => {
        const row = document.createElement('tr');
        appendCell(row, role.name);
        appendCell(row, role.description || '—');
        return row;
    });
    if (!rows.length) {
        renderTableMessage(tbody, 2, 'No roles configured');
        return;
    }
    tbody.replaceChildren(...rows);
}

function appendCell(row, value) {
    const cell = document.createElement('td');
    cell.textContent = value ?? '—';
    row.append(cell);
}

function createActionButton(action, id, style, icon, label) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn ${style}`;
    button.dataset.userAction = action;
    button.dataset.userId = id;
    button.title = label;
    button.setAttribute('aria-label', label);
    button.innerHTML = `<i class="bi ${icon}" aria-hidden="true"></i>`;
    return button;
}

function setRoleOptions(selectedRoleId = '') {
    const select = document.getElementById('userRole');
    if (!select) return;
    select.replaceChildren();
    roles.forEach((role) => {
        const option = document.createElement('option');
        option.value = role.id;
        option.textContent = role.name;
        select.append(option);
    });
    select.value = String(selectedRoleId || roles[0]?.id || '');
}

function openUserModal(user = null) {
    const form = document.getElementById('userForm');
    form.reset();
    const editing = Boolean(user);
    document.getElementById('userModalTitle').textContent = editing ? 'Edit User' : 'Add User';
    document.getElementById('userId').value = editing ? user.id : '';
    document.getElementById('userFullName').value = user?.full_name || '';
    document.getElementById('userUsername').value = user?.username || '';
    document.getElementById('userEmail').value = user?.email || '';
    document.getElementById('userPhone').value = user?.phone || '';
    document.getElementById('userStatus').value = editing ? String(Number(user.is_active)) : '1';
    document.getElementById('userPassword').required = !editing;
    document.getElementById('userPassword').placeholder = editing ? 'Leave blank to keep current password' : '';
    document.getElementById('userPasswordRequired').classList.toggle('d-none', editing);
    document.getElementById('userPasswordHelp').textContent = editing
        ? 'Leave blank to keep the current password, or enter at least 8 characters to reset it.'
        : 'At least 8 characters. Required for new users.';
    setRoleOptions(user?.role_id);
    bootstrap.Modal.getOrCreateInstance(document.getElementById('userModal')).show();
}

async function saveUser(event) {
    event.preventDefault();
    const id = document.getElementById('userId').value;
    const password = document.getElementById('userPassword').value;
    const payload = {
        full_name: document.getElementById('userFullName').value.trim(),
        username: document.getElementById('userUsername').value.trim(),
        email: document.getElementById('userEmail').value.trim(),
        phone: document.getElementById('userPhone').value.trim(),
        role_id: Number(document.getElementById('userRole').value),
        is_active: Number(document.getElementById('userStatus').value)
    };
    if (password) payload.password = password;

    try {
        const res = id
            ? await PUT(`/users/single.php?id=${id}`, payload)
            : await POST('/users/index.php', payload);
        showToast(res.message || 'User saved successfully', 'success');
        bootstrap.Modal.getInstance(document.getElementById('userModal')).hide();
        await loadUsers();
    } catch (err) {
        showToast(err.message || 'Failed to save user', 'error');
    }
}

async function handleUserAction(event) {
    const button = event.target.closest('button[data-user-action]');
    if (!button) return;
    const user = users.find((item) => Number(item.id) === Number(button.dataset.userId));
    if (!user) return;

    if (button.dataset.userAction === 'edit') {
        openUserModal(user);
        return;
    }
    if (button.dataset.userAction !== 'delete') return;
    if (!await confirmAction(`Permanently delete ${user.full_name}? This cannot be undone.`, 'Delete')) return;

    withButtonLoading(button, async () => {
        try {
            const res = await DEL(`/users/single.php?id=${user.id}`);
            showToast(res.message || 'User deleted', 'success');
            await loadUsers();
        } catch (err) {
            showToast(err.message || 'Failed to delete user', 'error');
        }
    }, 'Deleting...');
}

async function saveOrganization(event) {
    event.preventDefault();
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
