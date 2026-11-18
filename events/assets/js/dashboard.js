/**
 * Dashboard Page Script
 */

import { GET, formatDate, renderTableMessage, renderTableSkeleton, setChartLoading, showToast } from './api.js?v=4';

document.addEventListener('DOMContentLoaded', async () => {
    renderTableSkeleton(document.getElementById('recentActivityBody'), 4, 5);
    ['statTotalEvents', 'statTotalParticipants', 'statTodayReg', 'statTodayAtt', 'statOpenEvents', 'statTotalReg']
        .forEach((id) => document.getElementById(id)?.classList.add('skeleton-line'));
    const monthlyChart = document.getElementById('monthlyChart');
    const eventChart = document.getElementById('eventChart');
    setChartLoading(monthlyChart, true);
    setChartLoading(eventChart, true);
    try {
        const res = await GET('/reports/index.php?type=summary');
        const { stats, monthly_registrations, event_participation } = res.data;

        // Stat cards
        setText('statTotalEvents', stats.total_events);
        setText('statTotalParticipants', stats.total_participants);
        setText('statTodayReg', stats.today_registrations);
        setText('statTodayAtt', stats.today_attendance);
        setText('statOpenEvents', stats.open_events);
        setText('statTotalReg', stats.total_registrations);

        if (stats.active_event) {
            setText('statActiveEvent', stats.active_event.name);
        }

        // Monthly chart
        renderMonthlyChart(monthly_registrations || []);
        // Event participation chart
        renderEventChart(event_participation || []);
        setChartLoading(monthlyChart, false);
        setChartLoading(eventChart, false);

        // Load recent activities
        // (simplified - using last registrations as proxy)
        loadRecentActivity();

    } catch (err) {
        setChartLoading(monthlyChart, false);
        setChartLoading(eventChart, false);
        ['statTotalEvents', 'statTotalParticipants', 'statTodayReg', 'statTodayAtt', 'statOpenEvents', 'statTotalReg']
            .forEach((id) => {
                const element = document.getElementById(id);
                element?.classList.remove('skeleton-line');
                if (element) element.textContent = '—';
            });
        console.error(err);
        showToast('Failed to load dashboard data', 'error');
    }
});

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.classList.remove('skeleton-line');
        el.textContent = value ?? '0';
    }
}

function renderMonthlyChart(data) {
    const ctx = document.getElementById('monthlyChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.map(d => d.month),
            datasets: [{
                label: 'Registrations',
                data: data.map(d => d.total),
                borderColor: '#4f46e5',
                backgroundColor: 'rgba(79, 70, 229, 0.1)',
                fill: true,
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

function renderEventChart(data) {
    const ctx = document.getElementById('eventChart');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.map(d => d.name?.substring(0, 20) || ''),
            datasets: [{
                label: 'Participants',
                data: data.map(d => d.total),
                backgroundColor: '#4f46e5',
                borderRadius: 6
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
    });
}

async function loadRecentActivity() {
    const tbody = document.getElementById('recentActivityBody');
    renderTableSkeleton(tbody, 4, 5);
    try {
        const res = await GET('/registration/index.php?limit=5');
        if (!tbody) return;

        if (!res.data?.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No recent activity</td></tr>`;
            return;
        }

        tbody.innerHTML = res.data.map(r => `
            <tr>
                <td><code>${r.registration_number}</code></td>
                <td>${r.surname} ${r.first_name}</td>
                <td>${r.event_name || '—'}</td>
                <td class="text-muted small">${formatDate(r.registration_date, true)}</td>
            </tr>
        `).join('');
    } catch (e) {
        renderTableMessage(tbody, 4, 'Failed to load recent activity');
        showToast(e.message || 'Failed to load recent activity', 'error');
    }
}
