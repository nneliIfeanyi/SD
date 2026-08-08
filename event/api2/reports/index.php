<?php

/**
 * Reports API
 * GET /api2/reports/index.php?type=summary|gender|state|church|attendance|daily
 */

declare(strict_types=1);

require_once __DIR__ . '/../../config/cors.php';
require_once __DIR__ . '/../../config/auth.php';

requireAuth(true);
requireRole([ROLE_SUPER_ADMIN, ROLE_REPORTS, ROLE_REGISTRATION, ROLE_ATTENDANCE], true);

$pdo = getDB();
$type = $_GET['type'] ?? 'summary';
$eventId = (int)($_GET['event_id'] ?? 0);

switch ($type) {
    case 'summary':
        $stats = [];

        $stats['total_events'] = (int)$pdo->query("SELECT COUNT(*) FROM events")->fetchColumn();
        $stats['open_events']  = (int)$pdo->query("SELECT COUNT(*) FROM events WHERE status = 'open'")->fetchColumn();
        $stats['total_participants'] = (int)$pdo->query("SELECT COUNT(*) FROM participants")->fetchColumn();
        $stats['total_registrations'] = (int)$pdo->query("SELECT COUNT(*) FROM registrations WHERE status = 'confirmed'")->fetchColumn();
        $stats['today_registrations'] = (int)$pdo->query("SELECT COUNT(*) FROM registrations WHERE DATE(registration_date) = CURDATE()")->fetchColumn();
        $stats['today_attendance'] = (int)$pdo->query("SELECT COUNT(*) FROM attendance WHERE DATE(check_in) = CURDATE()")->fetchColumn();

        // Active event
        $active = $pdo->query("SELECT id, name FROM events WHERE status = 'open' ORDER BY start_date LIMIT 1")->fetch();
        $stats['active_event'] = $active ?: null;

        // Monthly registrations (last 6 months)
        $monthly = $pdo->query("
            SELECT DATE_FORMAT(registration_date, '%Y-%m') AS month, COUNT(*) AS total
            FROM registrations
            WHERE registration_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            GROUP BY month
            ORDER BY month
        ")->fetchAll();

        // Event participation
        $byEvent = $pdo->query("
            SELECT e.name, COUNT(r.id) AS total
            FROM events e
            LEFT JOIN registrations r ON r.event_id = e.id AND r.status = 'confirmed'
            GROUP BY e.id
            ORDER BY total DESC
            LIMIT 10
        ")->fetchAll();

        jsonResponse([
            'success' => true,
            'data' => [
                'stats' => $stats,
                'monthly_registrations' => $monthly,
                'event_participation' => $byEvent
            ]
        ]);
        break;

    case 'gender':
        $sql = "
            SELECT p.gender, COUNT(*) AS total
            FROM registrations r
            JOIN participants p ON p.id = r.participant_id
            WHERE r.status = 'confirmed'
        ";
        $params = [];
        if ($eventId > 0) {
            $sql .= " AND r.event_id = ?";
            $params[] = $eventId;
        }
        $sql .= " GROUP BY p.gender";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        jsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    case 'state':
        $sql = "
            SELECT COALESCE(p.state, 'Unknown') AS state, COUNT(*) AS total
            FROM registrations r
            JOIN participants p ON p.id = r.participant_id
            WHERE r.status = 'confirmed'
        ";
        $params = [];
        if ($eventId > 0) {
            $sql .= " AND r.event_id = ?";
            $params[] = $eventId;
        }
        $sql .= " GROUP BY p.state ORDER BY total DESC LIMIT 15";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        jsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    case 'church':
        $sql = "
            SELECT COALESCE(p.church, 'Not Specified') AS church, COUNT(*) AS total
            FROM registrations r
            JOIN participants p ON p.id = r.participant_id
            WHERE r.status = 'confirmed'
        ";
        $params = [];
        if ($eventId > 0) {
            $sql .= " AND r.event_id = ?";
            $params[] = $eventId;
        }
        $sql .= " GROUP BY p.church ORDER BY total DESC LIMIT 20";
        $stmt = $pdo->prepare($sql);
        $stmt->execute($params);
        jsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    case 'attendance':
        if ($eventId <= 0) {
            jsonResponse(['success' => false, 'message' => 'event_id required'], 422);
        }
        $sql = "
            SELECT ad.day_number, ad.day_date, ad.label,
                   COUNT(a.id) AS checked_in,
                   SUM(CASE WHEN a.check_out IS NOT NULL THEN 1 ELSE 0 END) AS checked_out
            FROM attendance_days ad
            LEFT JOIN attendance a ON a.attendance_day_id = ad.id
            WHERE ad.event_id = ?
            GROUP BY ad.id
            ORDER BY ad.day_number
        ";
        $stmt = $pdo->prepare($sql);
        $stmt->execute([$eventId]);
        jsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    case 'daily':
        $days = (int)($_GET['days'] ?? 14);
        $stmt = $pdo->prepare("
            SELECT DATE(check_in) AS day, COUNT(*) AS total
            FROM attendance
            WHERE check_in >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
            GROUP BY day
            ORDER BY day
        ");
        $stmt->execute([$days]);
        jsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    case 'event_registrations':
        if ($eventId <= 0) {
            jsonResponse(['success' => false, 'message' => 'event_id required'], 422);
        }
        $stmt = $pdo->prepare("
            SELECT r.registration_number, r.registration_date, r.status,
                   p.surname, p.first_name, p.other_name, p.gender, p.phone, p.email, p.church, p.state
            FROM registrations r
            JOIN participants p ON p.id = r.participant_id
            WHERE r.event_id = ?
            ORDER BY r.registration_date DESC
        ");
        $stmt->execute([$eventId]);
        jsonResponse(['success' => true, 'data' => $stmt->fetchAll()]);
        break;

    default:
        jsonResponse(['success' => false, 'message' => 'Unknown report type'], 400);
}

