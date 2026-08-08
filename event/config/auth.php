<?php
/**
 * Authentication & Authorization Middleware
 */

declare(strict_types=1);

require_once __DIR__ . '/constants.php';
require_once __DIR__ . '/database.php';

/**
 * Start secure session
 */
function startSecureSession(): void
{
    if (session_status() === PHP_SESSION_NONE) {
        session_name(SESSION_NAME);
        session_set_cookie_params([
            'lifetime' => SESSION_LIFETIME,
            'path'     => '/',
            'secure'   => isset($_SERVER['HTTPS']),
            'httponly' => true,
            'samesite' => 'Lax'
        ]);
        session_start();
    }
}

/**
 * Check if user is logged in
 */
function isAuthenticated(): bool
{
    startSecureSession();
    return isset($_SESSION['user_id']) && !empty($_SESSION['user_id']);
}

/**
 * Get current logged-in user
 */
function currentUser(): ?array
{
    if (!isAuthenticated()) {
        return null;
    }

    static $user = null;
    if ($user !== null) {
        return $user;
    }

    $pdo = getDB();
    $stmt = $pdo->prepare("
        SELECT u.id, u.username, u.email, u.full_name, u.phone, u.role_id, r.name AS role_name
        FROM users u
        JOIN roles r ON r.id = u.role_id
        WHERE u.id = ? AND u.is_active = 1
    ");
    $stmt->execute([$_SESSION['user_id']]);
    $user = $stmt->fetch() ?: null;

    return $user;
}

/**
 * Require authentication - redirect or JSON error
 */
function requireAuth(bool $isApi = false): void
{
    if (!isAuthenticated()) {
        if ($isApi) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Unauthorized. Please login.']);
            exit;
        }
        header('Location: ' . APP_URL . '/pages/login.php');
        exit;
    }
}

/**
 * Check if user has one of the allowed roles
 */
function hasRole(array $allowedRoleIds): bool
{
    $user = currentUser();
    if (!$user) {
        return false;
    }
    return in_array((int)$user['role_id'], $allowedRoleIds, true);
}

/**
 * Require specific roles
 */
function requireRole(array $allowedRoleIds, bool $isApi = false): void
{
    requireAuth($isApi);

    if (!hasRole($allowedRoleIds)) {
        if ($isApi) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'message' => 'Forbidden. Insufficient permissions.']);
            exit;
        }
        header('Location: ' . APP_URL . '/pages/dashboard.php?error=access_denied');
        exit;
    }
}

/**
 * Log activity
 */
function logActivity(string $action, ?string $entityType = null, ?int $entityId = null, ?string $description = null): void
{
    $user = currentUser();
    if (!$user) {
        return;
    }

    try {
        $pdo = getDB();
        $stmt = $pdo->prepare("
            INSERT INTO activity_logs (user_id, action, entity_type, entity_id, description, ip_address)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $user['id'],
            $action,
            $entityType,
            $entityId,
            $description,
            $_SERVER['REMOTE_ADDR'] ?? null
        ]);
    } catch (Exception $e) {
        error_log('Activity log failed: ' . $e->getMessage());
    }
}

/**
 * Generate CSRF token
 */
function generateCsrfToken(): string
{
    startSecureSession();
    if (empty($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Verify CSRF token
 */
function verifyCsrfToken(?string $token): bool
{
    startSecureSession();
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], (string)$token);
}

/**
 * JSON response helper
 */
function jsonResponse(array $data, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

/**
 * Sanitize string output
 */
function e(?string $value): string
{
    return htmlspecialchars((string)$value, ENT_QUOTES | ENT_HTML5, 'UTF-8');
}
