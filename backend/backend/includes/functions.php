<?php
/**
 * Helper functions for Hormozgan Driver Pro
 */

/**
 * JSON response helper
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json; charset=utf-8');
    
    if (APP_ENV === 'development') {
        echo json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
    } else {
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
    }
    
    exit();
}

/**
 * Validate mobile number
 */
function validateMobile($mobile) {
    return preg_match('/^09[0-9]{9}$/', $mobile);
}

/**
 * Validate Iranian national ID
 */
function validateNationalId($code) {
    if (strlen($code) != 10 || !is_numeric($code)) {
        return false;
    }
    
    $sum = 0;
    for ($i = 0; $i < 9; $i++) {
        $sum += (int)$code[$i] * (10 - $i);
    }
    
    $remainder = $sum % 11;
    $controlDigit = (int)$code[9];
    
    if ($remainder < 2) {
        return $controlDigit == $remainder;
    } else {
        return $controlDigit == (11 - $remainder);
    }
}

/**
 * Validate email
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL);
}

/**
 * Sanitize input
 */
function sanitizeInput($input) {
    $input = trim($input);
    $input = stripslashes($input);
    $input = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    return $input;
}

/**
 * Generate random string
 */
function generateRandomString($length = 10) {
    $characters = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    $randomString = '';
    
    for ($i = 0; $i < $length; $i++) {
        $randomString .= $characters[rand(0, strlen($characters) - 1)];
    }
    
    return $randomString;
}

/**
 * Generate verification code
 */
function generateVerificationCode() {
    return rand(100000, 999999);
}

/**
 * Hash password
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_BCRYPT);
}

/**
 * Verify password
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Get client IP address
 */
function getClientIP() {
    $ipaddress = '';
    
    if (isset($_SERVER['HTTP_CLIENT_IP']))
        $ipaddress = $_SERVER['HTTP_CLIENT_IP'];
    else if (isset($_SERVER['HTTP_X_FORWARDED_FOR']))
        $ipaddress = $_SERVER['HTTP_X_FORWARDED_FOR'];
    else if (isset($_SERVER['HTTP_X_FORWARDED']))
        $ipaddress = $_SERVER['HTTP_X_FORWARDED'];
    else if (isset($_SERVER['HTTP_FORWARDED_FOR']))
        $ipaddress = $_SERVER['HTTP_FORWARDED_FOR'];
    else if (isset($_SERVER['HTTP_FORWARDED']))
        $ipaddress = $_SERVER['HTTP_FORWARDED'];
    else if (isset($_SERVER['REMOTE_ADDR']))
        $ipaddress = $_SERVER['REMOTE_ADDR'];
    else
        $ipaddress = 'UNKNOWN';
        
    return $ipaddress;
}

/**
 * Log activity
 */
function logActivity($action, $details = '', $userId = null) {
    $logFile = BASE_PATH . '/backend/logs/activity.log';
    $timestamp = date('Y-m-d H:i:s');
    $ip = getClientIP();
    $userId = $userId ?? (isset($_SESSION['user_id']) ? $_SESSION['user_id'] : 'guest');
    
    $logEntry = "[$timestamp] [IP: $ip] [User: $userId] [Action: $action] $details\n";
    
    file_put_contents($logFile, $logEntry, FILE_APPEND | LOCK_EX);
}

/**
 * Calculate distance between two points (in km)
 */
function calculateDistance($lat1, $lon1, $lat2, $lon2) {
    $earthRadius = 6371; // Radius of the earth in km
    
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    
    $a = sin($dLat/2) * sin($dLat/2) + 
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) * 
         sin($dLon/2) * sin($dLon/2);
    
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));
    $distance = $earthRadius * $c;
    
    return round($distance, 2);
}

/**
 * Format price
 */
function formatPrice($price) {
    return number_format($price) . ' تومان';
}

/**
 * Get persian date
 */
function getPersianDate($timestamp = null) {
    $timestamp = $timestamp ?? time();
    
    // Using PHP's Intl extension if available
    if (class_exists('IntlDateFormatter')) {
        $formatter = new IntlDateFormatter(
            'fa_IR@calendar=persian',
            IntlDateFormatter::FULL,
            IntlDateFormatter::FULL,
            'Asia/Tehran',
            IntlDateFormatter::TRADITIONAL
        );
        
        return $formatter->format($timestamp);
    }
    
    // Fallback to simple date
    return date('Y/m/d H:i:s', $timestamp);
}

/**
 * Send JSON error
 */
function sendError($message, $code = 400) {
    jsonResponse([
        'success' => false,
        'error' => $message
    ], $code);
}

/**
 * Send JSON success
 */
function sendSuccess($data = [], $message = '') {
    $response = [
        'success' => true
    ];
    
    if ($message) {
        $response['message'] = $message;
    }
    
    if ($data) {
        $response['data'] = $data;
    }
    
    jsonResponse($response);
}

/**
 * Check if request is AJAX
 */
function isAjaxRequest() {
    return isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
           strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';
}

/**
 * Handle CORS
 */
function handleCORS() {
    header("Access-Control-Allow-Origin: *");
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
    
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}
