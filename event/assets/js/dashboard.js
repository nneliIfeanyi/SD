/**
 * Dashboard Page Script
 */

import { GET, formatDate, showToast } from './api.js';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        const res = await GET('/api2/reports/index.php?type=summary');
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

        // Load recent activities
        // (simplified - using last registrations as proxy)
        loadRecentActivity();

    } catch (err) {
        console.error(err);
        showToast('Failed to load dashboard data', 'error');
    }
});

function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value ?? '0';
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
    try {
        const res = await GET('/api2/registration/index.php?limit=5');
        const tbody = document.getElementById('recentActivityBody');
        if (!tbody) return;

        if (!res.data?.length) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No recent activity</td></tr>`;
            return;
        }

        tbody.innerHTML = res.data.map(r => `
            <tr>
                <td><code>${r.registration_number}</code></td>
                <td>${r.surname} ${r.first_name}</td>
                <td>${r.event_name || 'â€”'}</td>
                <td class="text-muted small">${formatDate(r.registration_date, true)}</td>
            </tr>
        `).join('');
    } catch (e) {
        // silent
    }
}

