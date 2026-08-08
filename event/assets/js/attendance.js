/**
 * Attendance Module Script
 */

import { GET, POST, formatDate, showToast, debounce } from './api.js';

let selectedEventId = null;
let selectedDayId = null;
let lookupSuggestionTimer = null;

document.addEventListener('DOMContentLoaded', async () => {
    await loadEvents();

    document.getElementById('attSelectEvent')?.addEventListener('change', async (e) => {
        selectedEventId = e.target.value ? parseInt(e.target.value) : null;
        selectedDayId = null;
        await loadDays();
        loadAttendance();
    });

    document.getElementById('attSelectDay')?.addEventListener('change', (e) => {
        selectedDayId = e.target.value ? parseInt(e.target.value) : null;
        loadAttendance();
    });

    document.getElementById('searchAtt')?.addEventListener('input', debounce(loadAttendance, 350));

    document.getElementById('btnCheckIn')?.addEventListener('click', () => doAttendance());

    const attLookup = document.getElementById('attLookup');
    attLookup?.addEventListener('input', () => {
        clearTimeout(lookupSuggestionTimer);
        const hidden = document.getElementById('attSelectedRegistrationId');
        if (hidden) hidden.value = '';
        lookupSuggestionTimer = setTimeout(() => loadLookupSuggestions(), 250);
    });

    attLookup?.addEventListener('focus', () => {
        if (attLookup.value.trim()) {
            loadLookupSuggestions();
        }
    });
    attLookup?.addEventListener('blur', () => setTimeout(hideLookupSuggestions, 180));
    attLookup?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            doAttendance();
        }
    });

    document.getElementById('attLookupSuggestions')?.addEventListener('mousedown', (e) => {
        const btn = e.target.closest('button[data-registration-id]');
        if (!btn) return;
        e.preventDefault();
        selectLookupSuggestion(btn);
    });
});

async function loadEvents() {
    try {
        const res = await GET('/api2/events/index.php?limit=50');
        const select = document.getElementById('attSelectEvent');
        if (!select) return;
        select.innerHTML = '<option value="">â€” Select Event â€”</option>' +
            (res.data || []).map(e => `<option value="${e.id}">${e.name}</option>`).join('');
    } catch (err) {
        showToast('Failed to load events', 'error');
    }
}

async function loadDays() {
    const daySelect = document.getElementById('attSelectDay');
    const dayWrap = document.getElementById('daySelectWrap');
    if (!daySelect) return;

    if (!selectedEventId) {
        daySelect.innerHTML = '';
        dayWrap?.classList.add('d-none');
        return;
    }

    try {
        const res = await GET(`/api2/events/single.php?id=${selectedEventId}`);
        const days = res.data?.attendance_days || [];
        const isMulti = res.data?.is_multi_day == 1;

        if (isMulti && days.length) {
            dayWrap?.classList.remove('d-none');
            daySelect.innerHTML = '<option value="">â€” Select Day â€”</option>' +
                days.map(d => `<option value="${d.id}">Day ${d.day_number}: ${d.label || d.day_date}</option>`).join('');
        } else {
            dayWrap?.classList.add('d-none');
            daySelect.innerHTML = '';
            selectedDayId = null;
        }
    } catch (e) {
        dayWrap?.classList.add('d-none');
    }
}

async function loadAttendance() {
    const tbody = document.getElementById('attendanceTableBody');
    if (!tbody) return;

    if (!selectedEventId) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-4">Select an event</td></tr>`;
        return;
    }

    const search = document.getElementById('searchAtt')?.value || '';

    try {
        let url = `/api2/attendance/index.php?event_id=${selectedEventId}&limit=30`;
        if (selectedDayId) url += `&day_id=${selectedDayId}`;
        if (search) url += `&search=${encodeURIComponent(search)}`;

        const res = await GET(url);
        const rows = res.data || [];

        tbody.innerHTML = rows.map(a => `
            <tr>
                <td><code>${a.registration_number}</code></td>
                <td>${a.surname} ${a.first_name}</td>
                <td>${a.phone}</td>
                <td>${a.day_label || (a.day_number ? 'Day ' + a.day_number : 'â€”')}</td>
                <td class="small">${a.check_in ? formatDate(a.check_in, true) : 'â€”'}</td>
                <td>
                    ${a.check_in
                ? '<span class="badge text-bg-success">Present</span>'
                : '<span class="badge text-bg-warning">Pending</span>'}
                </td>
            </tr>
        `).join('') || `<tr><td colspan="6" class="text-center text-muted py-4">No attendance records</td></tr>`;
    } catch (err) {
        showToast(err.message, 'error');
    }
}

async function loadLookupSuggestions() {
    const lookup = document.getElementById('attLookup')?.value.trim();
    const suggestions = document.getElementById('attLookupSuggestions');
    const hidden = document.getElementById('attSelectedRegistrationId');

    if (!suggestions || !selectedEventId || lookup.length < 1) {
        hideLookupSuggestions();
        return;
    }

    try {
        const res = await GET(`/api2/registration/index.php?event_id=${selectedEventId}&search=${encodeURIComponent(lookup)}&limit=8`);
        const rows = res.data || [];

        if (!rows.length) {
            suggestions.innerHTML = '<div class="list-group-item text-muted">No matching participant found</div>';
            suggestions.classList.remove('d-none');
            return;
        }

        suggestions.innerHTML = rows.map(r => {
            const name = [r.surname, r.first_name, r.other_name].filter(Boolean).join(' ');
            const label = name || 'Unnamed participant';
            return `
                <button type="button" class="list-group-item list-group-item-action" data-registration-id="${r.id}" data-label="${label}">
                    <div class="d-flex justify-content-between align-items-start gap-2">
                        <div>
                            <div class="fw-semibold">${label}</div>
                            <div class="small text-muted">${r.phone || 'No phone'}</div>
                        </div>
                        <div class="small text-muted text-end">
                            <div>${r.registration_number}</div>
                        </div>
                    </div>
                </button>
            `;
        }).join('');

        suggestions.classList.remove('d-none');
    } catch (err) {
        hideLookupSuggestions();
    }
}

function hideLookupSuggestions() {
    const suggestions = document.getElementById('attLookupSuggestions');
    if (suggestions) {
        suggestions.classList.add('d-none');
    }
}

function selectLookupSuggestion(btn) {
    const lookupInput = document.getElementById('attLookup');
    const hidden = document.getElementById('attSelectedRegistrationId');
    if (!lookupInput || !hidden || !btn) return;

    hidden.value = btn.dataset.registrationId || '';
    lookupInput.value = btn.dataset.label || '';
    hideLookupSuggestions();
    doAttendance();
}

async function doAttendance() {
    const lookup = document.getElementById('attLookup')?.value.trim();
    const registrationId = document.getElementById('attSelectedRegistrationId')?.value.trim();
    if (!lookup) {
        showToast('Enter a name or phone number', 'warning');
        return;
    }
    if (!selectedEventId) {
        showToast('Select an event first', 'warning');
        return;
    }

    const payload = {
        search_term: lookup,
        event_id: selectedEventId,
        registration_id: registrationId || 0,
        attendance_day_id: selectedDayId || 0
    };

    try {
        const res = await POST('/api2/attendance/index.php', payload);
        showToast(res.message || 'Recorded', 'success');
        document.getElementById('attLookup').value = '';
        document.getElementById('attSelectedRegistrationId').value = '';
        document.getElementById('attLookup').focus();
        hideLookupSuggestions();
        loadAttendance();
    } catch (err) {
        showToast(err.message || 'Failed', 'error');
    }
}

