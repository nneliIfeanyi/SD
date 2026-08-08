<?php
/**
 * POST /api2/auth/logout.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/auth.php';

startSecureSession();

if (isAuthenticated()) {
    logActivity('logout', 'user', (int)$_SESSION['user_id'], 'User logged out');
}

$_SESSION = [];
if (ini_get('session.use_cookies')) {
    $params = session_get_cookie_params();
    setcookie(session_name(), '', time() - 42000,
        $params['path'], $params['domain'],
        $params['secure'], $params['httponly']
    );
}
session_destroy();

jsonResponse(['success' => true, 'message' => 'Logged out successfully']);

