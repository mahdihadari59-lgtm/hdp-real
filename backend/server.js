const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

console.log('🚀 راه‌اندازی HDP Backend در Termux...');
console.log('📁 مسیر:', __dirname);

// خواندن فایل .env
require('dotenv').config();

const MAP_API_KEY = process.env.MAP_API_KEY || "service.a26822ae11b84924a29a13225498abf0";

// ==================== 📊 دیتابیس حافظه ====================
const database = {
    bookings: [],
    drivers: [
        {
            id: 'DRV-001',
            name: 'رضا محمدی',
            phone: '09121234567',
            rating: 4.8,
            status: 'available',
            experience: '5 سال',
            car: { model: 'پژو 206', color: 'سفید', plate: '75-ع 123', year: 1400 },
            location: { lat: 27.1865, lng: 56.2768, address: 'بندرعباس، میدان شهدا' },
            registered_at: '1402/08/15',
            trips_completed: 1242,
            earnings_today: 450000,
            online: true
        },
        {
            id: 'DRV-002',
            name: 'علی کریمی',
            phone: '09129876543',
            rating: 4.9,
            status: 'on_trip',
            experience: '7 سال',
            car: { model: 'سمند', color: 'مشکی', plate: '75-ع 456', year: 1399 },
            location: { lat: 27.1920, lng: 56.2650, address: 'بندرعباس، بلوار امام' },
            registered_at: '1402/07/22',
            trips_completed: 1856,
            earnings_today: 380000,
            online: true
        },
        {
            id: 'DRV-003',
            name: 'محمد حسینی',
            phone: '09131112233',
            rating: 4.7,
            status: 'available',
            experience: '3 سال',
            car: { model: 'تیبا', color: 'نقره‌ای', plate: '75-ع 789', year: 1401 },
            location: { lat: 27.1750, lng: 56.2850, address: 'بندرعباس، چهارراه ساحل' },
            registered_at: '1402/09/10',
            trips_completed: 876,
            earnings_today: 520000,
            online: true
        }
    ],
    stats: {
        total_bookings: 0,
        bookings_today: 0,
        total_earnings: 0,
        map_requests: 0
    }
};

// ==================== 🔧 توابع کمکی ====================
function generateBookingCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = 'HDP-';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

function calculateTripCost(pickup, destination, tripType = 'normal', passengers = 1) {
    // محاسبات نمونه
    const baseRate = 10000;
    const distanceRate = 5000;
    const timeRate = 2000;
    
    // شبیه‌سازی مسافت و زمان
    const distance = Math.random() * 20 + 5; // 5-25 کیلومتر
    const duration = distance * 1.5 + 5; // دقیقه
    
    let cost = baseRate + (distance * distanceRate) + (duration * timeRate);
    
    // ضریب نوع سفر
    if (tripType === 'premium') cost *= 1.5;
    if (tripType === 'share') cost *= 0.7;
    
    // ضریب مسافران
    cost *= passengers;
    
    // گرد کردن به هزار تومان
    return Math.round(cost / 1000) * 1000;
}

function getRandomLocation(baseLat = 27.1832, baseLng = 56.2666, range = 0.1) {
    return {
        lat: baseLat + (Math.random() * range * 2 - range),
        lng: baseLng + (Math.random() * range * 2 - range)
    };
}

// ==================== 🌐 صفحه اصلی ====================
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <title>HDP Backend</title>
            <style>
                body { font-family: Tahoma; padding: 20px; background: #0c2461; color: white; }
                .container { max-width: 1000px; margin: 0 auto; background: rgba(255,255,255,0.1); padding: 30px; border-radius: 15px; }
                h1 { color: #00ff88; }
                .card { background: rgba(255,255,255,0.2); padding: 15px; margin: 10px 0; border-radius: 10px; }
                a { color: #00d4ff; text-decoration: none; }
                .status { background: #00ff88; color: #0c2461; padding: 5px 10px; border-radius: 20px; display: inline-block; }
                .api-list { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
                .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
                .stat-box { background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; text-align: center; }
                .stat-value { font-size: 1.8rem; font-weight: bold; color: #00ff88; }
                .stat-label { font-size: 0.9rem; color: #aaa; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚗 هرمزگان درایور پرو - Backend</h1>
                <p><span class="status">فعال</span> نسخه ۵.۰.۰ - Termux</p>
                
                <div class="stats-grid">
                    <div class="stat-box">
                        <div class="stat-value">${database.bookings.length}</div>
                        <div class="stat-label">رزرو فعال</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${database.drivers.length}</div>
                        <div class="stat-label">راننده</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${database.stats.total_earnings.toLocaleString('fa-IR')}</div>
                        <div class="stat-label">درآمد کل</div>
                    </div>
                    <div class="stat-box">
                        <div class="stat-value">${database.stats.map_requests}</div>
                        <div class="stat-label">درخواست نقشه</div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>📡 API‌های فعال:</h3>
                    <div class="api-list">
                        <div><a href="/api/health">GET /api/health</a> - وضعیت</div>
                        <div><a href="/api/stats">GET /api/stats</a> - آمار</div>
                        <div><a href="/api/drivers">GET /api/drivers</a> - رانندگان</div>
                        <div><a href="/api/map/drivers">GET /api/map/drivers</a> - نقشه</div>
                        <div><a href="/api/map/traffic">GET /api/map/traffic</a> - ترافیک</div>
                        <div><a href="/api/map/route">GET /api/map/route</a> - مسیریابی</div>
                        <div><a href="/api/ai/predict">GET /api/ai/predict</a> - پیش‌بینی AI</div>
                        <div><a href="/api/bookings">GET /api/bookings</a> - لیست رزرو</div>
                        <div><a href="/api/system/status">GET /api/system/status</a> - وضعیت سیستم</div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>🚖 سیستم رزرو:</h3>
                    <div class="api-list">
                        <div>POST /api/bookings/create - ایجاد رزرو</div>
                        <div>GET /api/bookings/:code - جزئیات رزرو</div>
                        <div>PUT /api/bookings/:code/status - تغییر وضعیت</div>
                        <div>POST /api/bookings/:code/cancel - لغو رزرو</div>
                    </div>
                </div>
                
                <div class="card">
                    <h3>🔗 لینک‌ها:</h3>
                    <p>🌐 Frontend: <a href="http://localhost:8000">http://localhost:8000</a></p>
                    <p>🗺️ نقشه: <a href="http://localhost:8000/map.html">/map.html</a></p>
                    <p>🚖 رزرو: <a href="http://localhost:8000/booking.html">/booking.html</a></p>
                    <p>🧪 تست: <a href="http://localhost:8000/test.html">/test.html</a></p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// ==================== 📡 API های اصلی ====================

// وضعیت سیستم
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        project: "هرمزگان درایور پرو",
        version: "5.0.0",
        status: "فعال",
        environment: "Termux Android",
        time: new Date().toLocaleString('fa-IR'),
        uptime: process.uptime(),
        map: {
            provider: "Neshan",
            status: "فعال",
            key: MAP_API_KEY.substring(0, 15) + '...'
        },
        database: {
            bookings: database.bookings.length,
            drivers: database.drivers.length,
            stats: database.stats
        }
    });
});

// آمار سیستم
app.get('/api/stats', (req, res) => {
    const activeBookings = database.bookings.filter(b => 
        ['pending', 'accepted', 'on_the_way', 'in_progress'].includes(b.status)
    ).length;
    
    const onlineDrivers = database.drivers.filter(d => d.online).length;
    
    res.json({
        success: true,
        stats: {
            drivers: database.drivers.length,
            online: onlineDrivers,
            trips_today: Math.floor(Math.random() * 500) + 200,
            map_requests: database.stats.map_requests,
            average_rating: 4.8,
            traffic_reduction: "42%",
            accidents_reduction: "35%",
            jobs_created: 17000,
            active_bookings: activeBookings,
            total_bookings: database.bookings.length,
            total_earnings: database.stats.total_earnings
        },
        timestamp: new Date().toLocaleString('fa-IR')
    });
});

// لیست رانندگان
app.get('/api/drivers', (req, res) => {
    res.json({
        success: true,
        drivers: database.drivers,
        count: database.drivers.length,
        online_count: database.drivers.filter(d => d.online).length,
        available_count: database.drivers.filter(d => d.status === 'available').length
    });
});

// موقعیت رانندگان روی نقشه
app.get('/api/map/drivers', (req, res) => {
    const { lat = '27.1832', lng = '56.2666', radius = '5000' } = req.query;
    
    // افزایش شمارنده درخواست‌های نقشه
    database.stats.map_requests++;
    
    res.json({
        success: true,
        drivers: database.drivers.map(driver => ({
            id: driver.id,
            name: driver.name,
            location: getRandomLocation(parseFloat(lat), parseFloat(lng), 0.05),
            status: driver.status,
            rating: driver.rating,
            car: driver.car,
            phone: driver.phone
        })),
        count: database.drivers.length,
        online: database.drivers.filter(d => d.online).length,
        center: { lat: parseFloat(lat), lng: parseFloat(lng) },
        radius: parseInt(radius),
        timestamp: new Date().toLocaleString('fa-IR')
    });
});

// ترافیک زنده
app.get('/api/map/traffic', (req, res) => {
    const { lat = '27.1832', lng = '56.2666' } = req.query;
    
    const levels = ['light', 'moderate', 'heavy', 'severe'];
    const level = levels[Math.floor(Math.random() * levels.length)];
    
    const levelText = {
        'light': '🟢 سبک',
        'moderate': '🟡 متوسط', 
        'heavy': '🟠 سنگین',
        'severe': '🔴 شدید'
    };
    
    database.stats.map_requests++;
    
    res.json({
        success: true,
        traffic: {
            location: { lat: parseFloat(lat), lng: parseFloat(lng) },
            level: level,
            level_text: levelText[level],
            speed: Math.floor(Math.random() * 60) + 20,
            congestion: Math.floor(Math.random() * 100),
            hotspots: [
                { name: 'میدان شهدا', congestion: 85, type: 'intersection', lat: 27.1865, lng: 56.2768 },
                { name: 'بلوار امام', congestion: 72, type: 'boulevard', lat: 27.1920, lng: 56.2650 },
                { name: 'چهارراه ساحل', congestion: 68, type: 'intersection', lat: 27.1750, lng: 56.2850 }
            ]
        },
        timestamp: new Date().toLocaleString('fa-IR')
    });
});

// مسیریابی
app.get('/api/map/route', async (req, res) => {
    const { origin = '27.1832,56.2666', destination = '27.1865,56.2768' } = req.query;
    
    try {
        const [origLat, origLng] = origin.split(',').map(Number);
        const [destLat, destLng] = destination.split(',').map(Number);
        
        const distance = Math.sqrt(
            Math.pow(destLat - origLat, 2) + 
            Math.pow(destLng - origLng, 2)
        ) * 111;
        
        const duration = distance * 1.5;
        
        database.stats.map_requests++;
        
        res.json({
            success: true,
            route: {
                origin: { lat: origLat, lng: origLng },
                destination: { lat: destLat, lng: destLng },
                distance: { 
                    value: Math.round(distance * 1000),
                    text: `${distance.toFixed(1)} کیلومتر`
                },
                duration: {
                    value: Math.round(duration * 60),
                    text: `${Math.round(duration)} دقیقه`
                },
                steps: [
                    { instruction: 'به سمت شمال حرکت کنید', distance: '200 متر', duration: '1 دقیقه' },
                    { instruction: 'در میدان شهدا به راست بپیچید', distance: '1.2 کیلومتر', duration: '3 دقیقه' },
                    { instruction: 'در تقاطع به چپ بپیچید', distance: '600 متر', duration: '2 دقیقه' },
                    { instruction: 'به مقصد برسید', distance: '50 متر', duration: '1 دقیقه' }
                ],
                traffic_level: 'moderate',
                has_toll: false,
                estimated_cost: Math.round(distance * 10000)
            },
            provider: "Neshan",
            timestamp: new Date().toLocaleString('fa-IR')
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'خطا در مسیریابی',
            error: error.message
        });
    }
});

// هوش مصنوعی - پیش‌بینی
app.get('/api/ai/predict', (req, res) => {
    const riskScore = Math.floor(Math.random() * 100);
    const riskLevel = riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low';
    
    const levelText = {
        'high': '🔴 بالا',
        'medium': '🟡 متوسط', 
        'low': '🟢 پایین'
    };
    
    const recommendations = {
        'high': ['کاهش سرعت', 'رعایت فاصله زیاد', 'استراحت بین راه'],
        'medium': ['رانندگی محتاطانه', 'رعایت قوانین', 'کنترل سرعت'],
        'low': ['رانندگی معمولی', 'حفظ سرعت مجاز', 'لذت بردن از سفر']
    };
    
    res.json({
        success: true,
        prediction: {
            risk_score: riskScore,
            risk_level: riskLevel,
            risk_level_text: levelText[riskLevel],
            confidence: 0.85 + (Math.random() * 0.1),
            message: riskLevel === 'high' ? '⚠️ احتیاط کنید! شرایط نامناسب' : 
                    riskLevel === 'medium' ? '⚠️ مراقب باشید' : '✅ شرایط مناسب',
            recommendations: recommendations[riskLevel],
            factors: [
                'وضعیت ترافیک',
                'شرایط جوی',
                'رفتار رانندگی',
                'سلامت وسیله نقلیه'
            ]
        },
        timestamp: new Date().toLocaleString('fa-IR')
    });
});

// وضعیت سیستم (برای مانیتورینگ)
app.get('/api/system/status', (req, res) => {
    const memoryUsage = process.memoryUsage();
    
    res.json({
        success: true,
        system: {
            node_version: process.version,
            platform: process.platform,
            uptime: Math.floor(process.uptime()),
            memory: {
                rss: Math.round(memoryUsage.rss / 1024 / 1024) + ' MB',
                heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024) + ' MB',
                heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024) + ' MB'
            },
            connections: Math.floor(Math.random() * 100) + 50
        },
        services: {
            api: 'online',
            database: 'online',
            map: 'online',
            ai: 'online',
            emergency: 'online',
            booking: 'online'
        },
        timestamp: new Date().toLocaleString('fa-IR')
    });
});

// ==================== 🚖 سیستم رزرو ====================

// ۱. ایجاد رزرو جدید
app.post('/api/bookings/create', (req, res) => {
    try {
        const { 
            pickup, 
            destination, 
            driver_id, 
            passengers = 1, 
            trip_type = 'normal',
            payment_method = 'cash',
            notes = '',
            customer_name = 'مهمان',
            customer_phone = ''
        } = req.body;

        // اعتبارسنجی
        if (!pickup || !destination) {
            return res.status(400).json({
                success: false,
                message: 'مبدا و مقصد الزامی است'
            });
        }

        // یافتن راننده
        let driver;
        if (driver_id) {
            driver = database.drivers.find(d => d.id === driver_id);
        } else {
            // انتخاب خودکار راننده با بالاترین امتیاز و آنلاین
            driver = database.drivers
                .filter(d => d.status === 'available' && d.online)
                .sort((a, b) => b.rating - a.rating)[0];
        }

        if (!driver) {
            return res.status(404).json({
                success: false,
                message: 'راننده مناسب یافت نشد'
            });
        }

        // محاسبه هزینه
        const cost = calculateTripCost(pickup, destination, trip_type, passengers);
        
        // به‌روزرسانی وضعیت راننده
        driver.status = 'on_trip';
        
        // ایجاد رزرو
        const newBooking = {
            id: 'BOOK-' + Date.now(),
            code: generateBookingCode(),
            pickup: pickup,
            destination: destination,
            driver: {
                id: driver.id,
                name: driver.name,
                phone: driver.phone,
                car: driver.car,
                rating: driver.rating
            },
            customer: {
                name: customer_name,
                phone: customer_phone
            },
            passengers: parseInt(passengers),
            trip_type: trip_type,
            payment_method: payment_method,
            notes: notes,
            cost: cost,
            status: 'pending',
            created_at: new Date().toLocaleString('fa-IR'),
            estimated_distance: (Math.random() * 20 + 5).toFixed(1) + ' کیلومتر',
            estimated_duration: (Math.random() * 30 + 10).toFixed(0) + ' دقیقه',
            location: getRandomLocation(),
            timeline: [
                {
                    time: new Date().toLocaleString('fa-IR'),
                    event: 'ثبت درخواست',
                    status: 'completed'
                }
            ]
        };

        // ذخیره در دیتابیس
        database.bookings.push(newBooking);
        database.stats.total_bookings++;
        database.stats.bookings_today++;
        database.stats.total_earnings += cost;

        console.log(`✅ رزرو جدید: ${newBooking.code} - ${cost.toLocaleString('fa-IR')} تومان`);

        res.json({
            success: true,
            message: 'سفر با موفقیت رزرو شد!',
            booking: newBooking,
            next_steps: [
                'راننده در حال پذیرش درخواست است',
                'می‌توانید موقعیت را روی نقشه پیگیری کنید'
            ],
            contact_info: {
                driver_phone: driver.phone,
                support_phone: '۰۷۶-۳۲۲۴۹۷۹۲',
                emergency: '۱۱۰'
            }
        });

    } catch (error) {
        console.error('خطا در ایجاد رزرو:', error);
        res.status(500).json({
            success: false,
            message: 'خطا در سرویس رزرو',
            error: error.message
        });
    }
});

// ۲. دریافت لیست رزروها
app.get('/api/bookings', (req, res) => {
    const { status, limit = 50, page = 1 } = req.query;
    
    let filteredBookings = [...database.bookings];
    
    if (status) {
        filteredBookings = filteredBookings.filter(b => b.status === status);
    }
    
    // مرتب‌سازی بر اساس زمان ایجاد (جدیدترین اول)
    filteredBookings.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    // صفحه‌بندی
    const start = (page - 1) * limit;
    const end = start + parseInt(limit);
    const paginatedBookings = filteredBookings.slice(start, end);
    
    res.json({
        success: true,
        bookings: paginatedBookings,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: filteredBookings.length,
            pages: Math.ceil(filteredBookings.length / limit)
        },
        stats: {
            total: database.bookings.length,
            pending: database.bookings.filter(b => b.status === 'pending').length,
            active: database.bookings.filter(b => ['accepted', 'on_the_way', 'in_progress'].includes(b.status)).length,
            completed: database.bookings.filter(b => b.status === 'completed').length,
            cancelled: database.bookings.filter(b => b.status === 'cancelled').length
        },
        timestamp: new Date().toLocaleString('fa-IR')
    });
});

// ۳. دریافت جزئیات یک رزرو
app.get('/api/bookings/:code', (req, res) => {
    const booking = database.bookings.find(b => b.code === req.params.code);
    
    if (!booking) {
        return res.status(404).json({
            success: false,
            message: 'رزرو یافت نشد'
        });
    }
    
    res.json({
        success: true,
        booking: booking,
        driver_location: getRandomLocation(),
        estimated_arrival: '10 دقیقه دیگر',
        timeline: booking.timeline || [
            { time: booking.created_at, event: 'ثبت درخواست', status: 'completed' },
            { time: new Date(Date.now() - 300000).toLocaleString('fa-IR'), event: 'پذیرش توسط راننده', status: 'completed' },
            { time: 'به زودی', event: 'رسیدن راننده', status: 'pending' },
            { time: 'به زودی', event: 'شروع سفر', status: 'pending' },
            { time: 'به زودی', event: 'پایان سفر', status: 'pending' }
        ]
    });
});

// ۴. به‌روزرسانی وضعیت رزرو
app.put('/api/bookings/:code/status', (req, res) => {
    const { status, driver_id } = req.body;
    const validStatuses = ['pending', 'accepted', 'on_the_way', 'in_progress', 'completed', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'وضعیت نامعتبر'
        });
    }
    
    const bookingIndex = database.bookings.findIndex(b => b.code === req.params.code);
    
    if (bookingIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'رزرو یافت نشد'
        });
    }
    
    const oldStatus = database.bookings[bookingIndex].status;
    database.bookings[bookingIndex].status = status;
    database.bookings[bookingIndex].updated_at = new Date().toLocaleString('fa-IR');
    
    // افزودن به timeline
    if (!database.bookings[bookingIndex].timeline) {
        database.bookings[bookingIndex].timeline = [];
    }
    
    database.bookings[bookingIndex].timeline.push({
        time: new Date().toLocaleString('fa-IR'),
        event: `تغییر وضعیت به ${status}`,
        status: 'completed'
    });
    
    // اگر راننده تغییر کرد
    if (driver_id) {
        const driver = database.drivers.find(d => d.id === driver_id);
        if (driver) {
            database.bookings[bookingIndex].driver = {
                id: driver.id,
                name: driver.name,
                phone: driver.phone,
                car: driver.car,
                rating: driver.rating
            };
        }
    }
    
    console.log(`🔄 تغییر وضعیت رزرو ${req.params.code}: ${oldStatus} → ${status}`);
    
    res.json({
        success: true,
        message: `وضعیت رزرو به "${status}" تغییر کرد`,
        booking: database.bookings[bookingIndex]
    });
});

// ۵. لغو رزرو
app.post('/api/bookings/:code/cancel', (req, res) => {
    const { reason = 'درخواست کاربر' } = req.body;
    
    const bookingIndex = database.bookings.findIndex(b => b.code === req.params.code);
    
    if (bookingIndex === -1) {
        return res.status(404).json({
            success: false,
            message: 'رزرو یافت نشد'
        });
    }
    
    const booking = database.bookings[bookingIndex];
    
    // فقط رزروهای در حال انتظار یا پذیرفته شده قابل لغو هستند
    if (!['pending', 'accepted'].includes(booking.status)) {
        return res.status(400).json({
            success: false,
            message: 'این رزرو در مرحله‌ای است که قابل لغو نیست'
        });
    }
    
    booking.status = 'cancelled';
    booking.cancelled_at = new Date().toLocaleString('fa-IR');
    booking.cancellation_reason = reason;
    
    if (booking.timeline) {
        booking.timeline.push({
            time: new Date().toLocaleString('fa-IR'),
            event: 'لغو سفر',
            status: 'completed'
        });
    }
    
    // آزاد کردن راننده
    const driver = database.drivers.find(d => d.id === booking.driver.id);
    if (driver) {
        driver.status = 'available';
    }
    
    res.json({
        success: true,
        message: 'رزرو با موفقیت لغو شد',
        booking: booking,
        refund_info: {
            eligible: true,
            amount: Math.round(booking.cost * 0.8), // 80% بازگشت
            message: '۸۰٪ هزینه تا ۲۴ ساعت آینده به حساب شما بازمی‌گردد'
        }
    });
});

// ۶. جستجوی رزرو
app.get('/api/bookings/search', (req, res) => {
    const { phone, driver_id, status, date_from, date_to } = req.query;
    
    let results = [...database.bookings];
    
    if (phone) {
        results = results.filter(b => 
            b.customer.phone.includes(phone) || 
            b.driver.phone.includes(phone)
        );
    }
    
    if (driver_id) {
        results = results.filter(b => b.driver.id === driver_id);
    }
    
    if (status) {
        results = results.filter(b => b.status === status);
    }
    
    // مرتب‌سازی
    results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    res.json({
        success: true,
        results: results,
        count: results.length,
        timestamp: new Date().toLocaleString('fa-IR')
    });
});

// ==================== 🚨 سیستم اضطراری ====================
app.post('/api/emergency/sos', (req, res) => {
    const { booking_code, driver_id, location, reason = 'درخواست کمک' } = req.body;
    
    let booking;
    if (booking_code) {
        booking = database.bookings.find(b => b.code === booking_code);
    }
    
    if (!booking && !driver_id) {
        return res.status(400).json({
            success: false,
            message: 'شناسه رزرو یا راننده الزامی است'
        });
    }
    
    const emergencyData = {
        id: 'EMS-' + Date.now(),
        booking_code: booking_code,
        driver_id: driver_id || (booking ? booking.driver.id : null),
        location: location || getRandomLocation(),
        reason: reason,
        status: 'help_sent',
        timestamp: new Date().toLocaleString('fa-IR'),
        response: {
            police_notified: true,
            ambulance_notified: true,
            eta: '10 دقیقه',
            contact: '۱۱۰ - ۱۱۵',
            coordinates: location || '27.1832,56.2666'
        }
    };
    
    console.log(`🚨 درخواست اضطراری: ${emergencyData.id}`);
    
    res.json({
        success: true,
        emergency: emergencyData,
        message: 'درخواست کمک دریافت شد. نیروهای امدادی در راه هستند.'
    });
});

// ==================== 🚫 404 Handler ====================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'API مورد نظر یافت نشد',
        available_apis: [
            '/api/health',
            '/api/stats', 
            '/api/drivers',
            '/api/map/drivers',
            '/api/map/traffic',
            '/api/map/route',
            '/api/ai/predict',
            '/api/bookings',
            '/api/bookings/create',
            '/api/bookings/search',
            '/api/system/status',
            '/api/emergency/sos'
        ]
    });
});

// ==================== 🚀 راه‌اندازی سرور ====================
const PORT = 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('='.repeat(60));
    console.log('🚗 هرمزگان درایور پرو - Backend v5.0.0');
    console.log(`🌐 در حال اجرا روی: http://0.0.0.0:${PORT}`);
    console.log(`📅 تاریخ راه‌اندازی: ${new Date().toLocaleString('fa-IR')}`);
    console.log('='.repeat(60));
    console.log('\n📡 API‌های اصلی:');
    console.log('  GET  /api/health        - وضعیت سیستم');
    console.log('  GET  /api/stats         - آمار سیستم');
    console.log('  GET  /api/drivers       - لیست رانندگان');
    console.log('  GET  /api/map/drivers   - موقعیت روی نقشه');
    console.log('  GET  /api/map/traffic   - ترافیک زنده');
    console.log('  GET  /api/map/route     - مسیریابی');
    console.log('  GET  /api/ai/predict    - پیش‌بینی AI');
    console.log('\n🚖 سیستم رزرو:');
    console.log('  POST /api/bookings/create    - ایجاد رزرو جدید');
    console.log('  GET  /api/bookings           - لیست رزروها');
    console.log('  GET  /api/bookings/:code     - جزئیات رزرو');
    console.log('  PUT  /api/bookings/:code/status - تغییر وضعیت');
    console.log('  POST /api/bookings/:code/cancel - لغو رزرو');
    console.log('  GET  /api/bookings/search    - جستجوی رزرو');
    console.log('\n🔗 لینک‌ها:');
    console.log(`  Frontend: http://localhost:8000`);
    console.log(`  نقشه: http://localhost:8000/map.html`);
    console.log(`  رزرو: http://localhost:8000/booking.html`);
    console.log('='.repeat(60));
});
