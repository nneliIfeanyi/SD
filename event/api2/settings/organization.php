<?php
/**
 * Organization Settings API
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/auth.php';

requireAuth(true);

$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->query("SELECT * FROM organization WHERE id = 1");
    $org = $stmt->fetch() ?: [
        'name' => 'Organization',
        'logo' => null,
        'address' => '',
        'phone' => '',
        'email' => '',
        'website' => '',
        'theme' => 'light'
    ];
    jsonResponse(['success' => true, 'data' => $org]);
}

if ($method === 'PUT' || $method === 'POST') {
    requireRole([ROLE_SUPER_ADMIN], true);

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $name    = trim($input['name'] ?? '');
    $address = trim($input['address'] ?? '');
    $phone   = trim($input['phone'] ?? '');
    $email   = trim($input['email'] ?? '');
    $website = trim($input['website'] ?? '');
    $theme   = $input['theme'] ?? 'light';

    if ($name === '') {
        jsonResponse(['success' => false, 'message' => 'Organization name is required'], 422);
    }

    if (!in_array($theme, ['light','dark','auto'], true)) {
        $theme = 'light';
    }

    $stmt = $pdo->prepare("
        INSERT INTO organization (id, name, address, phone, email, website, theme)
        VALUES (1, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE
            name = VALUES(name),
            address = VALUES(address),
            phone = VALUES(phone),
            email = VALUES(email),
            website = VALUES(website),
            theme = VALUES(theme)
    ");
    $stmt->execute([$name, $address, $phone, $email, $website, $theme]);

    logActivity('update_organization', 'organization', 1, 'Updated organization profile');

    jsonResponse(['success' => true, 'message' => 'Organization settings updated']);
}

jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
