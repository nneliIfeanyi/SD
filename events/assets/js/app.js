import { APP_BASE_URL, me, logout, OfflineError } from './api.js?v=5';

const rolesByPage = {
    dashboard: [1, 2, 3, 4], events: [1, 2], participants: [1, 2],
    registration: [1, 2, 3], whatsapp: [1, 2, 3], attendance: [1, 2, 3], reports: [1, 2, 4], settings: [1]
};

function currentPage() {
    const match = window.location.pathname.match(/\/pages\/([^/]+)\.html$/);
    return match ? match[1] : 'dashboard';
}

function setIdentity(user) {
    const name = user.full_name || user.username || '';
    const role = user.role_name || '';
    document.querySelectorAll('[data-user-name]').forEach((el) => { el.textContent = name; });
    document.querySelectorAll('[data-user-role]').forEach((el) => { el.textContent = role; });
    document.querySelectorAll('[data-user-initial]').forEach((el) => { el.textContent = name.trim().charAt(0).toUpperCase() || 'U'; });
}

async function handleLogout(event) {
    event.preventDefault();
    try { await logout(); } catch (error) { /* Always return to the static login route. */ }
    window.location.assign(APP_BASE_URL.href);
}

function initLayout() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    document.getElementById('sidebarToggle')?.addEventListener('click', () => { sidebar?.classList.add('show'); overlay?.classList.add('show'); });
    const closeSidebar = () => { sidebar?.classList.remove('show'); overlay?.classList.remove('show'); };
    document.getElementById('sidebarClose')?.addEventListener('click', closeSidebar);
    overlay?.addEventListener('click', closeSidebar);
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('navLogoutBtn')?.addEventListener('click', handleLogout);

    const html = document.documentElement;
    const icon = document.getElementById('themeIcon');
    const updateIcon = (theme) => { if (icon) icon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars'; };
    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-bs-theme', savedTheme);
    updateIcon(savedTheme);
    document.getElementById('themeToggle')?.addEventListener('click', () => {
        const theme = html.getAttribute('data-bs-theme') === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-bs-theme', theme);
        localStorage.setItem('theme', theme);
        updateIcon(theme);
    });
}

async function bootstrap() {
    try {
        const response = await me();
        const user = response.user || response.data?.user || {};
        const page = currentPage();
        const roleId = Number(user.role_id);
        if (!user.role_id || !rolesByPage.dashboard.includes(roleId)) {
            throw new Error('Unable to verify your account permissions.');
        }
        if (!rolesByPage[page]?.includes(roleId)) {
            window.location.replace(new URL('pages/dashboard.html', APP_BASE_URL).href);
            return;
        }
        setIdentity(user);
        document.querySelectorAll('[data-role-allow]').forEach((item) => {
            const allowed = item.dataset.roleAllow.split(',').map(Number);
            item.classList.toggle('d-none', !allowed.includes(roleId));
        });
        document.documentElement.classList.remove('auth-pending');
        initLayout();
    } catch (error) {
        if (error.message === 'Unauthorized') return;
        if (error instanceof OfflineError) {
            document.documentElement.classList.remove('auth-pending');
            return;
        }

        console.error('Unable to load the event admin page:', error);
        const message = document.createElement('p');
        message.textContent = 'Unable to load the page. Please check the API connection and try again.';
        const retry = document.createElement('button');
        retry.type = 'button';
        retry.textContent = 'Try again';
        retry.addEventListener('click', () => window.location.reload());
        const container = document.createElement('main');
        container.className = 'container py-5';
        container.append(message, retry);
        document.body.replaceChildren(container);
        document.documentElement.classList.remove('auth-pending');
    }
}

bootstrap();
