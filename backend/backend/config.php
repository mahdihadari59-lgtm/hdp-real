<?php
/**
 * Configuration file for Hormozgan Driver Pro
 */

// Application settings
define('SITE_NAME', 'هرمزگان درایور پرو');
define('SITE_URL', 'http://localhost:8000');
define('SITE_VERSION', '1.0.0');
define('BASE_PATH', dirname(__DIR__));

// Environment
define('APP_ENV', 'development'); // development, staging, production
define('APP_TIMEZONE', 'Asia/Tehran');
define('APP_LANGUAGE', 'fa_IR');

// Database
define('DB_PATH', BASE_PATH . '/backend/database/');
define('DB_FILE', 'drivers.db');
define('DB_FULL_PATH', DB_PATH . DB_FILE);

// File Uploads
define('UPLOAD_PATH', BASE_PATH . '/backend/uploads/');
define('UPLOAD_DRIVERS_PATH', UPLOAD_PATH . 'drivers/');
define('MAX_FILE_SIZE', 5 * 1024 * 1024); // 5MB
define('ALLOWED_FILE_TYPES', [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif'
]);

// Security
define('JWT_SECRET', 'hormozgan-driver-pro-secret-key-2024-change-in-production');
define('JWT_EXPIRE', 86400); // 24 hours in seconds
define('API_RATE_LIMIT', 100); // requests per hour per IP
define('ENCRYPTION_KEY', 'your-encryption-key-here');

// Map Settings
define('MAP_PROVIDER', 'openstreetmap'); // openstreetmap, leaflet
define('MAP_DEFAULT_LAT', 27.1865); // Bandar Abbas
define('MAP_DEFAULT_LNG', 56.2808); // Bandar Abbas
define('MAP_DEFAULT_ZOOM', 12);
define('MAP_TILE_URL', 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png');
define('MAP_ATTRIBUTION', '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors');

// SMS Settings (for future)
define('SMS_ENABLED', false);
define('SMS_PROVIDER', 'kavenegar'); // kavenegar, panel.ir, etc.
define('SMS_API_KEY', '');
define('SMS_SENDER', '3000xxxxx');

// Payment Gateway (for future)
define('PAYMENT_ENABLED', false);
define('PAYMENT_GATEWAY', 'zarinpal'); // zarinpal, idpay, etc.
define('PAYMENT_MERCHANT_ID', '');
define('PAYMENT_CALLBACK_URL', SITE_URL . '/api/payment/verify.php');

// Email Settings
define('EMAIL_ENABLED', false);
define('EMAIL_HOST', 'smtp.gmail.com');
define('EMAIL_PORT', 587);
define('EMAIL_USERNAME', '');
define('EMAIL_PASSWORD', '');
define('EMAIL_FROM', 'noreply@hormozgandriver.ir');
define('EMAIL_FROM_NAME', SITE_NAME);

// Error Reporting
if (APP_ENV === 'development') {
    error_reporting(E_ALL);
    ini_set('display_errors', 1);
    ini_set('log_errors', 1);
    ini_set('error_log', BASE_PATH . '/backend/logs/error.log');
} else {
    error_reporting(0);
    ini_set('display_errors', 0);
}

// Set timezone
date_default_timezone_set(APP_TIMEZONE);

// Start session if not started
if (session_status() === PHP_SESSION_NONE) {
    session_start([
        'cookie_lifetime' => 86400,
        'cookie_secure' => APP_ENV === 'production',
        'cookie_httponly' => true,
        'cookie_samesite' => 'Strict'
    ]);
}

// Include helper functions
require_once BASE_PATH . '/backend/includes/functions.php';
require_once BASE_PATH . '/backend/includes/database.php';
require_once BASE_PATH . '/backend/includes/auth.php';
