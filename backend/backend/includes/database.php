<?php
/**
 * Database functions for Hormozgan Driver Pro
 */

/**
 * Get database connection
 */
function getDatabase() {
    static $db = null;
    
    if ($db === null) {
        try {
            // Create database directory if not exists
            if (!is_dir(DB_PATH)) {
                mkdir(DB_PATH, 0755, true);
            }
            
            // Connect to SQLite database
            $db = new PDO("sqlite:" . DB_FULL_PATH);
            $db->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $db->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $db->exec("PRAGMA foreign_keys = ON");
            $db->exec("PRAGMA journal_mode = WAL");
            
            // Create tables if not exist
            createTables($db);
            
        } catch (PDOException $e) {
            error_log("Database connection failed: " . $e->getMessage());
            throw new Exception("خطا در اتصال به پایگاه داده");
        }
    }
    
    return $db;
}

/**
 * Create necessary tables
 */
function createTables($db) {
    // Drivers table
    $db->exec("
        CREATE TABLE IF NOT EXISTS drivers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            full_name TEXT NOT NULL,
            mobile TEXT NOT NULL UNIQUE,
            national_id TEXT NOT NULL UNIQUE,
            city TEXT NOT NULL,
            national_card_path TEXT,
            driving_license_path TEXT,
            car_model TEXT,
            car_color TEXT,
            car_plate TEXT,
            status TEXT DEFAULT 'pending', -- pending, active, rejected, suspended
            rating REAL DEFAULT 5.0,
            total_trips INTEGER DEFAULT 0,
            total_earnings INTEGER DEFAULT 0,
            last_active DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Create indexes
    $db->exec("CREATE INDEX IF NOT EXISTS idx_drivers_mobile ON drivers(mobile)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_drivers_status ON drivers(status)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_drivers_city ON drivers(city)");
    
    // Users table (for admin and passengers)
    $db->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            email TEXT UNIQUE,
            phone TEXT UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT DEFAULT 'user', -- admin, user, driver
            full_name TEXT,
            status TEXT DEFAULT 'active',
            last_login DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    ");
    
    // Trips table
    $db->exec("
        CREATE TABLE IF NOT EXISTS trips (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            trip_code TEXT UNIQUE NOT NULL,
            passenger_id INTEGER,
            driver_id INTEGER,
            pickup_address TEXT NOT NULL,
            destination_address TEXT NOT NULL,
            pickup_lat REAL,
            pickup_lng REAL,
            dest_lat REAL,
            dest_lng REAL,
            distance REAL, -- in km
            duration INTEGER, -- in minutes
            fare INTEGER,
            status TEXT DEFAULT 'requested', -- requested, accepted, started, completed, cancelled
            payment_status TEXT DEFAULT 'pending', -- pending, paid, failed
            payment_method TEXT,
            rating INTEGER, -- 1-5
            feedback TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (passenger_id) REFERENCES users(id),
            FOREIGN KEY (driver_id) REFERENCES drivers(id)
        )
    ");
    
    // Payments table
    $db->exec("
        CREATE TABLE IF NOT EXISTS payments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            payment_code TEXT UNIQUE NOT NULL,
            trip_id INTEGER,
            amount INTEGER NOT NULL,
            method TEXT, -- cash, online, wallet
            status TEXT DEFAULT 'pending', -- pending, completed, failed
            transaction_id TEXT,
            gateway_response TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (trip_id) REFERENCES trips(id)
        )
    ");
    
    // Driver locations table
    $db->exec("
        CREATE TABLE IF NOT EXISTS driver_locations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            driver_id INTEGER NOT NULL,
            lat REAL NOT NULL,
            lng REAL NOT NULL,
            accuracy REAL,
            speed REAL,
            heading REAL,
            is_online BOOLEAN DEFAULT 1,
            last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE CASCADE
        )
    ");
    
    // Create indexes for performance
    $db->exec("CREATE INDEX IF NOT EXISTS idx_trips_status ON trips(status)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON trips(driver_id)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_trips_created ON trips(created_at)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_driver_locations_driver ON driver_locations(driver_id)");
    $db->exec("CREATE INDEX IF NOT EXISTS idx_driver_locations_online ON driver_locations(is_online)");
}

/**
 * Get driver by ID
 */
function getDriverById($id) {
    $db = getDatabase();
    $stmt = $db->prepare("SELECT * FROM drivers WHERE id = ?");
    $stmt->execute([$id]);
    return $stmt->fetch();
}

/**
 * Get driver by mobile
 */
function getDriverByMobile($mobile) {
    $db = getDatabase();
    $stmt = $db->prepare("SELECT * FROM drivers WHERE mobile = ?");
    $stmt->execute([$mobile]);
    return $stmt->fetch();
}

/**
 * Create new driver
 */
function createDriver($data) {
    $db = getDatabase();
    
    $stmt = $db->prepare("
        INSERT INTO drivers 
        (full_name, mobile, national_id, city, national_card_path, driving_license_path, 
         car_model, car_color, car_plate, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['full_name'],
        $data['mobile'],
        $data['national_id'],
        $data['city'],
        $data['national_card_path'] ?? null,
        $data['driving_license_path'] ?? null,
        $data['car_model'] ?? null,
        $data['car_color'] ?? null,
        $data['car_plate'] ?? null,
        'pending'
    ]);
    
    return $db->lastInsertId();
}

/**
 * Update driver location
 */
function updateDriverLocation($driverId, $lat, $lng, $accuracy = null, $isOnline = true) {
    $db = getDatabase();
    
    // Check if location exists
    $stmt = $db->prepare("SELECT id FROM driver_locations WHERE driver_id = ?");
    $stmt->execute([$driverId]);
    $exists = $stmt->fetch();
    
    if ($exists) {
        // Update existing
        $stmt = $db->prepare("
            UPDATE driver_locations 
            SET lat = ?, lng = ?, accuracy = ?, speed = ?, heading = ?, 
                is_online = ?, last_update = CURRENT_TIMESTAMP 
            WHERE driver_id = ?
        ");
        $stmt->execute([$lat, $lng, $accuracy, null, null, $isOnline ? 1 : 0, $driverId]);
    } else {
        // Insert new
        $stmt = $db->prepare("
            INSERT INTO driver_locations 
            (driver_id, lat, lng, accuracy, is_online)
            VALUES (?, ?, ?, ?, ?)
        ");
        $stmt->execute([$driverId, $lat, $lng, $accuracy, $isOnline ? 1 : 0]);
    }
    
    // Update driver's last_active
    $stmt = $db->prepare("UPDATE drivers SET last_active = CURRENT_TIMESTAMP WHERE id = ?");
    $stmt->execute([$driverId]);
    
    return true;
}

/**
 * Get online drivers
 */
function getOnlineDrivers($city = null) {
    $db = getDatabase();
    
    if ($city) {
        $stmt = $db->prepare("
            SELECT d.*, dl.lat, dl.lng, dl.last_update as location_time
            FROM drivers d
            JOIN driver_locations dl ON d.id = dl.driver_id
            WHERE d.status = 'active' 
            AND dl.is_online = 1
            AND d.city = ?
            ORDER BY dl.last_update DESC
        ");
        $stmt->execute([$city]);
    } else {
        $stmt = $db->prepare("
            SELECT d.*, dl.lat, dl.lng, dl.last_update as location_time
            FROM drivers d
            JOIN driver_locations dl ON d.id = dl.driver_id
            WHERE d.status = 'active' 
            AND dl.is_online = 1
            ORDER BY dl.last_update DESC
        ");
        $stmt->execute();
    }
    
    return $stmt->fetchAll();
}

/**
 * Get driver statistics
 */
function getDriverStats($driverId) {
    $db = getDatabase();
    
    $stmt = $db->prepare("
        SELECT 
            COUNT(*) as total_trips,
            SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_trips,
            SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_trips,
            SUM(fare) as total_earnings,
            AVG(rating) as avg_rating
        FROM trips 
        WHERE driver_id = ?
    ");
    
    $stmt->execute([$driverId]);
    return $stmt->fetch();
}

/**
 * Create a new trip
 */
function createTrip($data) {
    $db = getDatabase();
    
    // Generate unique trip code
    $tripCode = 'TRP-' . date('Ymd') . '-' . strtoupper(substr(md5(uniqid()), 0, 6));
    
    $stmt = $db->prepare("
        INSERT INTO trips 
        (trip_code, passenger_id, driver_id, pickup_address, destination_address,
         pickup_lat, pickup_lng, dest_lat, dest_lng, distance, duration, fare, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $tripCode,
        $data['passenger_id'] ?? null,
        $data['driver_id'] ?? null,
        $data['pickup_address'],
        $data['destination_address'],
        $data['pickup_lat'] ?? null,
        $data['pickup_lng'] ?? null,
        $data['dest_lat'] ?? null,
        $data['dest_lng'] ?? null,
        $data['distance'] ?? null,
        $data['duration'] ?? null,
        $data['fare'] ?? null,
        'requested'
    ]);
    
    return [
        'id' => $db->lastInsertId(),
        'trip_code' => $tripCode
    ];
}
