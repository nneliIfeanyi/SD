<?php
require_once __DIR__ . '/../config/auth.php';
requireAuth();
requireRole([ROLE_SUPER_ADMIN]);

$pageTitle = 'Settings';
$pageScript = 'settings.js';
require_once __DIR__ . '/../includes/header.php';
require_once __DIR__ . '/../includes/sidebar.php';
?>
<div id="page-content-wrapper">
    <?php require_once __DIR__ . '/../includes/navbar.php'; ?>

    <div class="container-fluid p-4">
        <div class="page-header">
            <h4 class="mb-0">Settings</h4>
            <p class="text-muted small mb-0">Organization profile and system settings</p>
        </div>

        <div class="row g-4">
            <div class="col-lg-8">
                <div class="card">
                    <div class="card-header">Organization Profile</div>
                    <div class="card-body">
                        <form id="orgForm">
                            <div class="row g-3">
                                <div class="col-12">
                                    <label class="form-label">Organization Name *</label>
                                    <input type="text" class="form-control" id="orgName" required>
                                </div>
                                <div class="col-12">
                                    <label class="form-label">Address</label>
                                    <textarea class="form-control" id="orgAddress" rows="2"></textarea>
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Phone</label>
                                    <input type="text" class="form-control" id="orgPhone">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Email</label>
                                    <input type="email" class="form-control" id="orgEmail">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Website</label>
                                    <input type="url" class="form-control" id="orgWebsite" placeholder="https://">
                                </div>
                                <div class="col-md-6">
                                    <label class="form-label">Default Theme</label>
                                    <select class="form-select" id="orgTheme">
                                        <option value="light">Light</option>
                                        <option value="dark">Dark</option>
                                        <option value="auto">Auto</option>
                                    </select>
                                </div>
                                <div class="col-12">
                                    <button type="submit" class="btn btn-primary">Save Changes</button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            <div class="col-lg-4">
                <div class="card">
                    <div class="card-header">System Info</div>
                    <div class="card-body">
                        <dl class="row mb-0 small">
                            <dt class="col-5">App Version</dt>
                            <dd class="col-7"><?= APP_VERSION ?></dd>
                            <dt class="col-5">PHP</dt>
                            <dd class="col-7"><?= PHP_VERSION ?></dd>
                            <dt class="col-5">Server</dt>
                            <dd class="col-7"><?= e($_SERVER['SERVER_SOFTWARE'] ?? 'N/A') ?></dd>
                        </dl>
                    </div>
                </div>
                <div class="card mt-3">
                    <div class="card-header">Demo Credentials</div>
                    <div class="card-body small">
                        <p class="mb-1">Password for all: <code>Admin@123</code></p>
                        <ul class="mb-0">
                            <li>superadmin</li>
                            <li>regofficer</li>
                            <li>attofficer</li>
                            <li>reportofficer</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<?php require_once __DIR__ . '/../includes/footer.php'; ?>
