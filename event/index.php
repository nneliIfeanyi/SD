<?php
/**
 * Entry Point - Redirect to login or dashboard
 */
require_once __DIR__ . '/config/constants.php';
require_once __DIR__ . '/config/auth.php';

startSecureSession();

if (isAuthenticated()) {
    header('Location: ' . APP_URL . '/pages/dashboard.php');
} else {
    header('Location: ' . APP_URL . '/pages/login.php');
}
exit;
