<?php
require_once __DIR__ . '/../config/auth.php';
requireAuth();
requireRole([ROLE_SUPER_ADMIN, ROLE_REGISTRATION]);

$pageTitle = 'Participants';
$pageScript = 'participants.js';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
?>
<div id="page-content-wrapper">
    <?php require_once __DIR__ . '/../includes/navbar.php'; ?>

    <div class="container-fluid p-4">
        <div class="page-header d-flex flex-wrap justify-content-between align-items-center gap-2">
            <div>
                <h4 class="mb-0">Participants</h4>
                <p class="text-muted small mb-0">Master participant records</p>
            </div>
            <button class="btn btn-primary" id="btnAddParticipant">
                <i class="bi bi-person-plus me-1"></i> Add Participant
            </button>
        </div>

        <div class="card mb-3">
            <div class="card-body py-2">
                <div class="row g-2">
                    <div class="col-md-5">
                        <div class="input-group input-group-sm">
                            <span class="input-group-text"><i class="bi bi-search"></i></span>
                            <input type="text" class="form-control" id="searchParticipants" placeholder="Search name, phone, email...">
                        </div>
                    </div>
                    <div class="col-md-3">
                        <select class="form-select form-select-sm" id="filterGender">
                            <option value="">All Genders</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>

        <div class="card">
            <div class="table-responsive">
                <table class="table table-hover mb-0">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Gender</th>
                            <th>Phone</th>
                            <th>Email</th>
                            <th>Church</th>
                            <th>State</th>
                            <th>Regs</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody id="participantsTableBody">
                        <tr><td colspan="8" class="text-center text-muted py-4">Loading...</td></tr>
                    </tbody>
                </table>
            </div>
            <div class="card-footer">
                <ul class="pagination pagination-sm mb-0 justify-content-center" id="participantsPagination"></ul>
            </div>
        </div>
    </div>
</div>

<!-- Add/Edit Modal -->
<div class="modal fade" id="participantModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <form id="participantForm">
                <div class="modal-header">
                    <h5 class="modal-title" id="participantModalTitle">Add Participant</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <input type="hidden" id="participantId">
                    <div class="row g-3">
                        <div class="col-md-4">
                            <label class="form-label">Surname *</label>
                            <input type="text" class="form-control" id="pSurname" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">First Name *</label>
                            <input type="text" class="form-control" id="pFirstName" required>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Other Name</label>
                            <input type="text" class="form-control" id="pOtherName">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Gender *</label>
                            <select class="form-select" id="pGender" required>
                                <option value="">Select</option>
                                <option value="Male">Male</option>
                                <option value="Female">Female</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Date of Birth</label>
                            <input type="date" class="form-control" id="pDob">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Phone *</label>
                            <input type="tel" class="form-control" id="pPhone" required>
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Email</label>
                            <input type="email" class="form-control" id="pEmail">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Church</label>
                            <input type="text" class="form-control" id="pChurch">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">Occupation</label>
                            <input type="text" class="form-control" id="pOccupation">
                        </div>
                        <div class="col-md-6">
                            <label class="form-label">State</label>
                            <input type="text" class="form-control" id="pState">
                        </div>
                        <div class="col-12">
                            <label class="form-label">Address</label>
                            <textarea class="form-control" id="pAddress" rows="2"></textarea>
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Country</label>
                            <input type="text" class="form-control" id="pCountry" value="Nigeria">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Emergency Contact Name</label>
                            <input type="text" class="form-control" id="pEmName">
                        </div>
                        <div class="col-md-4">
                            <label class="form-label">Emergency Contact Phone</label>
                            <input type="tel" class="form-control" id="pEmPhone">
                        </div>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="submit" class="btn btn-primary">Save</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- View Modal -->
<div class="modal fade" id="viewParticipantModal" tabindex="-1">
    <div class="modal-dialog modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Participant Profile</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
            </div>
            <div class="modal-body" id="viewParticipantBody"></div>
        </div>
    </div>
</div>

<?php require_once __DIR__ . '/../includes/footer.php'; ?>
