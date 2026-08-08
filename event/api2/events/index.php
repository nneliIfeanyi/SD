<?php
/**
 * Events API - List & Create
 * GET  /api2/events/index.php
 * POST /api2/events/index.php
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/auth.php';

requireAuth(true);

$pdo = getDB();
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $status = $_GET['status'] ?? null;
    $search = trim($_GET['search'] ?? '');
    $page   = max(1, (int)($_GET['page'] ?? 1));
    $limit  = min(50, max(5, (int)($_GET['limit'] ?? DEFAULT_PER_PAGE)));
    $offset = ($page - 1) * $limit;

    $where = ['1=1'];
    $params = [];

    if ($status && in_array($status, ['draft','open','closed','archived'], true)) {
        $where[] = 'e.status = ?';
        $params[] = $status;
    }

    if ($search !== '') {
        $where[] = '(e.name LIKE ? OR e.venue LIKE ? OR e.description LIKE ?)';
        $like = "%{$search}%";
        $params[] = $like;
        $params[] = $like;
        $params[] = $like;
    }

    $whereSql = implode(' AND ', $where);

    // Count
    $countStmt = $pdo->prepare("SELECT COUNT(*) FROM events e WHERE {$whereSql}");
    $countStmt->execute($params);
    $total = (int)$countStmt->fetchColumn();

    // Data
    $sql = "
        SELECT e.*, u.full_name AS created_by_name,
               (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS participant_count
        FROM events e
        LEFT JOIN users u ON u.id = e.created_by
        WHERE {$whereSql}
        ORDER BY e.start_date DESC, e.id DESC
        LIMIT {$limit} OFFSET {$offset}
    ";
    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    $events = $stmt->fetchAll();

    jsonResponse([
        'success' => true,
        'data' => $events,
        'meta' => [
            'total' => $total,
            'page'  => $page,
            'limit' => $limit,
            'pages' => (int)ceil($total / $limit)
        ]
    ]);
}

if ($method === 'POST') {
    requireRole([ROLE_SUPER_ADMIN], true);

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $name = trim($input['name'] ?? '');
    $description = trim($input['description'] ?? '');
    $venue = trim($input['venue'] ?? '');
    $startDate = $input['start_date'] ?? '';
    $endDate = $input['end_date'] ?? '';
    $regOpen = $input['registration_open'] ?? null;
    $regClose = $input['registration_close'] ?? null;
    $status = $input['status'] ?? 'draft';

    if ($name === '' || $startDate === '' || $endDate === '') {
        jsonResponse(['success' => false, 'message' => 'Name, start date and end date are required'], 422);
    }

    if (!in_array($status, ['draft','open','closed','archived'], true)) {
        $status = 'draft';
    }

    $slug = strtolower(trim(preg_replace('/[^A-Za-z0-9-]+/', '-', $name), '-'));
    $slug = $slug ?: 'event-' . time();

    // Ensure unique slug
    $check = $pdo->prepare("SELECT id FROM events WHERE slug = ?");
    $check->execute([$slug]);
    if ($check->fetch()) {
        $slug .= '-' . time();
    }

    $isMultiDay = (strtotime($endDate) > strtotime($startDate)) ? 1 : 0;
    $user = currentUser();

    $stmt = $pdo->prepare("
        INSERT INTO events (name, slug, description, venue, start_date, end_date, registration_open, registration_close, status, is_multi_day, created_by)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    $stmt->execute([
        $name, $slug, $description, $venue, $startDate, $endDate,
        $regOpen ?: null, $regClose ?: null, $status, $isMultiDay, $user['id']
    ]);

    $eventId = (int)$pdo->lastInsertId();

    // Auto-create attendance days for multi-day events
    if ($isMultiDay) {
        $start = new DateTime($startDate);
        $end = new DateTime($endDate);
        $dayNum = 1;
        while ($start <= $end) {
            $pdo->prepare("
                INSERT INTO attendance_days (event_id, day_number, day_date, label)
                VALUES (?, ?, ?, ?)
            ")->execute([
                $eventId,
                $dayNum,
                $start->format('Y-m-d'),
                "Day {$dayNum}"
            ]);
            $start->modify('+1 day');
            $dayNum++;
        }
    }

    logActivity('create_event', 'event', $eventId, "Created event: {$name}");

    jsonResponse([
        'success' => true,
        'message' => 'Event created successfully',
        'data' => ['id' => $eventId, 'slug' => $slug]
    ], 201);
}

jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);

