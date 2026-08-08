<?php

/**
 * Single Participant API
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/auth.php';

requireAuth(true);
requireRole([ROLE_SUPER_ADMIN, ROLE_REGISTRATION, ROLE_ATTENDANCE], true);

$pdo = getDB();
$id = (int)($_GET['id'] ?? 0);

if ($id <= 0) {
    jsonResponse(['success' => false, 'message' => 'Invalid participant ID'], 400);
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    $stmt = $pdo->prepare("SELECT * FROM participants WHERE id = ?");
    $stmt->execute([$id]);
    $p = $stmt->fetch();

    if (!$p) {
        jsonResponse(['success' => false, 'message' => 'Participant not found'], 404);
    }

    // Registrations
    $regs = $pdo->prepare("
        SELECT r.*, e.name AS event_name, e.start_date
        FROM registrations r
        JOIN events e ON e.id = r.event_id
        WHERE r.participant_id = ?
        ORDER BY r.registration_date DESC
    ");
    $regs->execute([$id]);
    $p['registrations'] = $regs->fetchAll();

    jsonResponse(['success' => true, 'data' => $p]);
}

if ($method === 'PUT' || $method === 'POST') {
    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;

    $stmt = $pdo->prepare("SELECT id FROM participants WHERE id = ?");
    $stmt->execute([$id]);
    if (!$stmt->fetch()) {
        jsonResponse(['success' => false, 'message' => 'Participant not found'], 404);
    }

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
        jsonResponse(['success' => false, 'message' => 'Required fields missing'], 422);
    }

    $upd = $pdo->prepare("
        UPDATE participants SET
            surname=?, first_name=?, other_name=?, gender=?, date_of_birth=?, phone=?, email=?,
            church=?, occupation=?, address=?, state=?, country=?,
            emergency_contact_name=?, emergency_contact_phone=?
        WHERE id=?
    ");
    $upd->execute([
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
        $emPhone ?: null,
        $id
    ]);

    logActivity('update_participant', 'participant', $id, "Updated participant: {$surname} {$firstName}");

    jsonResponse(['success' => true, 'message' => 'Participant updated successfully']);
}

if ($method === 'DELETE') {
    requireRole([ROLE_SUPER_ADMIN], true);

    $stmt = $pdo->prepare("SELECT surname, first_name FROM participants WHERE id = ?");
    $stmt->execute([$id]);
    $p = $stmt->fetch();

    if (!$p) {
        jsonResponse(['success' => false, 'message' => 'Participant not found'], 404);
    }

    $pdo->prepare("DELETE FROM participants WHERE id = ?")->execute([$id]);
    logActivity('delete_participant', 'participant', $id, "Deleted: {$p['surname']} {$p['first_name']}");

    jsonResponse(['success' => true, 'message' => 'Participant deleted successfully']);
}

jsonResponse(['success' => false, 'message' => 'Method not allowed'], 405);
