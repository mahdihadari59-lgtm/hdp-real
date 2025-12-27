#!/data/data/com.termux/files/usr/bin/bash

echo "🎯 راه‌اندازی قطعی HDP"
echo "====================="

cd ~/hdp-real

# 1. بررسی فایل‌های موجود
echo "📁 فایل‌های .js موجود:"
ls -la *.js 2>/dev/null || echo "هیچ فایل .js یافت نشد"

# 2. اگر server.js نیست، ایجاد کنیم
if [ ! -f "server.js" ]; then
    echo "📝 ایجاد فایل server.js..."
    
    # بررسی neshan-service.js
    if [ -f "neshan-service.js" ]; then
        echo "📋 استفاده از neshan-service.js"
        head -5 neshan-service.js
        cp neshan-service.js server.js
    else
        # ایجاد server.js ساده
        cat > server.js << 'SERVERJS'
// Simple HDP Server
const express = require('express');
const app = express();
const PORT = 8000;

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head><title>HDP Server</title></head>
        <body>
            <h1>🚕 هرمزگان درایور پرو</h1>
            <p>سرور فعال است</p>
            <p>ورژن: 2.0.0</p>
            <p>پورت: ${PORT}</p>
        </body>
        </html>
    `);
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log('Server running on port ' + PORT);
});
SERVERJS
    fi
fi

# 3. بررسی وجود server.js
if [ ! -f "server.js" ]; then
    echo "❌ هنوز server.js ایجاد نشده!"
    exit 1
fi

echo "✅ فایل server.js آماده است"
ls -la server.js

# 4. نصب وابستگی‌ها
echo "📦 نصب وابستگی‌ها..."
npm install express --quiet

# 5. توقف قبلی
echo "🛑 توقف سرویس‌های قبلی..."
pkill -f "node" 2>/dev/null
sleep 2

# 6. اجرا
echo "🚀 اجرای server.js..."
node server.js
