/**
 * Events Management Script
 */

import { GET, POST, PUT, DEL, formatDate, statusBadge, showToast, confirmAction, debounce } from './api.js';

let currentPage = 1;

document.addEventListener('DOMContentLoaded', () => {
    loadEvents();

    document.getElementById('searchEvents')?.addEventListener('input', debounce(() => {
        currentPage = 1;
        loadEvents();
    }, 350));

    document.getElementById('filterStatus')?.addEventListener('change', () => {
        currentPage = 1;
        loadEvents();
    });

    document.getElementById('btnAddEvent')?.addEventListener('click', () => openEventModal());
    document.getElementById('eventForm')?.addEventListener('submit', saveEvent);
});

async function loadEvents() {
    const search = document.getElementById('searchEvents')?.value || '';
    const status = document.getElementById('filterStatus')?.value || '';
    const container = document.getElementById('eventsContainer');
    const tableBody = document.getElementById('eventsTableBody');

    try {
        let url = `/api/events/index.php?page=${currentPage}&limit=12`;
        if (search) url += `&search=${encodeURIComponent(search)}`;
        if (status) url += `&status=${encodeURIComponent(status)}`;

        const res = await GET(url);
        const events = res.data || [];

        // Card view
        if (container) {
            if (!events.length) {
                container.innerHTML = `
                    <div class="col-12">
                        <div class="empty-state">
                            <i class="bi bi-calendar-x"></i>
                            <p class="mt-2">No events found</p>
                        </div>
                    </div>`;
            } else {
                container.innerHTML = events.map(ev => eventCard(ev)).join('');
            }
        }

        // Table view
        if (tableBody) {
            tableBody.innerHTML = events.map(ev => `
                <tr>
                    <td class="fw-semibold">${ev.name}</td>
                    <td>${ev.venue || '—'}</td>
                    <td>${formatDate(ev.start_date)} – ${formatDate(ev.end_date)}</td>
                    <td>${statusBadge(ev.status)}</td>
                    <td><span class="badge text-bg-light">${ev.participant_count || 0}</span></td>
                    <td>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="window.editEvent(${ev.id})" title="Edit"><i class="bi bi-pencil"></i></button>
                            <button class="btn btn-outline-danger" onclick="window.deleteEvent(${ev.id})" title="Delete"><i class="bi bi-trash"></i></button>
                        </div>
                    </td>
                </tr>
            `).join('') || `<tr><td colspan="6" class="text-center text-muted py-4">No events</td></tr>`;
        }

        // Pagination
        renderPagination(res.meta);

    } catch (err) {
        showToast(err.message || 'Failed to load events', 'error');
    }
}

function eventCard(ev) {
    const statusColor = { open: 'success', draft: 'secondary', closed: 'warning', archived: 'dark' }[ev.status] || 'secondary';
    return `
        <div class="col-md-6 col-xl-4">
            <div class="card event-card h-100">
                <div class="event-banner d-flex align-items-end p-3 text-white">
                    <span class="badge text-bg-${statusColor}">${ev.status}</span>
                </div>
                <div class="card-body">
                    <h5 class="card-title">${ev.name}</h5>
                    <p class="card-text text-muted small mb-2">
                        <i class="bi bi-geo-alt me-1"></i>${ev.venue || 'TBA'}
                    </p>
                    <p class="card-text text-muted small">
                        <i class="bi bi-calendar me-1"></i>${formatDate(ev.start_date)} – ${formatDate(ev.end_date)}
                    </p>
                    <div class="d-flex justify-content-between align-items-center mt-3">
                        <span class="badge text-bg-primary">${ev.participant_count || 0} registered</span>
                        <div class="btn-group btn-group-sm">
                            <button class="btn btn-outline-primary" onclick="window.editEvent(${ev.id})"><i class="bi bi-pencil"></i></button>
                            <button class="btn btn-outline-danger" onclick="window.deleteEvent(${ev.id})"><i class="bi bi-trash"></i></button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function renderPagination(meta) {
    const el = document.getElementById('eventsPagination');
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
            loadEvents();
        });
    });
}

function openEventModal(event = null) {
    const modal = new bootstrap.Modal(document.getElementById('eventModal'));
    const form = document.getElementById('eventForm');
    form.reset();
    document.getElementById('eventId').value = event?.id || '';
    document.getElementById('eventModalTitle').textContent = event ? 'Edit Event' : 'Add New Event';

    if (event) {
        document.getElementById('eventName').value = event.name || '';
        document.getElementById('eventDescription').value = event.description || '';
        document.getElementById('eventVenue').value = event.venue || '';
        document.getElementById('eventStart').value = event.start_date || '';
        document.getElementById('eventEnd').value = event.end_date || '';
        document.getElementById('eventRegOpen').value = event.registration_open || '';
        document.getElementById('eventRegClose').value = event.registration_close || '';
        document.getElementById('eventStatus').value = event.status || 'draft';
    }
    modal.show();
}

async function saveEvent(e) {
    e.preventDefault();
    const id = document.getElementById('eventId').value;
    const payload = {
        name: document.getElementById('eventName').value.trim(),
        description: document.getElementById('eventDescription').value.trim(),
        venue: document.getElementById('eventVenue').value.trim(),
        start_date: document.getElementById('eventStart').value,
        end_date: document.getElementById('eventEnd').value,
        registration_open: document.getElementById('eventRegOpen').value || null,
        registration_close: document.getElementById('eventRegClose').value || null,
        status: document.getElementById('eventStatus').value
    };

    try {
        if (id) {
            await PUT(`/api/events/single.php?id=${id}`, payload);
            showToast('Event updated successfully');
        } else {
            await POST('/api/events/index.php', payload);
            showToast('Event created successfully');
        }
        bootstrap.Modal.getInstance(document.getElementById('eventModal')).hide();
        loadEvents();
    } catch (err) {
        showToast(err.message || 'Failed to save event', 'error');
    }
}

window.editEvent = async function (id) {
    try {
        const res = await GET(`/api/events/single.php?id=${id}`);
        openEventModal(res.data);
    } catch (err) {
        showToast(err.message, 'error');
    }
};

window.deleteEvent = async function (id) {
    if (!confirmAction('Delete this event? This cannot be undone.')) return;
    try {
        await DEL(`/api/events/single.php?id=${id}`);
        showToast('Event deleted');
        loadEvents();
    } catch (err) {
        showToast(err.message, 'error');
    }
};
