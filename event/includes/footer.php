</div><!-- /#page-content-wrapper -->
</div><!-- /#wrapper -->

<!-- Toast Container -->
<div class="toast-container position-fixed bottom-0 end-0 p-3" id="toastContainer" style="z-index: 1100;"></div>

<!-- Bootstrap JS -->
<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>

<!-- App Config -->
<script>
    window.APP_URL = '<?= APP_URL ?>';
    window.CSRF_TOKEN = '<?= generateCsrfToken() ?>';
</script>

<!-- Core API Module -->
<script type="module" src="<?= APP_URL ?>/assets/js/api.js"></script>

<?php if (!empty($pageScript)): ?>
<script type="module" src="<?= APP_URL ?>/assets/js/<?= e($pageScript) ?>"></script>
<?php endif; ?>

<script type="module">
    import { logout } from '<?= APP_URL ?>/assets/js/api.js';

    // Sidebar toggle (mobile)
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebarOverlay');
    const toggleBtn = document.getElementById('sidebarToggle');
    const closeBtn = document.getElementById('sidebarClose');

    function openSidebar() {
        sidebar?.classList.add('show');
        overlay?.classList.add('show');
    }
    function closeSidebar() {
        sidebar?.classList.remove('show');
        overlay?.classList.remove('show');
    }

    toggleBtn?.addEventListener('click', openSidebar);
    closeBtn?.addEventListener('click', closeSidebar);
    overlay?.addEventListener('click', closeSidebar);

    // Logout
    async function handleLogout(e) {
        e?.preventDefault();
        try {
            await logout();
            window.location.href = window.APP_URL + '/pages/login.php';
        } catch (err) {
            window.location.href = window.APP_URL + '/pages/login.php';
        }
    }
    document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);
    document.getElementById('navLogoutBtn')?.addEventListener('click', handleLogout);

    // Theme toggle
    const themeToggle = document.getElementById('themeToggle');
    const themeIcon = document.getElementById('themeIcon');
    const html = document.documentElement;

    const savedTheme = localStorage.getItem('theme') || 'light';
    html.setAttribute('data-bs-theme', savedTheme);
    updateThemeIcon(savedTheme);

    themeToggle?.addEventListener('click', () => {
        const current = html.getAttribute('data-bs-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-bs-theme', next);
        localStorage.setItem('theme', next);
        updateThemeIcon(next);
    });

    function updateThemeIcon(theme) {
        if (themeIcon) {
            themeIcon.className = theme === 'dark' ? 'bi bi-sun' : 'bi bi-moon-stars';
        }
    }
</script>
</body>
</html>
