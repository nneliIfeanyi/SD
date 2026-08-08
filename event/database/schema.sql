-- =====================================================
-- Event Management System - Production Schema
-- MySQL 8+ / MariaDB 10.5+
-- =====================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- -----------------------------------------------------
-- 1. Roles
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS roles (
    id TINYINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(50) NOT NULL UNIQUE,
    description VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 2. Users (Admins & Officers)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    role_id TINYINT UNSIGNED NOT NULL,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    phone VARCHAR(20),
    is_active TINYINT(1) DEFAULT 1,
    last_login DATETIME NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 3. Organization Profile (Settings)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS organization (
    id TINYINT UNSIGNED PRIMARY KEY DEFAULT 1,
    name VARCHAR(200) NOT NULL,
    logo VARCHAR(255),
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(150),
    website VARCHAR(200),
    theme ENUM('light','dark','auto') DEFAULT 'light',
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 4. Events (Core - Dynamic)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS events (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(220) NOT NULL UNIQUE,
    description TEXT,
    venue VARCHAR(255),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    registration_open DATE,
    registration_close DATE,
    status ENUM('draft','open','closed','archived') DEFAULT 'draft',
    banner_image VARCHAR(255),
    is_multi_day TINYINT(1) DEFAULT 0,
    created_by INT UNSIGNED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_status (status),
    INDEX idx_dates (start_date, end_date)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 5. Participants (Master record - reusable across events)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS participants (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    passport_photo VARCHAR(255),
    surname VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    other_name VARCHAR(100),
    gender ENUM('Male','Female') NOT NULL,
    date_of_birth DATE,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(150),
    church VARCHAR(200),
    occupation VARCHAR(150),
    address TEXT,
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'Nigeria',
    emergency_contact_name VARCHAR(150),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_phone (phone),
    INDEX idx_name (surname, first_name),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 6. Registrations (Event ↔ Participant link)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS registrations (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    event_id INT UNSIGNED NOT NULL,
    participant_id INT UNSIGNED NOT NULL,
    registration_number VARCHAR(30) NOT NULL UNIQUE,
    registered_by INT UNSIGNED,
    registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    status ENUM('pending','confirmed','cancelled') DEFAULT 'confirmed',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY unique_event_participant (event_id, participant_id),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    FOREIGN KEY (registered_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_reg_number (registration_number),
    INDEX idx_event (event_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 7. Attendance Days (for multi-day events)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance_days (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    event_id INT UNSIGNED NOT NULL,
    day_number TINYINT UNSIGNED NOT NULL,
    day_date DATE NOT NULL,
    label VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_event_day (event_id, day_number),
    FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 8. Attendance Records
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS attendance (
    id INT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    registration_id INT UNSIGNED NOT NULL,
    attendance_day_id INT UNSIGNED NULL,
    check_in DATETIME NULL,
    check_out DATETIME NULL,
    recorded_by INT UNSIGNED,
    method ENUM('manual','qr','import') DEFAULT 'manual',
    notes VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (registration_id) REFERENCES registrations(id) ON DELETE CASCADE,
    FOREIGN KEY (attendance_day_id) REFERENCES attendance_days(id) ON DELETE SET NULL,
    FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_reg (registration_id),
    INDEX idx_day (attendance_day_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 9. Activity Log
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS activity_logs (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    user_id INT UNSIGNED,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(50),
    entity_id INT UNSIGNED,
    description TEXT,
    ip_address VARCHAR(45),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------------
-- 10. User Sessions (optional)
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS user_sessions (
    id VARCHAR(128) PRIMARY KEY,
    user_id INT UNSIGNED NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    payload TEXT,
    last_activity INT UNSIGNED,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =====================================================
-- Seed Data
-- =====================================================

INSERT INTO roles (id, name, description) VALUES
(1, 'Super Admin', 'Full system access'),
(2, 'Registration Officer', 'Manage participants and registrations'),
(3, 'Attendance Officer', 'Record and manage attendance'),
(4, 'Reports Officer', 'View and export reports')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Default password for all seed users: Admin@123
-- Hash generated with password_hash('Admin@123', PASSWORD_DEFAULT)
INSERT INTO users (role_id, username, email, password_hash, full_name, phone, is_active) VALUES
(1, 'superadmin', 'admin@church.org', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'System Administrator', '08012345678', 1),
(2, 'regofficer', 'reg@church.org', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Registration Officer', '08023456789', 1),
(3, 'attofficer', 'att@church.org', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Attendance Officer', '08034567890', 1),
(4, 'reportofficer', 'report@church.org', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Reports Officer', '08045678901', 1)
ON DUPLICATE KEY UPDATE full_name=VALUES(full_name);

INSERT INTO organization (id, name, address, phone, email, website, theme) VALUES
(1, 'Grace Covenant Ministry', '123 Faith Avenue, Lagos, Nigeria', '+234 801 234 5678', 'info@gracecovenant.org', 'https://gracecovenant.org', 'light')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Sample Events
INSERT INTO events (name, slug, description, venue, start_date, end_date, registration_open, registration_close, status, is_multi_day, created_by) VALUES
('Annual Youth Convention 2026', 'annual-youth-convention-2026', 'A powerful gathering of young believers for spiritual growth, worship and empowerment.', 'Main Auditorium, Faith Center', '2026-08-15', '2026-08-17', '2026-06-01', '2026-08-10', 'open', 1, 1),
('Women of Virtue Conference', 'women-of-virtue-conference', 'Empowering women through the Word of God.', 'Fellowship Hall', '2026-09-20', '2026-09-20', '2026-07-01', '2026-09-15', 'open', 0, 1),
('Men\'s Leadership Summit', 'mens-leadership-summit', 'Building godly leaders for the next generation.', 'Conference Center', '2026-10-10', '2026-10-12', '2026-08-01', '2026-10-05', 'draft', 1, 1)
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Sample attendance days for multi-day event
INSERT INTO attendance_days (event_id, day_number, day_date, label) VALUES
(1, 1, '2026-08-15', 'Day 1 - Opening & Worship'),
(1, 2, '2026-08-16', 'Day 2 - Workshops & Ministry'),
(1, 3, '2026-08-17', 'Day 3 - Closing & Commissioning')
ON DUPLICATE KEY UPDATE label=VALUES(label);
