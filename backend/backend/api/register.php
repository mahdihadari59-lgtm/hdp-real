<?php
/**
 * Driver Registration API
 */

// Include configuration
require_once dirname(__DIR__) . '/config.php';

// Handle CORS
handleCORS();

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    sendError('Method not allowed. Only POST requests are accepted.', 405);
}

// Check if all required fields are present
$requiredFields = ['full_name', 'mobile', 'national_id', 'city'];
foreach ($requiredFields as $field) {
    if (empty($_POST[$field])) {
        sendError("فیلد $field الزامی است.", 400);
    }
}

// Sanitize inputs
$fullName = sanitizeInput($_POST['full_name']);
$mobile = sanitizeInput($_POST['mobile']);
$nationalId = sanitizeInput($_POST['national_id']);
$city = sanitizeInput($_POST['city']);
$carModel = isset($_POST['car_model']) ? sanitizeInput($_POST['car_model']) : null;
$carColor = isset($_POST['car_color']) ? sanitizeInput($_POST['car_color']) : null;
$carPlate = isset($_POST['car_plate']) ? sanitizeInput($_POST['car_plate']) : null;

// Validate inputs
if (strlen($fullName) < 3) {
    sendError('نام کامل باید حداقل ۳ حرف باشد.', 400);
}

if (!validateMobile($mobile)) {
    sendError('شماره موبایل نامعتبر است. فرمت صحیح: 09123456789', 400);
}

if (!validateNationalId($nationalId)) {
    sendError('کد ملی نامعتبر است.', 400);
}

// Check if driver already exists
try {
    $db = getDatabase();
    
    $stmt = $db->prepare("SELECT id FROM drivers WHERE mobile = ? OR national_id = ?");
    $stmt->execute([$mobile, $nationalId]);
    
    if ($stmt->fetch()) {
        sendError('راننده با این شماره موبایل یا کد ملی قبلاً ثبت‌نام کرده است.', 409);
    }
    
} catch (Exception $e) {
    sendError('خطا در بررسی اطلاعات: ' . $e->getMessage(), 500);
}

// Handle file uploads
$uploadedFiles = [];

try {
    // Create upload directory if not exists
    if (!is_dir(UPLOAD_DRIVERS_PATH)) {
        mkdir(UPLOAD_DRIVERS_PATH, 0755, true);
    }
    
    // Process national card
    if (isset($_FILES['national_card']) && $_FILES['national_card']['error'] === UPLOAD_ERR_OK) {
        $nationalCard = $_FILES['national_card'];
        
        // Validate file
        $fileInfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($fileInfo, $nationalCard['tmp_name']);
        finfo_close($fileInfo);
        
        if (!in_array($mimeType, ALLOWED_FILE_TYPES)) {
            sendError('فرمت فایل کارت ملی نامعتبر است. فرمت‌های مجاز: PDF, JPEG, PNG', 400);
        }
        
        if ($nationalCard['size'] > MAX_FILE_SIZE) {
            sendError('حجم فایل کارت ملی نباید بیشتر از ۵ مگابایت باشد.', 400);
        }
        
        // Generate unique filename
        $extension = pathinfo($nationalCard['name'], PATHINFO_EXTENSION);
        $filename = 'national_card_' . $nationalId . '_' . time() . '.' . $extension;
        $destination = UPLOAD_DRIVERS_PATH . $filename;
        
        if (!move_uploaded_file($nationalCard['tmp_name'], $destination)) {
            sendError('خطا در آپلود کارت ملی.', 500);
        }
        
        $uploadedFiles['national_card'] = $filename;
    } else {
        sendError('فایل کارت ملی الزامی است.', 400);
    }
    
    // Process driving license
    if (isset($_FILES['driving_license']) && $_FILES['driving_license']['error'] === UPLOAD_ERR_OK) {
        $drivingLicense = $_FILES['driving_license'];
        
        // Validate file
        $fileInfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($fileInfo, $drivingLicense['tmp_name']);
        finfo_close($fileInfo);
        
        if (!in_array($mimeType, ALLOWED_FILE_TYPES)) {
            sendError('فرمت فایل گواهینامه نامعتبر است. فرمت‌های مجاز: PDF, JPEG, PNG', 400);
        }
        
        if ($drivingLicense['size'] > MAX_FILE_SIZE) {
            sendError('حجم فایل گواهینامه نباید بیشتر از ۵ مگابایت باشد.', 400);
        }
        
        // Generate unique filename
        $extension = pathinfo($drivingLicense['name'], PATHINFO_EXTENSION);
        $filename = 'driving_license_' . $nationalId . '_' . time() . '.' . $extension;
        $destination = UPLOAD_DRIVERS_PATH . $filename;
        
        if (!move_uploaded_file($drivingLicense['tmp_name'], $destination)) {
            // Clean up uploaded national card if license upload fails
            if (isset($uploadedFiles['national_card'])) {
                @unlink(UPLOAD_DRIVERS_PATH . $uploadedFiles['national_card']);
            }
            sendError('خطا در آپلود گواهینامه.', 500);
        }
        
        $uploadedFiles['driving_license'] = $filename;
    } else {
        // Clean up uploaded national card if license is missing
        if (isset($uploadedFiles['national_card'])) {
            @unlink(UPLOAD_DRIVERS_PATH . $uploadedFiles['national_card']);
        }
        sendError('فایل گواهینامه الزامی است.', 400);
    }
    
} catch (Exception $e) {
    // Clean up any uploaded files
    foreach ($uploadedFiles as $file) {
        @unlink(UPLOAD_DRIVERS_PATH . $file);
    }
    
    sendError('خطا در پردازش فایل‌ها: ' . $e->getMessage(), 500);
}

// Save driver to database
try {
    $driverData = [
        'full_name' => $fullName,
        'mobile' => $mobile,
        'national_id' => $nationalId,
        'city' => $city,
        'national_card_path' => $uploadedFiles['national_card'],
        'driving_license_path' => $uploadedFiles['driving_license'],
        'car_model' => $carModel,
        'car_color' => $carColor,
        'car_plate' => $carPlate
    ];
    
    $driverId = createDriver($driverData);
    
    // Log the registration
    logActivity('driver_registration', 
        "Driver ID: $driverId, Name: $fullName, Mobile: $mobile", 
        $driverId);
    
    // Send success response
    sendSuccess([
        'driver_id' => $driverId,
        'full_name' => $fullName,
        'mobile' => $mobile,
        'status' => 'pending',
        'message' => 'اطلاعات شما با موفقیت ثبت شد. تأیید نهایی حداکثر طی ۲۴ ساعت کاری انجام می‌شود.'
    ], 'ثبت‌نام با موفقیت انجام شد');
    
} catch (Exception $e) {
    // Clean up uploaded files on database error
    foreach ($uploadedFiles as $file) {
        @unlink(UPLOAD_DRIVERS_PATH . $file);
    }
    
    sendError('خطا در ذخیره اطلاعات: ' . $e->getMessage(), 500);
}
