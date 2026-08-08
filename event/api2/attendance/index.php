<?php

/**
 * Attendance API
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/auth.php';

requireAuth(true);
requireRole([ROLE_SUPER_ADMIN, ROLE_ATTENDANCE, ROLE_REGISTRATION], true);

$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $eventId = (int)($_GET['event_id'] ?? 0);
    $dayId   = (int)($_GET['day_id'] ?? 0);
    $search  = trim($_GET['search'] ?? '');
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $limit   = min(100, max(5, (int)($_GET['limit'] ?? 20)));
    $offset  = ($page - 1) * $limit;

    $where = ['1=1'];
    $params = [];

    if ($eventId > 0) {
        $where[] = 'r.event_id = ?';
        $params[] = $eventId;
    }
    if ($dayId > 0) {
        $where[] = 'a.attendance_day_id = ?';
        $params[] = $dayId;
    }
    if ($search !== '') {
        $where[] = '(p.surname LIKE ? OR p.first_name LIKE ? OR p.other_name LIKE ? OR p.phone LIKE ?)';
        $like = "%{$search}%";
        $params = array_merge($params, [$like, $like, $like, $like]);
    }

    $whereSql = implode(' AND ', $where);

    $countSql = "
        SELECT COUNT(*) FROM attendance a
        JOIN registrations r ON r.id = a.registration_id
        JOIN participants p ON p.id = r.participant_id
        WHERE {$whereSql}
    ";
    $countStmt = $pdo->prepare($countSql);
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $sql = "
        SELECT a.*, r.registration_number, r.event_id,
               p.surname, p.first_name, p.other_name, p.phone, p.gender,
               ad.day_number, ad.day_date, ad.label AS day_label,
               e.name AS event_name
        FROM attendance a
        JOIN registrations r ON r.id = a.registration_id
        JOIN participants p ON p.id = r.participant_id
        JOIN events e ON e.id = r.event_id
        LEFT JOIN attendance_days ad ON ad.id = a.attendance_day_id
        WHERE {$whereSql}
        ORDER BY a.check_in DESC
        LIMIT {$limit} OFFSET {$offset}
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);

    jsonResponse([
        'success' => true,
        'data' => $stmt->fetchAll(),
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

    $searchTerm = trim($input['search_term'] ?? $input['name_or_phone'] ?? $input['registration_number'] ?? '');
    $regId      = (int)($input['registration_id'] ?? 0);
    $eventId    = (int)($input['event_id'] ?? 0);
    $dayId      = (int)($input['attendance_day_id'] ?? 0);
    $notes      = trim($input['notes'] ?? '');

    if ($eventId <= 0) {
        jsonResponse(['success' => false, 'message' => 'Please select an event first'], 422);
    }

    // Resolve registration
    if ($regId <= 0 && $searchTerm !== '') {
        $isPhone = preg_match('/^\d+$/', $searchTerm) === 1;

        if ($isPhone) {
            $stmt = $pdo->prepare(
                "SELECT r.id, r.event_id FROM registrations r
                 JOIN participants p ON p.id = r.participant_id
                 WHERE r.event_id = ? AND r.status = 'confirmed' AND p.phone = ?"
            );
            $stmt->execute([$eventId, $searchTerm]);
        } else {
            $stmt = $pdo->prepare(
                "SELECT r.id, r.event_id FROM registrations r
                 JOIN participants p ON p.id = r.participant_id
                 WHERE r.event_id = ? AND r.status = 'confirmed'
                 AND LOWER(CONCAT_WS(' ', p.surname, p.first_name, p.other_name)) LIKE ?"
            );
            $stmt->execute([$eventId, '%' . strtolower($searchTerm) . '%']);
        }

        $matches = $stmt->fetchAll();
        if (!$matches) {
            jsonResponse(['success' => false, 'message' => 'No matching participant found for this event'], 404);
        }
        if (count($matches) > 1) {
            jsonResponse(['success' => false, 'message' => 'Multiple matches found. Please use a phone number or a more specific name'], 409);
        }

        $regId = (int)$matches[0]['id'];
    }

    if ($regId <= 0) {
        jsonResponse(['success' => false, 'message' => 'Participant is required'], 422);
    }

    $regStmt = $pdo->prepare("
        SELECT r.*, e.is_multi_day, e.name AS event_name
        FROM registrations r
        JOIN events e ON e.id = r.event_id
        WHERE r.id = ?
    ");
    $regStmt->execute([$regId]);
    $registration = $regStmt->fetch();

    if (!$registration) {
        jsonResponse(['success' => false, 'message' => 'Registration not found'], 404);
    }

    // For multi-day, day is required
    if ((int)$registration['is_multi_day'] === 1 && $dayId <= 0) {
        // Try to get today's day
        $today = date('Y-m-d');
        $dayStmt = $pdo->prepare("SELECT id FROM attendance_days WHERE event_id = ? AND day_date = ?");
        $dayStmt->execute([$registration['event_id'], $today]);
        $todayDay = $dayStmt->fetch();
        if ($todayDay) {
            $dayId = (int)$todayDay['id'];
        } else {
            jsonResponse(['success' => false, 'message' => 'Please select an attendance day for this multi-day event'], 422);
        }
    }

    $user = currentUser();

    // Check existing attendance record
    $existSql = "SELECT * FROM attendance WHERE registration_id = ?";
    $existParams = [$regId];
    if ($dayId > 0) {
        $existSql .= " AND attendance_day_id = ?";
        $existParams[] = $dayId;
    } else {
        $existSql .= " AND attendance_day_id IS NULL";
    }

    $existStmt = $pdo->prepare($existSql);
    $existStmt->execute($existParams);
    $existing = $existStmt->fetch();

    if ($existing && $existing['check_in']) {
        jsonResponse(['success' => false, 'message' => 'Already checked in'], 409);
    }

    if ($existing) {
        $pdo->prepare("UPDATE attendance SET check_in = NOW(), recorded_by = ?, notes = ? WHERE id = ?")
            ->execute([$user['id'], $notes ?: null, $existing['id']]);
        $attId = (int)$existing['id'];
    } else {
        $pdo->prepare("
            INSERT INTO attendance (registration_id, attendance_day_id, check_in, recorded_by, method, notes)
            VALUES (?, ?, NOW(), ?, 'manual', ?)
        ")->execute([$regId, $dayId ?: null, $user['id'], $notes ?: null]);
        $attId = (int)$pdo->lastInsertId();
    }

    logActivity('check_in', 'attendance', $attId, "Check-in for reg #{$registration['registration_number']}");

    jsonResponse([
        'success' => true,
        'message' => 'Check-in recorded successfully',
        'data' => ['id' => $attId, 'action' => 'check_in']
    ]);
}

jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
