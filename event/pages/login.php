<?php
require_once __DIR__ . '/../config/constants.php';
require_once __DIR__ . '/../config/auth.php';

startSecureSession();
if (isAuthenticated()) {
    header('Location: ' . APP_URL . '/pages/dashboard.php');
    exit;
}
?>
<!DOCTYPE html>
<html lang="en" data-bs-theme="light">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login | <?= e(APP_NAME) ?></title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css" rel="stylesheet">
    <link href="<?= APP_URL ?>/assets/css/style.css" rel="stylesheet">
</head>

<body class="login-page">
    <div class="login-card card border-0">
        <div class="card-body p-4 p-md-5">
            <div class="text-center mb-4">
                <i class="bi bi-calendar-event text-primary" style="font-size: 2.5rem;"></i>
                <h3 class="mt-2 mb-1 fw-bold">Event Admin</h3>
                <p class="text-muted small">Event Registration & Management</p>
            </div>

            <form id="loginForm">
                <div class="mb-3">
                    <label class="form-label" for="username">Username or Email</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-person"></i></span>
                        <input type="text" class="form-control" id="username" name="username" required autofocus
                            placeholder="superadmin" autocomplete="username">
                    </div>
                </div>
                <div class="mb-4">
                    <label class="form-label" for="password">Password</label>
                    <div class="input-group">
                        <span class="input-group-text"><i class="bi bi-lock"></i></span>
                        <input type="password" class="form-control" id="password" name="password" required
                            placeholder="••••••••" autocomplete="current-password">
                    </div>
                </div>
                <button type="submit" class="btn btn-primary w-100 py-2" id="loginBtn">
                    <span id="loginSpinner" class="spinner-border spinner-border-sm d-none me-2"></span>
                    Sign In
                </button>
            </form>

            <!-- <div class="mt-4 p-3 bg-light rounded small">
                <strong>Demo Accounts</strong> (password: <code>Admin@123</code>)
                <ul class="mb-0 mt-1">
                    <li>superadmin — Full access</li>
                    <li>regofficer — Registration</li>
                    <li>attofficer — Attendance</li>
                    <li>reportofficer — Reports</li>
                </ul>
            </div> -->
        </div>
    </div>

    <div class="toast-container position-fixed bottom-0 end-0 p-3" id="toastContainer"></div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
    <script>
        window.APP_URL = '<?= APP_URL ?>';
    </script>
    <script type="module" src="<?= APP_URL ?>/assets/js/auth.js"></script>
</body>

</html>