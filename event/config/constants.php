<?php

/**
 * Application Constants
 */

declare(strict_types=1);

// Application
define('APP_NAME', 'Event Management System');
define('APP_VERSION', '1.0.0');
define('APP_URL', getenv('APP_URL') ?: 'https://sulejadisciples.com/event');

// Paths
define('BASE_PATH', dirname(__DIR__));
define('UPLOAD_PATH', BASE_PATH . '/uploads');
define('EVENT_BANNER_PATH', UPLOAD_PATH . '/events');
define('PARTICIPANT_PHOTO_PATH', UPLOAD_PATH . '/participants');
define('ORG_LOGO_PATH', UPLOAD_PATH . '/org');

// Session
define('SESSION_NAME', 'EVENT_DASHBOARD_SESS');
define('SESSION_LIFETIME', 7200); // 2 hours

// Roles
define('ROLE_SUPER_ADMIN', 1);
define('ROLE_REGISTRATION', 2);
define('ROLE_ATTENDANCE', 3);
define('ROLE_REPORTS', 4);

// Upload limits
define('MAX_UPLOAD_SIZE', 2 * 1024 * 1024); // 2MB
define('ALLOWED_IMAGE_TYPES', ['image/jpeg', 'image/png', 'image/webp']);

// Pagination
define('DEFAULT_PER_PAGE', 15);

// Timezone
date_default_timezone_set('Africa/Lagos');
