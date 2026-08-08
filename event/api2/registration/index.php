<?php

/**
 * Registration API
 * POST - Register participant to event
 * GET  - List registrations for an event
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/auth.php';

requireAuth(true);
requireRole([ROLE_SUPER_ADMIN, ROLE_REGISTRATION, ROLE_ATTENDANCE], true);

$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];

/**
 * Generate unique registration number
 * Format: EVT{YEAR}-{EVENTID}-{SEQ}
 */
function generateRegNumber(PDO $pdo, int $eventId): string
{
    $year = date('Y');
    $prefix = "EVT{$year}-" . str_pad((string)$eventId, 3, '0', STR_PAD_LEFT) . '-';

    $stmt = $pdo->prepare("
        SELECT registration_number FROM registrations
        WHERE registration_number LIKE ?
        ORDER BY id DESC LIMIT 1
    ");
    $stmt->execute([$prefix . '%']);
    $last = $stmt->fetchColumn();

    $seq = 1;
    if ($last) {
        $parts = explode('-', $last);
        $seq = (int)end($parts) + 1;
    }

    return $prefix . str_pad((string)$seq, 4, '0', STR_PAD_LEFT);
}

if ($method === 'GET') {
    $eventId = (int)($_GET['event_id'] ?? 0);
    $search  = trim($_GET['search'] ?? '');
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $limit   = min(50, max(5, (int)($_GET['limit'] ?? DEFAULT_PER_PAGE)));
    $offset  = ($page - 1) * $limit;

    $where = ['1=1'];
    $params = [];

    if ($eventId > 0) {
        $where[] = 'r.event_id = ?';
        $params[] = $eventId;
    }

    if ($search !== '') {
        $where[] = '(r.registration_number LIKE ? OR p.surname LIKE ? OR p.first_name LIKE ? OR p.phone LIKE ?)';
        $like = "%{$search}%";
        $params = array_merge($params, [$like, $like, $like, $like]);
    }

    $whereSql = implode(' AND ', $where);

    $countStmt = $pdo->prepare("
        SELECT COUNT(*) FROM registrations r
        JOIN participants p ON p.id = r.participant_id
        WHERE {$whereSql}
    ");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    $sql = "
        SELECT r.*, p.surname, p.first_name, p.other_name, p.gender, p.phone, p.email, p.church, p.state,
               e.name AS event_name
        FROM registrations r
        JOIN participants p ON p.id = r.participant_id
        JOIN events e ON e.id = r.event_id
        WHERE {$whereSql}
        ORDER BY r.registration_date DESC
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

    $eventId = (int)($input['event_id'] ?? 0);
    $participantId = (int)($input['participant_id'] ?? 0);
    $notes = trim($input['notes'] ?? '');

    // Option: create new participant + register in one go
    $newParticipant = $input['participant'] ?? null;

    if ($eventId <= 0) {
        jsonResponse(['success' => false, 'message' => 'Event is required'], 422);
    }

    // Validate event is open
    $evt = $pdo->prepare("SELECT id, name, status, registration_open, registration_close FROM events WHERE id = ?");
    $evt->execute([$eventId]);
    $event = $evt->fetch();

    if (!$event) {
        jsonResponse(['success' => false, 'message' => 'Event not found'], 404);
    }
    if ($event['status'] !== 'open') {
        jsonResponse(['success' => false, 'message' => 'Registration is not open for this event'], 400);
    }

    $user = currentUser();

    if ($newParticipant && is_array($newParticipant)) {
        // Create participant first
        $p = $newParticipant;
        $surname = trim($p['surname'] ?? '');
        $firstName = trim($p['first_name'] ?? '');
        $phone = trim($p['phone'] ?? '');
        $gender = $p['gender'] ?? '';

        if ($surname === '' || $firstName === '' || $phone === '' || !in_array($gender, ['Male', 'Female'], true)) {
            jsonResponse(['success' => false, 'message' => 'Participant required fields missing'], 422);
        }

        // Check existing by phone
        $check = $pdo->prepare("SELECT id FROM participants WHERE phone = ?");
        $check->execute([$phone]);
        $existing = $check->fetch();

        if ($existing) {
            $participantId = (int)$existing['id'];
        } else {
            $ins = $pdo->prepare("
                INSERT INTO participants (surname, first_name, other_name, gender, phone, church, occupation, address, state, country, emergency_contact_name, emergency_contact_phone)
                VALUES (?,?,?,?,?,?,?,?,?,?,?,?)
            ");
            $ins->execute([
                $surname,
                $firstName,
                trim($p['other_name'] ?? '') ?: null,
                $gender,
                $phone,
                trim($p['church'] ?? '') ?: null,
                trim($p['occupation'] ?? '') ?: null,
                trim($p['address'] ?? '') ?: null,
                trim($p['state'] ?? '') ?: null,
                trim($p['country'] ?? 'Nigeria'),
                trim($p['emergency_contact_name'] ?? '') ?: null,
                trim($p['emergency_contact_phone'] ?? '') ?: null
            ]);
            $participantId = (int)$pdo->lastInsertId();
        }
    }

    if ($participantId <= 0) {
        jsonResponse(['success' => false, 'message' => 'Participant is required'], 422);
    }

    // Prevent duplicate
    $dup = $pdo->prepare("SELECT id FROM registrations WHERE event_id = ? AND participant_id = ?");
    $dup->execute([$eventId, $participantId]);
    if ($dup->fetch()) {
        jsonResponse(['success' => false, 'message' => 'This participant is already registered for this event'], 409);
    }

    $regNumber = generateRegNumber($pdo, $eventId);

    $stmt = $pdo->prepare("
        INSERT INTO registrations (event_id, participant_id, registration_number, registered_by, notes, status)
        VALUES (?, ?, ?, ?, ?, 'confirmed')
    ");
    $stmt->execute([$eventId, $participantId, $regNumber, $user['id'], $notes ?: null]);

    $regId = (int)$pdo->lastInsertId();

    logActivity('register_participant', 'registration', $regId, "Registered {$regNumber} for event #{$eventId}");

    jsonResponse([
        'success' => true,
        'message' => 'Registration successful',
        'data' => [
            'id' => $regId,
            'registration_number' => $regNumber,
            'event_id' => $eventId,
            'participant_id' => $participantId
        ]
    ], 201);
}

jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
