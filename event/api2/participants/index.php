<?php

/**
 * Participants API - List & Create
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/auth.php';

requireAuth(true);
requireRole([ROLE_SUPER_ADMIN, ROLE_REGISTRATION, ROLE_ATTENDANCE], true);

$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $search = trim($_GET['search'] ?? '');
    $gender = $_GET['gender'] ?? null;
    $state  = trim($_GET['state'] ?? '');
    $page   = max(1, (int)($_GET['page'] ?? 1));
    $limit  = min(50, max(5, (int)($_GET['limit'] ?? DEFAULT_PER_PAGE)));
    $offset = ($page - 1) * $limit;

    $where = ['1=1'];
    $params = [];

    if ($search !== '') {
        $where[] = '(p.surname LIKE ? OR p.first_name LIKE ? OR p.other_name LIKE ? OR p.phone LIKE ? OR p.email LIKE ?)';
        $like = "%{$search}%";
        $params = array_merge($params, [$like, $like, $like, $like, $like]);
    }
    if ($gender && in_array($gender, ['Male', 'Female'], true)) {
        $where[] = 'p.gender = ?';
        $params[] = $gender;
    }
    if ($state !== '') {
        $where[] = 'p.state LIKE ?';
        $params[] = "%{$state}%";
    }

    $whereSql = implode(' AND ', $where);

    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM participants p WHERE {$whereSql}");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $sql = "
        SELECT p.*,
               (SELECT COUNT(*) FROM registrations r WHERE r.participant_id = p.id) AS registration_count
        FROM participants p
        WHERE {$whereSql}
        ORDER BY p.surname, p.first_name
        LIMIT {$limit} OFFSET {$offset}
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'data' => $rows,
        'meta' => [
            'total' => $total,
            'page'  => $page,
            'limit' => $limit,
            'pages' => (int)ceil($total / max(1, $limit))
        ]
    ]);
}

if ($method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $surname   = trim($input['surname'] ?? '');
    $firstName = trim($input['first_name'] ?? '');
    $otherName = trim($input['other_name'] ?? '');
    $gender    = $input['gender'] ?? '';
    $dob       = $input['date_of_birth'] ?? null;
    $phone     = trim($input['phone'] ?? '');
    $email     = trim($input['email'] ?? '');
    $church    = trim($input['church'] ?? '');
    $occupation = trim($input['occupation'] ?? '');
    $address   = trim($input['address'] ?? '');
    $state     = trim($input['state'] ?? '');
    $country   = trim($input['country'] ?? 'Nigeria');
    $emName    = trim($input['emergency_contact_name'] ?? '');
    $emPhone   = trim($input['emergency_contact_phone'] ?? '');

    if ($surname === '' || $firstName === '' || $phone === '' || !in_array($gender, ['Male', 'Female'], true)) {
        jsonResponse(['success' => false, 'message' => 'Surname, first name, phone and gender are required'], 422);
    }

    // Check duplicate phone
    $check = $pdo->prepare("SELECT id FROM participants WHERE phone = ?");
    $check->execute([$phone]);
    if ($check->fetch()) {
        jsonResponse(['success' => false, 'message' => 'A participant with this phone number already exists'], 409);
    }

    $stmt = $pdo->prepare("
        INSERT INTO participants (
            surname, first_name, other_name, gender, date_of_birth, phone, email,
            church, occupation, address, state, country,
            emergency_contact_name, emergency_contact_phone
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    ");
    $stmt->execute([
        $surname,
        $firstName,
        $otherName ?: null,
        $gender,
        $dob ?: null,
        $phone,
        $email ?: null,
        $church ?: null,
        $occupation ?: null,
        $address ?: null,
        $state ?: null,
        $country,
        $emName ?: null,
        $emPhone ?: null
    ]);

    $id = (int)$pdo->lastInsertId();
    logActivity('create_participant', 'participant', $id, "Added participant: {$surname} {$firstName}");

    jsonResponse([
        'success' => true,
        'message' => 'Participant created successfully',
        'data' => ['id' => $id]
    ], 201);
}

jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
