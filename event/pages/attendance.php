<?php
require_once __DIR__ . '/../config/auth.php';
requireAuth();
requireRole([ROLE_SUPER_ADMIN, ROLE_ATTENDANCE, ROLE_REGISTRATION]);

$pageTitle = 'Attendance';
$pageScript = 'attendance.js';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
?>
<div id="page-content-wrapper">
    <?php require_once __DIR__ . '/../includes/navbar.php'; ?>

    <div class="container-fluid p-4">
        <div class="page-header">
            <h4 class="mb-0">Attendance</h4>
            <p class="text-muted small mb-0">Check-in participants</p>
        </div>

        <!-- Quick Check-in Panel -->
        <div class="card mb-3 border-primary">
            <div class="card-body">
                <div class="row g-2 align-items-end">
                    <div class="col-md-3">
                        <label class="form-label small">Event</label>
                        <select class="form-select" id="attSelectEvent">
                            <option value="">— Select Event —</option>
                        </select>
                    </div>
                    <div class="col-md-2 d-none" id="daySelectWrap">
                        <label class="form-label small">Day</label>
                        <select class="form-select" id="attSelectDay"></select>
                    </div>
                    <div class="col-md-5 position-relative">
                        <label class="form-label small">Name or Phone</label>
                        <input type="text" class="form-control" id="attLookup" placeholder="Type a name or phone number" autocomplete="off" autofocus>
                        <input type="hidden" id="attSelectedRegistrationId" value="">
                        <div id="attLookupSuggestions" class="list-group position-absolute w-100 shadow-sm d-none" style="z-index: 1050; max-height: 220px; overflow-y: auto; top: 100%; left: 0; margin-top: 2px;"></div>
                    </div>
                    <div class="col-md-3 d-flex gap-2">
                        <button class="btn btn-success flex-fill" id="btnCheckIn">
                            <i class="bi bi-box-arrow-in-right me-1"></i> Check In
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <div class="card mb-3">
            <div class="card-body py-2">
                <div class="input-group input-group-sm" style="max-width: 320px;">
                    <span class="input-group-text"><i class="bi bi-search"></i></span>
                    <input type="text" class="form-control" id="searchAtt" placeholder="Search by name or phone">
                </div>
            </div>
        </div>

        <div class="card">
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead>
                        <tr>
                            <th>Reg. Number</th>
                            <th>Name</th>
                            <th>Phone</th>
                            <th>Day</th>
                            <th>Check In</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="attendanceTableBody">
                        <tr>
                            <td colspan="6" class="text-center text-muted py-4">Select an event</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>