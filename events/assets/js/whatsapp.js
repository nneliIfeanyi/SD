import { GET, PUT, debounce, formatDate, showToast, renderTableMessage, renderTableSkeleton, withButtonLoading } from './api.js?v=5';
import { whatsappChatUrl } from './whatsapp-helpers.js?v=2';

const labels = { not_invited: 'Not invited', invited: 'Invited', joined: 'Joined' };
let rows = null;
let loadVersion = 0;
let currentPage = 1;
let pageMeta = null;

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('invitationEvent').addEventListener('change', () => {
        document.getElementById('groupLink').value = '';
        currentPage = 1;
        loadRegistrations();
    });
    const search = debounce(loadRegistrations, 350);
    document.getElementById('invitationSearch').addEventListener('input', () => {
        currentPage = 1;
        ++loadVersion;
        rows = null;
        renderCounts(null);
        renderPagination(null);
        const tbody = document.getElementById('invitationRows');
        if (document.getElementById('invitationEvent').value) {
            renderTableSkeleton(tbody, 7);
        } else {
            renderTableMessage(tbody, 7, 'Select an event');
        }
        search();
    });
    document.getElementById('invitationFilter').addEventListener('change', () => {
        currentPage = 1;
        loadRegistrations();
    });
    document.getElementById('invitationPrevious').addEventListener('click', () => {
        if (pageMeta && currentPage > 1) {
            currentPage--;
            loadRegistrations();
        }
    });
    document.getElementById('invitationNext').addEventListener('click', () => {
        if (pageMeta && currentPage < pageMeta.pages) {
            currentPage++;
            loadRegistrations();
        }
    });
    loadEvents();
});

async function loadEvents() {
    const select = document.getElementById('invitationEvent');
    try {
        let page = 1;
        let pages = 1;
        const events = [];
        do {
            const response = await GET(`/events/index.php?page=${page}&limit=50`);
            events.push(...response.data);
            pages = response.meta.pages;
            page++;
        } while (page <= pages);

        select.replaceChildren(new Option(events.length ? 'Select an event' : 'No events available', ''));
        events.forEach(event => select.add(new Option(event.name, event.id)));
        select.disabled = !events.length;
    } catch (error) {
        select.replaceChildren(new Option('Failed to load events', ''));
        showToast(error.message || 'Failed to load events', 'error');
    }
}

async function loadRegistrations() {
    const version = ++loadVersion;
    const eventId = document.getElementById('invitationEvent').value;
    const tbody = document.getElementById('invitationRows');
    rows = null;
    renderCounts(null);
    renderPagination(null);
    if (!eventId) {
        renderTableMessage(tbody, 7, 'Select an event');
        return;
    }
    renderTableSkeleton(tbody, 7);
    try {
        const params = new URLSearchParams({
            event_id: eventId,
            page: String(currentPage),
            search: document.getElementById('invitationSearch').value.trim(),
            status: document.getElementById('invitationFilter').value
        });
        const response = await GET(`/registration/whatsapp.php?${params}`);
        if (version !== loadVersion) return;
        rows = response.data;
        currentPage = response.meta.page;
        renderCounts(response.counts);
        renderPagination(response.meta);
        renderRows();
    } catch (error) {
        if (version !== loadVersion) return;
        renderTableMessage(tbody, 7, 'Failed to load registrations');
        showToast(error.message || 'Failed to load registrations', 'error');
    }
}

function renderCounts(counts) {
    document.getElementById('countTotal').textContent = counts ? counts.total : '—';
    document.getElementById('countNotInvited').textContent = counts ? counts.not_invited : '—';
    document.getElementById('countInvited').textContent = counts ? counts.invited : '—';
    document.getElementById('countJoined').textContent = counts ? counts.joined : '—';
}

function renderPagination(meta) {
    pageMeta = meta;
    document.getElementById('invitationPrevious').disabled = !meta || meta.page <= 1;
    document.getElementById('invitationNext').disabled = !meta || meta.page >= meta.pages;
    const summary = document.getElementById('invitationPageSummary');
    if (!meta) {
        summary.textContent = '';
    } else if (!meta.total) {
        summary.textContent = 'No matching registrations';
    } else {
        const first = (meta.page - 1) * meta.limit + 1;
        const last = Math.min(meta.page * meta.limit, meta.total);
        summary.textContent = `Showing ${first}–${last} of ${meta.total} · Page ${meta.page} of ${meta.pages}`;
    }
}

function renderRows() {
    if (!rows) return;
    const tbody = document.getElementById('invitationRows');
    tbody.replaceChildren();
    if (!rows.length) {
        renderTableMessage(tbody, 7, 'No matching registrations');
        return;
    }
    rows.forEach(row => {
        const tr = document.createElement('tr');
        const values = [
            row.registration_number,
            [row.surname, row.first_name, row.other_name].filter(Boolean).join(' '),
            row.phone,
            row.registration_status,
            labels[row.invitation_status],
            row.updated_at ? `${formatDate(row.updated_at, true)}${row.updated_by_name ? ` by ${row.updated_by_name}` : ''}` : 'Not updated'
        ];
        values.forEach(value => {
            const cell = document.createElement('td');
            cell.textContent = value;
            tr.append(cell);
        });
        const actions = document.createElement('td');
        const group = document.createElement('div');
        group.className = 'd-flex flex-wrap gap-1';
        const chat = makeButton('Open WhatsApp', 'btn-outline-success', () => openChat(row));
        group.append(chat);
        if (row.invitation_status !== 'invited') {
            group.append(makeButton('Mark invited', 'btn-outline-primary', event => updateStatus(row, 'invited', event.currentTarget)));
        }
        if (row.invitation_status !== 'joined') {
            group.append(makeButton('Mark joined', 'btn-outline-primary', event => updateStatus(row, 'joined', event.currentTarget)));
        }
        if (row.invitation_status !== 'not_invited') {
            group.append(makeButton('Reset', 'btn-outline-secondary', event => updateStatus(row, 'not_invited', event.currentTarget)));
        }
        actions.append(group);
        tr.append(actions);
        tbody.append(tr);
    });
}

function makeButton(label, style, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn btn-sm ${style}`;
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
}

function openChat(row) {
    try {
        const url = whatsappChatUrl(row.phone, document.getElementById('countryCode').value, document.getElementById('groupLink').value);
        window.open(url, '_blank', 'noopener,noreferrer');
    } catch (error) {
        showToast(error.message, 'error');
    }
}

async function updateStatus(row, status, button) {
    const eventId = document.getElementById('invitationEvent').value;
    await withButtonLoading(button, async () => {
        button.parentElement.querySelectorAll('button').forEach(item => { item.disabled = true; });
        try {
            await PUT('/registration/whatsapp.php', {
                event_id: Number(eventId),
                registration_id: Number(row.id),
                expected_status: row.invitation_status,
                status
            });
            showToast('Invitation status updated');
            if (document.getElementById('invitationEvent').value === eventId) await loadRegistrations();
        } catch (error) {
            showToast(error.message || 'Failed to update status', 'error');
            if (error.message.includes('Status changed by another user') && document.getElementById('invitationEvent').value === eventId) {
                await loadRegistrations();
            } else {
                button.parentElement.querySelectorAll('button').forEach(item => { item.disabled = false; });
            }
        }
    }, 'Saving...');
}
