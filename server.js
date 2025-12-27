const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

console.log('🚀 HDP Enhanced Backend');

// داده‌های نمونه
let drivers = [
    { id: 1, name: 'رضا محمدی', phone: '09121234567', car: 'پراید', isOnline: true },
    { id: 2, name: 'علی کریمی', phone: '09129876543', car: 'پژو', isOnline: false }
];

let bookings = [
    { id: 1, passenger: 'احمدی', phone: '09123456789', from: 'مرکز', to: 'فرودگاه', status: 'pending' }
];

// Routes
app.get('/', (req, res) => {
    res.json({
        app: 'هرمزگان درایور پرو',
        version: '2.0.0',
        status: 'فعال',
        endpoints: {
            health: '/api/health',
            stats: '/api/stats',
            drivers: '/api/drivers',
            bookings: '/api/bookings',
            register: '/api/drivers/register'
        }
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        server: 'Node.js Express',
        drivers: drivers.length,
        bookings: bookings.length,
        onlineDrivers: drivers.filter(d => d.isOnline).length
    });
});

app.get('/api/stats', (req, res) => {
    res.json({
        drivers: drivers.length,
        bookings: bookings.length,
        online: drivers.filter(d => d.isOnline).length,
        pending: bookings.filter(b => b.status === 'pending').length
    });
});

app.get('/api/drivers', (req, res) => {
    res.json(drivers);
});

app.post('/api/drivers/register', (req, res) => {
    const driver = {
        id: drivers.length + 1,
        ...req.body,
        isOnline: true,
        rating: 5.0,
        createdAt: new Date().toISOString()
    };
    
    drivers.push(driver);
    res.json({ success: true, driver });
});

app.get('/api/bookings', (req, res) => {
    res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
    const booking = {
        id: bookings.length + 1,
        ...req.body,
        status: 'pending',
        createdAt: new Date().toISOString()
    };
    
    bookings.push(booking);
    res.json({ success: true, booking });
});

// Route جدید برای تست
app.get('/api/test/all', (req, res) => {
    res.json({
        system: 'HDP Backend',
        version: '2.0.0',
        data: { drivers, bookings },
        count: { drivers: drivers.length, bookings: bookings.length }
    });
});

app.listen(PORT, () => {
    console.log(`✅ سرور روی پورت ${PORT} اجرا شد`);
    console.log(`🔗 http://localhost:${PORT}`);
    console.log('📋 Endpoints:');
    console.log('   GET  /');
    console.log('   GET  /api/health');
    console.log('   GET  /api/stats');
    console.log('   GET  /api/drivers');
    console.log('   POST /api/drivers/register');
    console.log('   GET  /api/bookings');
    console.log('   POST /api/bookings');
    console.log('   GET  /api/test/all');
});
