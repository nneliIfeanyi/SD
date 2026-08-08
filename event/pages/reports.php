<?php
require_once __DIR__ . '/../config/auth.php';
requireAuth();
requireRole([ROLE_SUPER_ADMIN, ROLE_REPORTS, ROLE_REGISTRATION]);

$pageTitle = 'Reports';
$pageScript = 'reports.js';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
?>
<div id="page-content-wrapper">
    <?php require_once __DIR__ . '/../includes/navbar.php'; ?>

    <div class="container-fluid p-4">
        <div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
                <h4 class="mb-0">Reports & Analytics</h4>
                <p class="text-muted small mb-0">Insights and exports</p>
            </div>
            <div class="d-flex gap-2 align-items-center">
                <select class="form-select form-select-sm" id="reportEventFilter" style="width: auto;">
                    <option value="">All Events</option>
                </select>
            </div>
        </div>

        <div class="row g-3 mb-4">
            <div class="col-md-5">
                <div class="card h-100">
                    <div class="card-header">Gender Distribution</div>
                    <div class="card-body d-flex justify-content-center">
                        <canvas id="genderChart" style="max-height: 260px;"></canvas>
                    </div>
                </div>
            </div>
            <div class="col-md-7">
                <div class="card h-100">
                    <div class="card-header">State Distribution</div>
                    <div class="card-body">
                        <canvas id="stateChart" height="220"></canvas>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="card-header d-flex flex-wrap justify-content-between align-items-center gap-2">
                <span>Event Registrations Report</span>
                <div class="d-flex gap-2">
                    <select class="form-select form-select-sm" id="exportEventSelect" style="width: auto;"></select>
                    <button class="btn btn-sm btn-outline-primary" id="btnLoadEventReport">Load</button>
                    <button class="btn btn-sm btn-success" id="btnExportRegistrations">
                        <i class="bi bi-download me-1"></i> Export CSV
                    </button>
                </div>
            </div>
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead>
                        <tr>
                            <th>Reg. Number</th>
                            <th>Name</th>
                            <th>Gender</th>
                            <th>Phone</th>
                            <th>Church</th>
                            <th>State</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody id="eventReportBody">
                        <tr><td colspan="7" class="text-center text-muted py-4">Select an event and click Load</td></tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
