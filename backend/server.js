const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// کلید API نقشه
const NESHAN_API_KEY = "service.a26822ae11b84924a29a13225498abf0";

// دیتابیس ساده
const database = {
    drivers: [],
    trips: [],
    mapRequests: 0
};

// 1. سلامت سیستم با نقشه
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'Backend is running',
        database: {
            drivers: database.drivers.length,
            trips: database.trips.length
        },
        map: {
            service: 'Neshan',
            requests: database.mapRequests
        },
        timestamp: new Date().toISOString()
    });
});

// 2. افزودن راننده
app.post('/api/drivers', (req, res) => {
    try {
        const driver = {
            id: Date.now(),
            name: req.body.name,
            phone: req.body.phone,
            carModel: req.body.carModel,
            carPlate: req.body.carPlate,
            location: req.body.location || { lat: 27.1865, lng: 56.2768 },
            status: 'available',
            createdAt: new Date().toISOString()
        };
        
        database.drivers.push(driver);
        
        res.json({
            success: true,
            message: 'Driver added successfully',
            driver: driver
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error adding driver',
            error: error.message
        });
    }
});

// 3. لیست رانندگان
app.get('/api/drivers', (req, res) => {
    res.json({
        success: true,
        drivers: database.drivers,
        count: database.drivers.length
    });
});

// 4. جستجوی مسیر با نقشه نشان
app.post('/api/route', async (req, res) => {
    try {
        const { origin, destination } = req.body;
        
        database.mapRequests++;
        
        const response = await axios.get('https://api.neshan.org/v4/direction', {
            params: {
                type: 'car',
                origin: `${origin.lat},${origin.lng}`,
                destination: `${destination.lat},${destination.lng}`
            },
            headers: {
                'Api-Key': NESHAN_API_KEY
            }
        });
        
        res.json({
            success: true,
            route: response.data,
            mapService: 'Neshan'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error getting route',
            error: error.message
        });
    }
});

// 5. ایجاد سفر
app.post('/api/trips', (req, res) => {
    try {
        const trip = {
            id: Date.now(),
            driverId: req.body.driverId,
            origin: req.body.origin,
            destination: req.body.destination,
            passenger: req.body.passenger,
            status: 'pending',
            fare: req.body.fare || 0,
            createdAt: new Date().toISOString()
        };
        
        database.trips.push(trip);
        
        // تغییر وضعیت راننده
        const driver = database.drivers.find(d => d.id === trip.driverId);
        if (driver) {
            driver.status = 'busy';
        }
        
        res.json({
            success: true,
            message: 'Trip created successfully',
            trip: trip
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error creating trip',
            error: error.message
        });
    }
});

// 6. لیست سفرها
app.get('/api/trips', (req, res) => {
    res.json({
        success: true,
        trips: database.trips,
        count: database.trips.length
    });
});

// صفحه اصلی
app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="fa" dir="rtl">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Hormozgan Driver Pro - API Backend</title>
            <style>
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                    font-family: 'Segoe UI', Tahoma, sans-serif;
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 20px;
                }
                .container {
                    background: white;
                    border-radius: 20px;
                    padding: 40px;
                    max-width: 800px;
                    box-shadow: 0 20px 60px rgba(0,0,0,0.3);
                }
                h1 {
                    color: #667eea;
                    font-size: 2.5em;
                    margin-bottom: 20px;
                    text-align: center;
                }
                .status {
                    background: #4caf50;
                    color: white;
                    padding: 10px 20px;
                    border-radius: 50px;
                    display: inline-block;
                    margin-bottom: 30px;
                }
                .endpoints {
                    background: #f5f5f5;
                    padding: 20px;
                    border-radius: 10px;
                    margin: 20px 0;
                }
                .endpoint {
                    margin: 15px 0;
                    padding: 15px;
                    background: white;
                    border-radius: 8px;
                    border-left: 4px solid #667eea;
                }
                .method {
                    display: inline-block;
                    padding: 5px 15px;
                    border-radius: 5px;
                    font-weight: bold;
                    margin-left: 10px;
                    font-size: 0.9em;
                }
                .get { background: #4caf50; color: white; }
                .post { background: #2196f3; color: white; }
                code {
                    background: #f0f0f0;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-family: 'Courier New', monospace;
                }
                .stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 20px;
                    margin: 30px 0;
                }
                .stat-card {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 10px;
                    text-align: center;
                }
                .stat-number {
                    font-size: 2em;
                    font-weight: bold;
                    margin: 10px 0;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚗 Hormozgan Driver Pro</h1>
                <div style="text-align: center;">
                    <span class="status">✓ Backend فعال است</span>
                </div>
                
                <div class="stats">
                    <div class="stat-card">
                        <div>رانندگان</div>
                        <div class="stat-number">${database.drivers.length}</div>
                    </div>
                    <div class="stat-card">
                        <div>سفرها</div>
                        <div class="stat-number">${database.trips.length}</div>
                    </div>
                    <div class="stat-card">
                        <div>درخواست‌های نقشه</div>
                        <div class="stat-number">${database.mapRequests}</div>
                    </div>
                </div>

                <h2 style="margin: 30px 0 20px; color: #333;">📡 API Endpoints</h2>
                
                <div class="endpoints">
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <code>/api/health</code>
                        <p style="margin-top: 10px; color: #666;">وضعیت سلامت سیستم</p>
                    </div>
                    
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <code>/api/drivers</code>
                        <p style="margin-top: 10px; color: #666;">لیست تمام رانندگان</p>
                    </div>
                    
                    <div class="endpoint">
                        <span class="method post">POST</span>
                        <code>/api/drivers</code>
                        <p style="margin-top: 10px; color: #666;">افزودن راننده جدید</p>
                    </div>
                    
                    <div class="endpoint">
                        <span class="method get">GET</span>
                        <code>/api/trips</code>
                        <p style="margin-top: 10px; color: #666;">لیست تمام سفرها</p>
                    </div>
                    
                    <div class="endpoint">
                        <span class="method post">POST</span>
                        <code>/api/trips</code>
                        <p style="margin-top: 10px; color: #666;">ایجاد سفر جدید</p>
                    </div>
                    
                    <div class="endpoint">
                        <span class="method post">POST</span>
                        <code>/api/route</code>
                        <p style="margin-top: 10px; color: #666;">محاسبه مسیر با نقشه نشان</p>
                    </div>
                </div>

                <div style="text-align: center; margin-top: 30px; color: #666;">
                    <p>🌐 <a href="http://hormozgandriver.ir" style="color: #667eea;">hormozgandriver.ir</a></p>
                    <p style="margin-top: 10px;">Powered by Node.js + Express + Neshan Maps</p>
                </div>
            </div>
        </body>
        </html>
    `);
});

// راه‌اندازی سرور
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   🚗 Hormozgan Driver Pro Backend     ║
║   ✓ Server is running on port ${PORT}   ║
║   ✓ Neshan Maps integrated            ║
║   🌐 http://localhost:${PORT}            ║
╚════════════════════════════════════════╝
    `);
});
