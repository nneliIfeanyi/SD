/**
 * Participants Management Script
 */

import { GET, POST, PUT, DEL, formatDate, showToast, confirmAction, debounce } from './api.js';

let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    loadParticipants();

    document.getElementById('searchParticipants')?.addEventListener('input', debounce(() => {
        currentPage = 1;
        loadParticipants();
    }, 350));

    document.getElementById('filterGender')?.addEventListener('change', () => {
        currentPage = 1;
        loadParticipants();
    });

    document.getElementById('btnAddParticipant')?.addEventListener('click', () => openParticipantModal());
    document.getElementById('participantForm')?.addEventListener('submit', saveParticipant);
});

async function loadParticipants() {
    const search = document.getElementById('searchParticipants')?.value || '';
    const gender = document.getElementById('filterGender')?.value || '';
    const tbody = document.getElementById('participantsTableBody');

    try {
        let url = `/api2/participants/index.php?page=${currentPage}&limit=15`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (gender) url += `&gender=${encodeURIComponent(gender)}`;

        const res = await GET(url);
        const rows = res.data || [];

        if (!tbody) return;

        tbody.innerHTML = rows.map(p => `
            <tr>
                <td>
                    <div class="fw-semibold">${p.surname} ${p.first_name}</div>
                    <small class="text-muted">${p.other_name || ''}</small>
                </td>
                <td>${p.gender}</td>
                <td>${p.phone}</td>
                <td>${p.email || 'â€”'}</td>
                <td>${p.church || 'â€”'}</td>
                <td>${p.state || 'â€”'}</td>
                <td><span class="badge text-bg-light">${p.registration_count || 0}</span></td>
                <td>
                    <div class="btn-group btn-group-sm">
                        <button class="btn btn-outline-primary" onclick="window.editParticipant(${p.id})" title="Edit"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-outline-info" onclick="window.viewParticipant(${p.id})" title="View"><i class="bi bi-eye"></i></button>
                        <button class="btn btn-outline-danger" onclick="window.deleteParticipant(${p.id})" title="Delete"><i class="bi bi-trash"></i></button>
                    </div>
                </td>
            </tr>
        `).join('') || `<tr><td colspan="8" class="text-center text-muted py-4">No participants found</td></tr>`;

        renderPagination(res.meta);
    } catch (err) {
        showToast(err.message || 'Failed to load participants', 'error');
    }
}

function renderPagination(meta) {
    const el = document.getElementById('participantsPagination');
    if (!el || !meta || meta.pages <= 1) {
        if (el) el.innerHTML = '';
        return;
    }
    let html = '';
    for (let i = 1; i <= meta.pages; i++) {
        html += `<li class="page-item ${i === meta.page ? 'active' : ''}">
            <a class="page-link" href="#" data-page="${i}">${i}</a>
        </li>`;
    }
    el.innerHTML = html;
    el.querySelectorAll('[data-page]').forEach(a => {
        a.addEventListener('click', e => {
            e.preventDefault();
            currentPage = parseInt(a.dataset.page);
            loadParticipants();
        });
    });
}

function openParticipantModal(p = null) {
    const modal = new bootstrap.Modal(document.getElementById('participantModal'));
    document.getElementById('participantForm').reset();
    document.getElementById('participantId').value = p?.id || '';
    document.getElementById('participantModalTitle').textContent = p ? 'Edit Participant' : 'Add Participant';

    if (p) {
        document.getElementById('pSurname').value = p.surname || '';
        document.getElementById('pFirstName').value = p.first_name || '';
        document.getElementById('pOtherName').value = p.other_name || '';
        document.getElementById('pGender').value = p.gender || '';
        document.getElementById('pDob').value = p.date_of_birth || '';
        document.getElementById('pPhone').value = p.phone || '';
        document.getElementById('pEmail').value = p.email || '';
        document.getElementById('pChurch').value = p.church || '';
        document.getElementById('pOccupation').value = p.occupation || '';
        document.getElementById('pAddress').value = p.address || '';
        document.getElementById('pState').value = p.state || '';
        document.getElementById('pCountry').value = p.country || 'Nigeria';
        document.getElementById('pEmName').value = p.emergency_contact_name || '';
        document.getElementById('pEmPhone').value = p.emergency_contact_phone || '';
    }
    modal.show();
}

async function saveParticipant(e) {
    e.preventDefault();
    const id = document.getElementById('participantId').value;
    const payload = {
        surname: document.getElementById('pSurname').value.trim(),
        first_name: document.getElementById('pFirstName').value.trim(),
        other_name: document.getElementById('pOtherName').value.trim(),
        gender: document.getElementById('pGender').value,
        date_of_birth: document.getElementById('pDob').value || null,
        phone: document.getElementById('pPhone').value.trim(),
        email: document.getElementById('pEmail').value.trim(),
        church: document.getElementById('pChurch').value.trim(),
        occupation: document.getElementById('pOccupation').value.trim(),
        address: document.getElementById('pAddress').value.trim(),
        state: document.getElementById('pState').value.trim(),
        country: document.getElementById('pCountry').value.trim() || 'Nigeria',
        emergency_contact_name: document.getElementById('pEmName').value.trim(),
        emergency_contact_phone: document.getElementById('pEmPhone').value.trim()
    };

    try {
        if (id) {
            await PUT(`/api2/participants/single.php?id=${id}`, payload);
            showToast('Participant updated');
        } else {
            await POST('/api2/participants/index.php', payload);
            showToast('Participant created');
        }
        bootstrap.Modal.getInstance(document.getElementById('participantModal')).hide();
        loadParticipants();
    } catch (err) {
        showToast(err.message || 'Failed to save', 'error');
    }
}

window.editParticipant = async function (id) {
    try {
        const res = await GET(`/api2/participants/single.php?id=${id}`);
        openParticipantModal(res.data);
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.viewParticipant = async function (id) {
    try {
        const res = await GET(`/api2/participants/single.php?id=${id}`);
        const p = res.data;
        const regs = (p.registrations || []).map(r =>
            `<li>${r.event_name} â€” <code>${r.registration_number}</code> (${formatDate(r.registration_date)})</li>`
        ).join('') || '<li class="text-muted">No registrations</li>';

        document.getElementById('viewParticipantBody').innerHTML = `
            <div class="row g-3">
                <div class="col-md-6"><strong>Name:</strong> ${p.surname} ${p.first_name} ${p.other_name || ''}</div>
                <div class="col-md-3"><strong>Gender:</strong> ${p.gender}</div>
                <div class="col-md-3"><strong>Phone:</strong> ${p.phone}</div>
                <div class="col-md-6"><strong>Email:</strong> ${p.email || 'â€”'}</div>
                <div class="col-md-6"><strong>Church:</strong> ${p.church || 'â€”'}</div>
                <div class="col-md-6"><strong>State:</strong> ${p.state || 'â€”'}</div>
                <div class="col-md-6"><strong>Occupation:</strong> ${p.occupation || 'â€”'}</div>
                <div class="col-12"><strong>Address:</strong> ${p.address || 'â€”'}</div>
                <div class="col-12"><strong>Registrations:</strong><ul class="mb-0 mt-1">${regs}</ul></div>
            </div>
        `;
        new bootstrap.Modal(document.getElementById('viewParticipantModal')).show();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.deleteParticipant = async function (id) {
    if (!confirmAction('Delete this participant? All related registrations will also be removed.')) return;
    try {
        await DEL(`/api2/participants/single.php?id=${id}`);
        showToast('Participant deleted');
        loadParticipants();
    } catch (err) {
        showToast(err.message, 'error');
    }
};

