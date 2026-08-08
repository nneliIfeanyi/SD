<?php
require_once __DIR__ . '/../config/auth.php';
requireAuth();
requireRole([ROLE_SUPER_ADMIN, ROLE_REGISTRATION]);

$pageTitle = 'Events';
$pageScript = 'events.js';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
?>
<div id="page-content-wrapper">
    <?php require_once __DIR__ . '/../includes/navbar.php'; ?>

    <div class="container-fluid p-4">
        <div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
                <h4 class="mb-0">Events</h4>
                <p class="text-muted small mb-0">Manage all events</p>
            </div>
            <button class="btn btn-primary" id="btnAddEvent">
                <i class="bi bi-plus-lg me-1"></i> Add Event
            </button>
        </div>

        <!-- Filters -->
        <div class="card mb-3">
            <div class="card-body py-2">
                <div class="row g-2 align-items-center">
                    <div class="col-md-5">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input type="text" class="form-control" id="searchEvents" placeholder="Search events...">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select form-select-sm" id="filterStatus">
                            <option value="">All Statuses</option>
                            <option value="open">Open</option>
                            <option value="draft">Draft</option>
                            <option value="closed">Closed</option>
                            <option value="archived">Archived</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <!-- Card Grid -->
        <div class="row g-3 mb-4" id="eventsContainer">
            <div class="col-12 text-center py-5 text-muted">Loading events...</div>
        </div>

        <!-- Table view -->
        <div class="card">
            <div class="card-header">Events List</div>
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Venue</th>
                            <th>Dates</th>
                            <th>Status</th>
                            <th>Registered</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="eventsTableBody"></tbody>
                </table>
            </div>
            <div class="card-footer">
                <ul class="pagination pagination-sm mb-0 justify-content-center" id="eventsPagination"></ul>
            </div>
        </div>
    </div>
</div>

<!-- Event Modal -->
<div class="modal fade" id="eventModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <form id="eventForm">
                <div class="modal-header">
                    <h5 class="modal-title" id="eventModalTitle">Add Event</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="eventId">
                    <div class="row g-3">
                        <div class="col-12">
                            <label class="form-label">Event Name *</label>
                            <input type="text" class="form-control" id="eventName" required>
                        </div>
                        <div class="col-12">
                            <label class="form-label">Description</label>
                            <textarea class="form-control" id="eventDescription" rows="2"></textarea>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Venue</label>
                            <input type="text" class="form-control" id="eventVenue">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Status</label>
                            <select class="form-select" id="eventStatus">
                                <option value="draft">Draft</option>
                                <option value="open">Open</option>
                                <option value="closed">Closed</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Start Date *</label>
                            <input type="date" class="form-control" id="eventStart" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">End Date *</label>
                            <input type="date" class="form-control" id="eventEnd" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Registration Opens</label>
                            <input type="date" class="form-control" id="eventRegOpen">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Registration Closes</label>
                            <input type="date" class="form-control" id="eventRegClose">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save Event</button>
                </div>
            </form>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
