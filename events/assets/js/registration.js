/**
 * Registration Module Script
 */

import { GET, POST, formatDate, showToast, debounce, renderTableMessage, renderTableSkeleton, withButtonLoading } from './api.js?v=5';

let selectedEventId = null;
let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    const newRegistrationButton = document.getElementById('btnNewRegistration');
    if (newRegistrationButton) newRegistrationButton.disabled = true;

    document.getElementById('selectEvent')?.addEventListener('change', (e) => {
        selectedEventId = e.target.value ? parseInt(e.target.value) : null;
        currentPage = 1;
        updateNewRegistrationButton();
        loadRegistrations();
    });

    document.getElementById('searchReg')?.addEventListener('input', debounce(() => {
        currentPage = 1;
        loadRegistrations();
    }, 350));

    newRegistrationButton?.addEventListener('click', openRegModal);
    document.getElementById('registrationForm')?.addEventListener('submit', (event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const button = event.submitter || form.querySelector('[type="submit"]');
        withButtonLoading(button, () => submitRegistration(event), 'Registering...');
    });

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

    loadOpenEvents();
});

async function loadOpenEvents() {
    const select = document.getElementById('selectEvent');
    if (select) {
        select.disabled = true;
        select.innerHTML = '<option value="">Loading events...</option>';
    }
    try {
        const res = await GET('/events/index.php?status=open&limit=50');
        if (!select) return;

        const events = res.data || [];
        if (!events.length) {
            select.innerHTML = '<option value="">No open events available</option>';
            selectedEventId = null;
            renderTableMessage(document.getElementById('registrationsTableBody'), 7, 'No open events available');
            return;
        }

        const defaultEvent = chooseDefaultEvent(events);
        select.innerHTML = '<option value="">— Select Event —</option>' +
            events.map(e => `<option value="${e.id}">${e.name} (${e.start_date})</option>`).join('');
        select.value = String(defaultEvent.id);
        selectedEventId = Number(defaultEvent.id);
        currentPage = 1;
        loadRegistrations();
    } catch (err) {
        if (select) select.innerHTML = '<option value="">Failed to load events</option>';
        showToast('Failed to load events', 'error');
    } finally {
        if (select) select.disabled = false;
        updateNewRegistrationButton();
    }
}

function chooseDefaultEvent(events) {
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    const activeEvent = events.find((event) => event.start_date <= today && event.end_date >= today);
    if (activeEvent) return activeEvent;

    const upcomingEvents = events
        .filter((event) => event.start_date > today)
        .sort((a, b) => a.start_date.localeCompare(b.start_date));
    return upcomingEvents[0] || events[0];
}

function updateNewRegistrationButton() {
    const button = document.getElementById('btnNewRegistration');
    if (button) button.disabled = !selectedEventId;
}

async function loadRegistrations() {
    const tbody = document.getElementById('registrationsTableBody');
    if (!tbody) return;

    renderTableSkeleton(tbody, 7);
    if (!selectedEventId) {
        tbody.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-4">Select an event to view registrations</td></tr>`;
        return;
    }

    const search = document.getElementById('searchReg')?.value || '';

    try {
        let url = `/registration/index.php?event_id=${selectedEventId}&page=${currentPage}&limit=15`;
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
        renderTableMessage(tbody, 7, 'Failed to load registrations');
        showToast(err.message, 'error');
    }
}

function openRegModal() {
    const select = document.getElementById('selectEvent');
    selectedEventId = select?.value ? Number(select.value) : null;
    if (!selectedEventId) {
        showToast('No open event is available. Open an event before registering.', 'warning');
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
    box.innerHTML = Array.from({ length: 3 }, () => `
        <div class="list-group-item" aria-hidden="true"><span class="skeleton-line"></span></div>
    `).join('');
    try {
        const res = await GET(`/participants/index.php?search=${encodeURIComponent(q)}&limit=8`);
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
        const res = await POST('/registration/index.php', payload);
        const attendanceMessage = res.data.attendance_marked
            ? ` Participant automatically marked present for Day ${res.data.attendance_day_number}.`
            : '';
        showToast(`Registration successful! Number: ${res.data.registration_number}.${attendanceMessage}`, 'success');
        bootstrap.Modal.getInstance(document.getElementById('registrationModal')).hide();
        loadRegistrations();
    } catch (err) {
        showToast(err.message || 'Registration failed', 'error');
    }
}
