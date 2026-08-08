<?php
require_once __DIR__ . '/../config/auth.php';
requireAuth();

$pageTitle = 'Dashboard';
$pageScript = 'dashboard.js';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
?>
<div id="page-content-wrapper">
    <?php require_once __DIR__ . '/../includes/navbar.php'; ?>

    <div class="container-fluid p-4">
        <div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
                <h4 class="mb-0">Dashboard</h4>
                <p class="text-muted small mb-0">Overview of events and registrations</p>
            </div>
            <div class="d-flex gap-2">
                <a href="<?= APP_URL ?>/pages/registration.php" class="btn btn-primary btn-sm">
                    <i class="bi bi-person-plus me-1"></i> New Registration
                </a>
                <a href="<?= APP_URL ?>/pages/events.php" class="btn btn-outline-primary btn-sm">
                    <i class="bi bi-plus-lg me-1"></i> Add Event
                </a>
            </div>
        </div>

        <!-- Stat Cards -->
        <div class="row g-3 mb-4">
            <div class="col-6 col-md-4 col-xl-2">
                <div class="card stat-card h-100">
                    <div class="card-body d-flex align-items-center gap-3">
                        <div class="stat-icon bg-primary bg-opacity-10 text-primary">
                            <i class="bi bi-calendar3"></i>
                        </div>
                        <div>
                            <div class="text-muted small">Events</div>
                            <div class="fs-4 fw-bold" id="statTotalEvents">—</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-4 col-xl-2">
                <div class="card stat-card h-100">
                    <div class="card-body d-flex align-items-center gap-3">
                        <div class="stat-icon bg-success bg-opacity-10 text-success">
                            <i class="bi bi-people"></i>
                        </div>
                        <div>
                            <div class="text-muted small">Participants</div>
                            <div class="fs-4 fw-bold" id="statTotalParticipants">—</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-4 col-xl-2">
                <div class="card stat-card h-100">
                    <div class="card-body d-flex align-items-center gap-3">
                        <div class="stat-icon bg-info bg-opacity-10 text-info">
                            <i class="bi bi-person-check"></i>
                        </div>
                        <div>
                            <div class="text-muted small">Registrations</div>
                            <div class="fs-4 fw-bold" id="statTotalReg">—</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-4 col-xl-2">
                <div class="card stat-card h-100">
                    <div class="card-body d-flex align-items-center gap-3">
                        <div class="stat-icon bg-warning bg-opacity-10 text-warning">
                            <i class="bi bi-calendar-plus"></i>
                        </div>
                        <div>
                            <div class="text-muted small">Today Reg.</div>
                            <div class="fs-4 fw-bold" id="statTodayReg">—</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-4 col-xl-2">
                <div class="card stat-card h-100">
                    <div class="card-body d-flex align-items-center gap-3">
                        <div class="stat-icon bg-danger bg-opacity-10 text-danger">
                            <i class="bi bi-check2-square"></i>
                        </div>
                        <div>
                            <div class="text-muted small">Today Att.</div>
                            <div class="fs-4 fw-bold" id="statTodayAtt">—</div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="col-6 col-md-4 col-xl-2">
                <div class="card stat-card h-100">
                    <div class="card-body d-flex align-items-center gap-3">
                        <div class="stat-icon bg-secondary bg-opacity-10 text-secondary">
                            <i class="bi bi-unlock"></i>
                        </div>
                        <div>
                            <div class="text-muted small">Open Events</div>
                            <div class="fs-4 fw-bold" id="statOpenEvents">—</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Charts -->
        <div class="row g-3 mb-4">
            <div class="col-lg-7">
                <div class="card h-100">
                    <div class="card-header">Monthly Registrations</div>
                    <div class="card-body">
                        <canvas id="monthlyChart" height="200"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-lg-5">
                <div class="card h-100">
                    <div class="card-header">Event Participation</div>
                    <div class="card-body">
                        <canvas id="eventChart" height="200"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <!-- Recent Activity -->
        <div class="card">
            <div class="card-header d-flex justify-content-between align-items-center">
                <span>Recent Registrations</span>
                <a href="<?= APP_URL ?>/pages/registration.php" class="btn btn-sm btn-outline-primary">View All</a>
            </div>
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead>
                        <tr>
                            <th>Reg. Number</th>
                            <th>Participant</th>
                            <th>Event</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody id="recentActivityBody">
                        <tr><td colspan="4" class="text-center text-muted py-4">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
