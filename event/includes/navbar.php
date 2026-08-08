<?php $user = currentUser(); ?>
<!-- Top Navbar -->
<nav class="navbar navbar-expand navbar-light bg-white border-bottom sticky-top px-3">
    <div class="container-fluid">
        <button class="btn btn-link text-dark d-lg-none me-2" id="sidebarToggle" type="button">
            <i class="bi bi-list fs-4"></i>
        </button>

        <span class="navbar-brand mb-0 h1 d-none d-md-block fs-5 text-muted">
            <?= e($pageTitle ?? 'Dashboard') ?>
        </span>

        <div class="ms-auto d-flex align-items-center gap-3">
            <!-- Theme toggle -->
            <button class="btn btn-sm btn-outline-secondary" id="themeToggle" title="Toggle theme">
                <i class="bi bi-moon-stars" id="themeIcon"></i>
            </button>

            <!-- User dropdown -->
            <div class="dropdown">
                <button class="btn btn-sm btn-light dropdown-toggle d-flex align-items-center gap-2" type="button" data-bs-toggle="dropdown">
                    <span class="avatar-circle-sm bg-primary text-white d-flex align-items-center justify-content-center">
                        <?= strtoupper(substr($user['full_name'] ?? 'U', 0, 1)) ?>
                    </span>
                    <span class="d-none d-md-inline small"><?= e($user['full_name'] ?? '') ?></span>
                </button>
                <ul class="dropdown-menu dropdown-menu-end shadow">
                    <li>
                        <h6 class="dropdown-header">
                            <button type="button" class="btn btn-link p-0 text-decoration-none text-dark" data-bs-toggle="modal" data-bs-target="#roleGuideModal">
                                <?= e($user['role_name'] ?? '') ?>
                            </button>
                        </h6>
                    </li>
                    <li><a class="dropdown-item" href="<?= APP_URL ?>/pages/settings.php"><i class="bi bi-person me-2"></i>Profile</a></li>
                    <li>
                        <hr class="dropdown-divider">
                    </li>
                    <li><a class="dropdown-item text-danger" href="#" id="navLogoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                </ul>
            </div>
        </div>
    </div>
</nav>

<div class="modal fade" id="roleGuideModal" tabindex="-1" aria-labelledby="roleGuideModalLabel" aria-hidden="true">
    <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="roleGuideModalLabel">Quick guide for the front desk</h5>
                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <p class="text-muted mb-3">This guide is written for a front desk officer using the system.</p>

                <h6>1. What is a participant?</h6>
                <p class="mb-3">A participant is the person’s personal record in the system. This includes the person’s name, phone number, gender, address, and contact details.</p>

                <h6>2. What is a registration?</h6>
                <p class="mb-3">A registration means that this person has signed up for a specific event. It is event-based, so one person can have many registrations for different events.</p>

                <h6>3. What you will usually do</h6>
                <ol class="mb-3">
                    <li>Open the Registration page.</li>
                    <li>Choose the event.</li>
                    <li>Search for the person first. If the person already exists, use the existing record.</li>
                    <li>If the person is new, create a participant profile first, then register them for the event.</li>
                    <li>Confirm the details before saving.</li>
                </ol>

                <h6>4. Pages you may use</h6>
                <ul class="mb-3">
                    <li><strong>Dashboard:</strong> view the overall summary of events and registrations.</li>
                    <li><strong>Registration:</strong> register people for events.</li>
                    <li><strong>Participants:</strong> view and manage person records.</li>
                    <li><strong>Attendance:</strong> mark people as present or absent.</li>
                    <li><strong>Reports:</strong> view event and registration reports.</li>
                </ul>

                <h6>5. Helpful tips</h6>
                <ul class="mb-0">
                    <li>Always double-check the phone number and event name before saving.</li>
                    <li>If a person has attended before, do not create a new profile unless the old record is wrong.</li>
                    <li>Use the search box first to avoid duplicate records.</li>
                    <li>If you are unsure, ask the supervisor before changing a participant’s information.</li>
                </ul>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
        </div>
    </div>
</div>