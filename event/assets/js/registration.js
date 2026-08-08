/**
 * Registration Module Script
 */

import { GET, POST, formatDate, showToast, debounce } from './api.js';

let selectedEventId = null;
let currentPage = 1;

document.addEventListener('DOMContentLoaded', async () => {
    await loadOpenEvents();

    document.getElementById('selectEvent')?.addEventListener('change', (e) => {
        selectedEventId = e.target.value ? parseInt(e.target.value) : null;
        currentPage = 1;
        loadRegistrations();
    });

    document.getElementById('searchReg')?.addEventListener('input', debounce(() => {
        currentPage = 1;
        loadRegistrations();
    }, 350));

    document.getElementById('btnNewRegistration')?.addEventListener('click', openRegModal);
    document.getElementById('registrationForm')?.addEventListener('submit', submitRegistration);

    // Toggle between existing / new participant
    document.querySelectorAll('input[name="participantMode"]').forEach(r => {
        r.addEventListener('change', () => {
            const mode = document.querySelector('input[name="participantMode"]:checked')?.value;
            document.getElementById('existingParticipantSection')?.classList.toggle('d-none', mode !== 'existing');
            document.getElementById('newParticipantSection')?.classList.toggle('d-none', mode !== 'new');
        });
    });

    // Search existing participants
    document.getElementById('searchExistingParticipant')?.addEventListener('input', debounce(searchParticipants, 300));
});

async function loadOpenEvents() {
    try {
        const res = await GET('/api/events/index.php?status=open&limit=50');
        const select = document.getElementById('selectEvent');
        if (!select) return;

        select.innerHTML = '<option value="">— Select Event —</option>' +
            (res.data || []).map(e => `<option value="${e.id}">${e.name} (${e.start_date})</option>`).join('');
    } catch (err) {
        showToast('Failed to load events', 'error');
    }
}

async function loadRegistrations() {
    const tbody = document.getElementById('registrationsTableBody');
    if (!tbody) return;

    if (!selectedEventId) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Select an event to view registrations</td></tr>`;
        return;
    }

    const search = document.getElementById('searchReg')?.value || '';

    try {
        let url = `/api/registration/index.php?event_id=${selectedEventId}&page=${currentPage}&limit=15`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const res = await GET(url);
        const rows = res.data || [];

        tbody.innerHTML = rows.map(r => `
            <tr>
                <td><code class="fw-semibold">${r.registration_number}</code></td>
                <td>${r.surname} ${r.first_name} ${r.other_name || ''}</td>
                <td>${r.gender}</td>
                <td>${r.phone}</td>
                <td>${r.church || '—'}</td>
                <td class="small text-muted">${formatDate(r.registration_date, true)}</td>
                <td><span class="badge text-bg-success">${r.status}</span></td>
            </tr>
        `).join('') || `<tr><td colspan="7" class="text-center text-muted py-4">No registrations yet</td></tr>`;

        // Pagination simple
        const pag = document.getElementById('regPagination');
        if (pag && res.meta && res.meta.pages > 1) {
            pag.innerHTML = Array.from({ length: res.meta.pages }, (_, i) => i + 1)
                .map(i => `<li class="page-item ${i === res.meta.page ? 'active' : ''}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a></li>`).join('');
            pag.querySelectorAll('[data-page]').forEach(a => {
                a.addEventListener('click', e => {
                    e.preventDefault();
                    currentPage = parseInt(a.dataset.page);
                    loadRegistrations();
                });
            });
        } else if (pag) {
            pag.innerHTML = '';
        }
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function openRegModal() {
    if (!selectedEventId) {
        showToast('Please select an event first', 'warning');
        return;
    }
    document.getElementById('registrationForm').reset();
    document.getElementById('regEventId').value = selectedEventId;
    document.getElementById('selectedParticipantId').value = '';
    document.getElementById('existingParticipantSection').classList.remove('d-none');
    document.getElementById('newParticipantSection').classList.add('d-none');
    document.querySelector('input[name="participantMode"][value="existing"]').checked = true;
    document.getElementById('participantSearchResults').innerHTML = '';
    new bootstrap.Modal(document.getElementById('registrationModal')).show();
}

async function searchParticipants() {
    const q = document.getElementById('searchExistingParticipant')?.value.trim();
    const box = document.getElementById('participantSearchResults');
    if (!q || q.length < 2) {
        box.innerHTML = '';
        return;
    }
    try {
        const res = await GET(`/api/participants/index.php?search=${encodeURIComponent(q)}&limit=8`);
        box.innerHTML = (res.data || []).map(p => `
            <button type="button" class="list-group-item list-group-item-action" data-id="${p.id}"
                data-name="${p.surname} ${p.first_name}">
                <strong>${p.surname} ${p.first_name}</strong>
                <small class="text-muted ms-2">${p.phone}</small>
            </button>
        `).join('') || '<div class="list-group-item text-muted">No matches</div>';

        box.querySelectorAll('[data-id]').forEach(btn => {
            btn.addEventListener('click', () => {
                document.getElementById('selectedParticipantId').value = btn.dataset.id;
                document.getElementById('searchExistingParticipant').value = btn.dataset.name;
                box.innerHTML = `<div class="alert alert-success py-2 mb-0">Selected: ${btn.dataset.name}</div>`;
            });
        });
    } catch (e) { /* silent */ }
}

async function submitRegistration(e) {
    e.preventDefault();
    const mode = document.querySelector('input[name="participantMode"]:checked')?.value;
    const eventId = parseInt(document.getElementById('regEventId').value);

    let payload = { event_id: eventId };

    if (mode === 'existing') {
        const pid = parseInt(document.getElementById('selectedParticipantId').value);
        if (!pid) {
            showToast('Please select a participant', 'warning');
            return;
        }
        payload.participant_id = pid;
    } else {
        payload.participant = {
            surname: document.getElementById('regSurname').value.trim(),
            first_name: document.getElementById('regFirstName').value.trim(),
            other_name: document.getElementById('regOtherName').value.trim(),
            gender: document.getElementById('regGender').value,
            phone: document.getElementById('regPhone').value.trim(),
            church: document.getElementById('regChurch').value.trim(),
            state: document.getElementById('regState').value.trim()
        };
    }

    try {
        const res = await POST('/api/registration/index.php', payload);
        showToast(`Registration successful! Number: ${res.data.registration_number}`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('registrationModal')).hide();
        loadRegistrations();
    } catch (err) {
        showToast(err.message || 'Registration failed', 'error');
    }
}
