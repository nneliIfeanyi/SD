import { GET, PUT, debounce, formatDate, showToast, confirmAction, renderTableMessage, renderTableSkeleton, withButtonLoading } from './api.js?v=5';
import { whatsappChatUrl, validateWhatsappSettings } from './whatsapp-helpers.js?v=3';
import { chooseDefaultEvent } from './event-helpers.js?v=1';

const labels = { not_invited: 'Not invited', invited: 'Invited', joined: 'Joined' };
let rows = null;
let loadVersion = 0;
let currentPage = 1;
let pageMeta = null;
let settingsVersion = 0;
let settingsEventId = null;
let settingsRevision = null;
let settingsDirty = false;
const hiddenActions = new Set();

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('invitationEvent').addEventListener('change', async (event) => {
        const select = event.currentTarget;
        const nextEventId = select.value;
        if (settingsDirty) {
            select.value = settingsEventId;
            select.disabled = true;
            try {
                if (!await confirmAction('Discard unsaved invitation settings?', 'Discard')) return;
                select.value = nextEventId;
            } catch (error) {
                showToast(error.message || 'Unable to confirm event change', 'error');
                return;
            } finally {
                select.disabled = false;
            }
        }
        currentPage = 1;
        loadSettings();
        loadRegistrations();
    });
    document.getElementById('saveInvitationSettings').addEventListener('click', saveSettings);
    document.getElementById('reloadInvitationSettings').addEventListener('click', async () => {
        try {
            if (settingsDirty && !await confirmAction('Discard unsaved invitation settings?', 'Discard')) return;
            loadSettings();
        } catch (error) {
            showToast(error.message || 'Unable to confirm reload', 'error');
        }
    });
    ['groupLink', 'countryCode'].forEach(id => {
        document.getElementById(id).addEventListener('input', () => {
            settingsDirty = true;
            document.getElementById('invitationSettingsStatus').textContent = 'Unsaved changes';
        });
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
        const defaultEvent = chooseDefaultEvent(events.filter(event => event.status === 'open'));
        if (defaultEvent) {
            select.value = String(defaultEvent.id);
            loadSettings();
            loadRegistrations();
        }
    } catch (error) {
        select.replaceChildren(new Option('Failed to load events', ''));
        showToast(error.message || 'Failed to load events', 'error');
    }
}

function setSettingsControls(enabled, allowReload) {
    document.getElementById('groupLink').disabled = !enabled;
    document.getElementById('countryCode').disabled = !enabled;
    document.getElementById('saveInvitationSettings').disabled = !enabled;
    document.getElementById('reloadInvitationSettings').disabled = !allowReload;
}

async function loadSettings() {
    const version = ++settingsVersion;
    const eventId = document.getElementById('invitationEvent').value;
    const status = document.getElementById('invitationSettingsStatus');
    settingsEventId = null;
    settingsRevision = null;
    settingsDirty = false;
    document.getElementById('groupLink').value = '';
    document.getElementById('countryCode').value = '';
    setSettingsControls(false, false);
    if (!eventId) {
        status.textContent = 'Select an event to load its settings.';
        return;
    }
    status.textContent = 'Loading settings...';
    try {
        const response = await GET(`/registration/whatsapp-settings.php?event_id=${encodeURIComponent(eventId)}`);
        if (version !== settingsVersion) return;
        settingsEventId = eventId;
        settingsRevision = response.data.revision;
        document.getElementById('groupLink').value = response.data.invite_link;
        document.getElementById('countryCode').value = response.data.country_code;
        status.textContent = response.data.revision ? 'Saved settings' : 'No saved settings yet';
        setSettingsControls(true, true);
    } catch (error) {
        if (version !== settingsVersion) return;
        status.textContent = 'Could not load settings. Use Reload to try again.';
        setSettingsControls(false, true);
        showToast(error.message || 'Failed to load invitation settings', 'error');
    }
}

async function saveSettings() {
    const eventId = document.getElementById('invitationEvent').value;
    if (!eventId || settingsEventId !== eventId || settingsRevision === null) {
        showToast('Load invitation settings before saving.', 'warning');
        return;
    }
    let settings;
    try {
        settings = validateWhatsappSettings(document.getElementById('countryCode').value, document.getElementById('groupLink').value);
    } catch (error) {
        showToast(error.message, 'error');
        return;
    }
    const version = settingsVersion;
    const status = document.getElementById('invitationSettingsStatus');
    setSettingsControls(false, false);
    status.textContent = 'Saving settings...';
    try {
        const response = await PUT('/registration/whatsapp-settings.php', {
            event_id: Number(eventId),
            invite_link: settings.groupLink,
            country_code: settings.countryCode,
            expected_revision: settingsRevision
        });
        if (version !== settingsVersion) return;
        settingsRevision = response.data.revision;
        document.getElementById('groupLink').value = response.data.invite_link;
        document.getElementById('countryCode').value = response.data.country_code;
        settingsDirty = false;
        status.textContent = 'Saved settings';
        showToast('Invitation settings saved');
    } catch (error) {
        if (version !== settingsVersion) return;
        status.textContent = 'Settings were not saved. Reload if another user changed them.';
        showToast(error.message || 'Failed to save invitation settings', 'error');
    } finally {
        if (version === settingsVersion) setSettingsControls(true, true);
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
        const actionsHidden = hiddenActions.has(String(row.id));
        if (!actionsHidden) {
            group.append(makeButton('Open WhatsApp', 'bi-whatsapp', 'btn-outline-success', () => {
                if (openChat(row)) {
                    hiddenActions.add(String(row.id));
                    renderRows();
                }
            }));
        }
        if (!actionsHidden && row.invitation_status !== 'invited') {
            group.append(makeButton('Mark invited', 'bi-check-circle', 'btn-outline-primary', event => updateStatus(row, 'invited', event.currentTarget)));
        }
        if (row.invitation_status !== 'joined') {
            group.append(makeButton('Mark joined', 'bi-people', 'btn-outline-primary', event => updateStatus(row, 'joined', event.currentTarget)));
        }
        if (row.invitation_status !== 'not_invited') {
            group.append(makeButton('Reset', 'bi-arrow-counterclockwise', 'btn-outline-secondary', event => updateStatus(row, 'not_invited', event.currentTarget)));
        }
        actions.append(group);
        tr.append(actions);
        tbody.append(tr);
    });
}

function makeButton(label, icon, style, onClick) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `btn btn-sm ${style}`;
    button.title = label;
    button.setAttribute('aria-label', label);
    const iconElement = document.createElement('i');
    iconElement.className = `bi ${icon}`;
    iconElement.setAttribute('aria-hidden', 'true');
    button.append(iconElement);
    button.addEventListener('click', onClick);
    return button;
}

function openChat(row) {
    try {
        if (settingsEventId !== document.getElementById('invitationEvent').value) {
            throw new Error('Load invitation settings before opening WhatsApp.');
        }
        const url = whatsappChatUrl(row.phone, document.getElementById('countryCode').value, document.getElementById('groupLink').value);
        window.open(url, '_blank', 'noopener,noreferrer');
        return true;
    } catch (error) {
        showToast(error.message, 'error');
        return false;
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
            if (status === 'invited') hiddenActions.add(String(row.id));
            if (status === 'not_invited') hiddenActions.delete(String(row.id));
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
