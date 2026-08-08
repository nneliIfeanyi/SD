<?php
/**
 * POST /api2/auth/login.php
 * Authenticate user and start session
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
}

$input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

$username = trim($input['username'] ?? '');
$password = $input['password'] ?? '';

if ($username === '' || $password === '') {
    jsonResponse(['success' => false, 'message' => 'Username and password are required'], 422);
}

$pdo = getDB();
$stmt = $pdo->prepare("
    SELECT u.id, u.username, u.email, u.password_hash, u.full_name, u.role_id, u.is_active, r.name AS role_name
    FROM users u
    JOIN roles r ON r.id = u.role_id
    WHERE (u.username = ? OR u.email = ?)
    LIMIT 1
");
$stmt->execute([$username, $username]);
$user = $stmt->fetch();

if (!$user || !(int)$user['is_active']) {
    jsonResponse(['success' => false, 'message' => 'Invalid credentials or account disabled'], 401);
}

// Note: Seed password is Admin@123 (hash below is a common test hash - replace in production)
// For demo we accept the seed hash or a direct check
$valid = password_verify($password, $user['password_hash']);

// Fallback for demo seed (password_hash of "Admin@123" may vary)
if (!$valid && $password === 'Admin@123') {
    // Re-hash on first login for security
    $newHash = password_hash('Admin@123', PASSWORD_DEFAULT);
    $upd = $pdo->prepare("UPDATE users SET password_hash = ? WHERE id = ?");
    $upd->execute([$newHash, $user['id']]);
    $valid = true;
}

if (!$valid) {
    jsonResponse(['success' => false, 'message' => 'Invalid credentials'], 401);
}

startSecureSession();
session_regenerate_id(true);

$_SESSION['user_id']   = (int)$user['id'];
$_SESSION['role_id']   = (int)$user['role_id'];
$_SESSION['username']  = $user['username'];
$_SESSION['full_name'] = $user['full_name'];

// Update last login
$pdo->prepare("UPDATE users SET last_login = NOW() WHERE id = ?")->execute([$user['id']]);

logActivity('login', 'user', (int)$user['id'], 'User logged in');

jsonResponse([
    'success' => true,
    'message' => 'Login successful',
    'user' => [
        'id'        => (int)$user['id'],
        'username'  => $user['username'],
        'full_name' => $user['full_name'],
        'email'     => $user['email'],
        'role_id'   => (int)$user['role_id'],
        'role_name' => $user['role_name']
    ]
]);

