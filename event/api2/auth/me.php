<?php
/**
 * GET /api2/auth/me.php
 * Return current authenticated user
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/auth.php';

requireAuth(true);

$user = currentUser();
if (!$user) {
    jsonResponse(['success' => false, 'message' => 'User not found'], 404);
}

jsonResponse([
    'success' => true,
    'user' => $user
]);

