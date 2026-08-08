<?php
require_once __DIR__ . '/../config/auth.php';
requireAuth();
requireRole([ROLE_SUPER_ADMIN, ROLE_REGISTRATION, ROLE_ATTENDANCE]);

$pageTitle = 'Registration';
$pageScript = 'registration.js';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
?>
<div id="page-content-wrapper">
    <?php require_once __DIR__ . '/../includes/navbar.php'; ?>

    <div class="container-fluid p-4">
        <div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
                <h4 class="mb-0">Registration</h4>
                <p class="text-muted small mb-0">Register participants for events</p>
            </div>
            <button class="btn btn-primary" id="btnNewRegistration">
                <i class="bi bi-person-plus me-1"></i> New Registration
            </button>
        </div>

        <div class="card mb-3">
            <div class="card-body py-2">
                <div class="row g-2 align-items-center">
                    <div class="col-md-4">
                        <select class="form-select form-select-sm" id="selectEvent">
                            <option value="">— Select Event —</option>
                        </select>
                    </div>
                    <div class="col-md-4">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input type="text" class="form-control" id="searchReg" placeholder="Search registrations...">
                        </div>
                    </div>
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
                            <th>Gender</th>
                            <th>Phone</th>
                            <th>Church</th>
                            <th>Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody id="registrationsTableBody">
                        <tr>
                            <td colspan="7" class="text-center text-muted py-4">Select an event</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="card-footer">
                <ul class="pagination pagination-sm mb-0 justify-content-center" id="regPagination"></ul>
            </div>
        </div>
    </div>
</div>

<!-- Registration Modal -->
<div class="modal fade" id="registrationModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <form id="registrationForm">
                <div class="modal-header">
                    <h5 class="modal-title">New Registration</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="regEventId">
                    <input type="hidden" id="selectedParticipantId">

                    <div class="mb-3">
                        <div class="btn-group w-100" role="group">
                            <input type="radio" class="btn-check" name="participantMode" id="modeExisting" value="existing" checked>
                            <label class="btn btn-outline-primary" for="modeExisting">Existing Participant</label>
                            <input type="radio" class="btn-check" name="participantMode" id="modeNew" value="new">
                            <label class="btn btn-outline-primary" for="modeNew">New Participant</label>
                        </div>
                    </div>

                    <div id="existingParticipantSection">
                        <label class="form-label">Search Participant</label>
                        <input type="text" class="form-control" id="searchExistingParticipant" placeholder="Type name or phone...">
                        <div class="list-group mt-2" id="participantSearchResults"></div>
                    </div>

                    <div id="newParticipantSection" class="d-none">
                        <div class="row g-3">
                            <div class="col-md-4">
                                <label class="form-label">Surname *</label>
                                <input type="text" class="form-control" id="regSurname">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">First Name *</label>
                                <input type="text" class="form-control" id="regFirstName">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Other Name</label>
                                <input type="text" class="form-control" id="regOtherName">
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Gender *</label>
                                <select class="form-select" id="regGender">
                                    <option value="">Select</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <div class="col-md-4">
                                <label class="form-label">Phone *</label>
                                <input type="tel" class="form-control" id="regPhone">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">Church</label>
                                <input type="text" class="form-control" id="regChurch">
                            </div>
                            <div class="col-md-6">
                                <label class="form-label">State</label>
                                <input type="text" class="form-control" id="regState">
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Register</button>
                </div>
            </form>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>