/**
 * Reports Module Script
 */

import { GET, showToast, exportToCSV, formatDate } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    await loadEventsForFilter();
    loadGenderChart();
    loadStateChart();

    document.getElementById('reportEventFilter')?.addEventListener('change', () => {
        loadGenderChart();
        loadStateChart();
    });

    document.getElementById('btnExportRegistrations')?.addEventListener('click', exportRegistrations);
    document.getElementById('btnLoadEventReport')?.addEventListener('click', loadEventRegistrations);
});

async function loadEventsForFilter() {
    try {
        const res = await GET('/api/events/index.php?limit=50');
        const select = document.getElementById('reportEventFilter');
        const select2 = document.getElementById('exportEventSelect');
        const opts = '<option value="">All Events</option>' +
            (res.data || []).map(e => `<option value="${e.id}">${e.name}</option>`).join('');
        if (select) select.innerHTML = opts;
        if (select2) select2.innerHTML = (res.data || []).map(e => `<option value="${e.id}">${e.name}</option>`).join('');
    } catch (e) { /* silent */ }
}

async function loadGenderChart() {
    const eventId = document.getElementById('reportEventFilter')?.value || '';
    try {
        let url = '/api/reports/index.php?type=gender';
        if (eventId) url += `&event_id=${eventId}`;
        const res = await GET(url);
        const data = res.data || [];

        const ctx = document.getElementById('genderChart');
        if (!ctx) return;

        // Destroy previous if exists
        if (ctx._chart) ctx._chart.destroy();

        ctx._chart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: data.map(d => d.gender),
                datasets: [{
                    data: data.map(d => d.total),
                    backgroundColor: ['#4f46e5', '#ec4899', '#94a3b8']
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { position: 'bottom' } }
            }
        });
    } catch (err) {
        console.error(err);
    }
}

async function loadStateChart() {
    const eventId = document.getElementById('reportEventFilter')?.value || '';
    try {
        let url = '/api/reports/index.php?type=state';
        if (eventId) url += `&event_id=${eventId}`;
        const res = await GET(url);
        const data = res.data || [];

        const ctx = document.getElementById('stateChart');
        if (!ctx) return;
        if (ctx._chart) ctx._chart.destroy();

        ctx._chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: data.map(d => d.state),
                datasets: [{
                    label: 'Participants',
                    data: data.map(d => d.total),
                    backgroundColor: '#4f46e5',
                    borderRadius: 4
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: { legend: { display: false } },
                scales: { x: { beginAtZero: true, ticks: { precision: 0 } } }
            }
        });
    } catch (err) {
        console.error(err);
    }
}

async function loadEventRegistrations() {
    const eventId = document.getElementById('exportEventSelect')?.value;
    if (!eventId) {
        showToast('Select an event', 'warning');
        return;
    }

    try {
        const res = await GET(`/api/reports/index.php?type=event_registrations&event_id=${eventId}`);
        const rows = res.data || [];
        const tbody = document.getElementById('eventReportBody');

        tbody.innerHTML = rows.map(r => `
            <tr>
                <td><code>${r.registration_number}</code></td>
                <td>${r.surname} ${r.first_name}</td>
                <td>${r.gender}</td>
                <td>${r.phone}</td>
                <td>${r.church || '—'}</td>
                <td>${r.state || '—'}</td>
                <td class="small">${formatDate(r.registration_date)}</td>
            </tr>
        `).join('') || `<tr><td colspan="7" class="text-center text-muted">No data</td></tr>`;

        // Store for export
        window._reportRows = rows;
        showToast(`Loaded ${rows.length} records`);
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function exportRegistrations() {
    const rows = window._reportRows;
    if (!rows?.length) {
        showToast('Load a report first', 'warning');
        return;
    }
    exportToCSV(rows, `registrations-${Date.now()}.csv`);
    showToast('CSV downloaded', 'success');
}
