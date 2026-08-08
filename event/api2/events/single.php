<?php
/**
 * Single Event API
 * GET    /api2/events/single.php?id=1
 * PUT    /api2/events/single.php?id=1
 * DELETE /api2/events/single.php?id=1
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/auth.php';

requireAuth(true);

$pdo = getDB();
$id = (int)($_GET['id'] ?? 0);

if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => 'Invalid event ID'], 400);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare("
        SELECT e.*, u.full_name AS created_by_name,
               (SELECT COUNT(*) FROM registrations r WHERE r.event_id = e.id AND r.status = 'confirmed') AS participant_count
        FROM events e
        LEFT JOIN users u ON u.id = e.created_by
        WHERE e.id = ?
    ");
    $stmt->execute([$id]);
    $event = $stmt->fetch();

    if (!$event) {
        jsonResponse(['success' => false, 'message' => 'Event not found'], 404);
    }

    // Attendance days
    $days = $pdo->prepare("SELECT * FROM attendance_days WHERE event_id = ? ORDER BY day_number");
    $days->execute([$id]);
    $event['attendance_days'] = $days->fetchAll();

    jsonResponse(['success' => true, 'data' => $event]);
}

if ($method === 'PUT' || $method === 'POST') {
    requireRole([ROLE_SUPER_ADMIN], true);

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $stmt = $pdo->prepare("SELECT id FROM events WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => 'Event not found'], 404);
    }

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

    $isMultiDay = (strtotime($endDate) > strtotime($startDate)) ? 1 : 0;

    $upd = $pdo->prepare("
        UPDATE events SET
            name = ?, description = ?, venue = ?, start_date = ?, end_date = ?,
            registration_open = ?, registration_close = ?, status = ?, is_multi_day = ?
        WHERE id = ?
    ");
    $upd->execute([
        $name, $description, $venue, $startDate, $endDate,
        $regOpen ?: null, $regClose ?: null, $status, $isMultiDay, $id
    ]);

    logActivity('update_event', 'event', $id, "Updated event: {$name}");

    jsonResponse(['success' => true, 'message' => 'Event updated successfully']);
}

if ($method === 'DELETE') {
    requireRole([ROLE_SUPER_ADMIN], true);

    $stmt = $pdo->prepare("SELECT name FROM events WHERE id = ?");
    $stmt->execute([$id]);
    $event = $stmt->fetch();

    if (!$event) {
        jsonResponse(['success' => false, 'message' => 'Event not found'], 404);
    }

    $pdo->prepare("DELETE FROM events WHERE id = ?")->execute([$id]);

    logActivity('delete_event', 'event', $id, "Deleted event: {$event['name']}");

    jsonResponse(['success' => true, 'message' => 'Event deleted successfully']);
}

jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);

