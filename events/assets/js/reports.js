/**
 * Reports Module Script
 */

import { GET, showToast, exportToCSV, formatDate, renderTableMessage, renderTableSkeleton, setChartLoading, withButtonLoading } from './api.js?v=4';

document.addEventListener('DOMContentLoaded', async () => {
    await loadEventsForFilter();
    loadGenderChart();
    loadStateChart();

    document.getElementById('reportEventFilter')?.addEventListener('change', () => {
        loadGenderChart();
        loadStateChart();
    });

    document.getElementById('btnExportRegistrations')?.addEventListener('click', exportRegistrations);
    document.getElementById('btnLoadEventReport')?.addEventListener('click', (event) => {
        withButtonLoading(event.currentTarget, () => loadEventRegistrations(), 'Loading...');
    });
});

async function loadEventsForFilter() {
    const select = document.getElementById('reportEventFilter');
    const select2 = document.getElementById('exportEventSelect');
    [select, select2].forEach((element) => {
        if (element) {
            element.disabled = true;
            element.innerHTML = '<option value="">Loading events...</option>';
        }
    });
    try {
        const res = await GET('/events/index.php?limit=50');
        const opts = '<option value="">All Events</option>' +
            (res.data || []).map(e => `<option value="${e.id}">${e.name}</option>`).join('');
        if (select) select.innerHTML = opts;
        if (select2) select2.innerHTML = (res.data || []).map(e => `<option value="${e.id}">${e.name}</option>`).join('');
    } catch (e) {
        [select, select2].forEach((element) => {
            if (element) element.innerHTML = '<option value="">Failed to load events</option>';
        });
        showToast(e.message || 'Failed to load events', 'error');
    } finally {
        [select, select2].forEach((element) => {
            if (element) element.disabled = false;
        });
    }
}

async function loadGenderChart() {
    const eventId = document.getElementById('reportEventFilter')?.value || '';
    const ctx = document.getElementById('genderChart');
    setChartLoading(ctx, true);
    try {
        let url = '/reports/index.php?type=gender';
        if (eventId) url += `&event_id=${eventId}`;
        const res = await GET(url);
        const data = res.data || [];

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
    } finally {
        setChartLoading(ctx, false);
    }
}

async function loadStateChart() {
    const eventId = document.getElementById('reportEventFilter')?.value || '';
    const ctx = document.getElementById('stateChart');
    setChartLoading(ctx, true);
    try {
        let url = '/reports/index.php?type=state';
        if (eventId) url += `&event_id=${eventId}`;
        const res = await GET(url);
        const data = res.data || [];

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
    } finally {
        setChartLoading(ctx, false);
    }
}

async function loadEventRegistrations() {
    const eventId = document.getElementById('exportEventSelect')?.value;
    if (!eventId) {
        showToast('Select an event', 'warning');
        return;
    }

    renderTableSkeleton(document.getElementById('eventReportBody'), 7);
    try {
        const res = await GET(`/reports/index.php?type=event_registrations&event_id=${eventId}`);
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
        renderTableMessage(document.getElementById('eventReportBody'), 7, 'Failed to load report');
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
