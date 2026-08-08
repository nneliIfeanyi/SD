<?php
$currentPage = basename($_SERVER['PHP_SELF'], '.php');
$user = currentUser();
$roleId = (int)($user['role_id'] ?? 0);
?>
<!-- Sidebar -->
<nav id="sidebar" class="sidebar bg-dark text-white">
    <div class="sidebar-header d-flex align-items-center justify-content-between px-3 py-3 border-bottom border-secondary">
        <a href="<?= APP_URL ?>/pages/dashboard.php" class="text-white text-decoration-none d-flex align-items-center gap-2">
            <i class="bi bi-calendar-event fs-4 text-primary"></i>
            <span class="fw-bold sidebar-brand">Event Admin</span>
        </a>
        <button class="btn btn-sm btn-outline-light d-lg-none" id="sidebarClose" type="button">
            <i class="bi bi-x-lg"></i>
        </button>
    </div>

    <div class="sidebar-user px-3 py-3 border-bottom border-secondary">
        <div class="d-flex align-items-center gap-2">
            <div class="avatar-circle bg-primary text-white d-flex align-items-center justify-content-center">
                <?= strtoupper(substr($user['full_name'] ?? 'U', 0, 1)) ?>
            </div>
            <div class="overflow-hidden">
                <div class="fw-semibold text-truncate small"><?= e($user['full_name'] ?? '') ?></div>
                <div class="text-white-50 small text-truncate"><?= e($user['role_name'] ?? '') ?></div>
            </div>
        </div>
    </div>

    <ul class="nav flex-column sidebar-nav px-2 py-3">
        <li class="nav-item">
            <a class="nav-link <?= $currentPage === 'dashboard' ? 'active' : '' ?>" href="<?= APP_URL ?>/pages/dashboard.php">
                <i class="bi bi-speedometer2 me-2"></i> Dashboard
            </a>
        </li>

        <?php if (in_array($roleId, [ROLE_SUPER_ADMIN, ROLE_REGISTRATION], true)): ?>
            <li class="nav-item">
                <a class="nav-link <?= $currentPage === 'events' ? 'active' : '' ?>" href="<?= APP_URL ?>/pages/events.php">
                    <i class="bi bi-calendar3 me-2"></i> Events
                </a>
            </li>
            <li class="nav-item">
                <a class="nav-link <?= $currentPage === 'participants' ? 'active' : '' ?>" href="<?= APP_URL ?>/pages/participants.php">
                    <i class="bi bi-people me-2"></i> Participants
                </a>
            </li>
        <?php endif; ?>

        <?php if (in_array($roleId, [ROLE_SUPER_ADMIN, ROLE_REGISTRATION, ROLE_ATTENDANCE], true)): ?>
            <li class="nav-item">
                <a class="nav-link <?= $currentPage === 'registration' ? 'active' : '' ?>" href="<?= APP_URL ?>/pages/registration.php">
                    <i class="bi bi-person-plus me-2"></i> Registration
                </a>
            </li>
        <?php endif; ?>

        <?php if (in_array($roleId, [ROLE_SUPER_ADMIN, ROLE_ATTENDANCE, ROLE_REGISTRATION], true)): ?>
            <li class="nav-item">
                <a class="nav-link <?= $currentPage === 'attendance' ? 'active' : '' ?>" href="<?= APP_URL ?>/pages/attendance.php">
                    <i class="bi bi-check2-square me-2"></i> Attendance
                </a>
            </li>
        <?php endif; ?>

        <?php if (in_array($roleId, [ROLE_SUPER_ADMIN, ROLE_REPORTS, ROLE_REGISTRATION], true)): ?>
            <li class="nav-item">
                <a class="nav-link <?= $currentPage === 'reports' ? 'active' : '' ?>" href="<?= APP_URL ?>/pages/reports.php">
                    <i class="bi bi-bar-chart-line me-2"></i> Reports
                </a>
            </li>
        <?php endif; ?>

        <?php if ($roleId === ROLE_SUPER_ADMIN): ?>
            <li class="nav-item mt-2">
                <a class="nav-link <?= $currentPage === 'settings' ? 'active' : '' ?>" href="<?= APP_URL ?>/pages/settings.php">
                    <i class="bi bi-gear me-2"></i> Settings
                </a>
            </li>
        <?php endif; ?>
    </ul>

    <div class="sidebar-footer mt-auto px-3 py-3 border-top border-secondary">
        <button class="btn btn-outline-light btn-sm w-100" id="logoutBtn">
            <i class="bi bi-box-arrow-right me-1"></i> Logout
        </button>
    </div>
</nav>

<!-- Mobile overlay -->
<div id="sidebarOverlay" class="sidebar-overlay d-lg-none"></div>