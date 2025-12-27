#!/data/data/com.termux/files/usr/bin/bash

echo "📊 وضعیت سیستم هرمزگان درایور پرو"
echo "================================"

# بررسی PostgreSQL
if pg_ctl -D ~/pgdata status | grep -q "server is running"; then
    echo "✅ PostgreSQL: در حال اجرا"
else
    echo "❌ PostgreSQL: متوقف"
fi

# بررسی Backend
if [ -f ~/hdp-real/.backend_pid ]; then
    BACKEND_PID=$(cat ~/hdp-real/.backend_pid)
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "✅ Backend API: در حال اجرا (PID: $BACKEND_PID)"
    else
        echo "❌ Backend API: متوقف"
    fi
else
    echo "❌ Backend API: متوقف"
fi

# بررسی Frontend
if [ -f ~/hdp-real/.frontend_pid ]; then
    FRONTEND_PID=$(cat ~/hdp-real/.frontend_pid)
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "✅ Frontend: در حال اجرا (PID: $FRONTEND_PID)"
    else
        echo "❌ Frontend: متوقف"
    fi
else
    echo "⚪ Frontend: راه‌اندازی نشده"
fi

# تست اتصال
echo ""
echo "🧪 تست اتصال:"
if curl -s http://localhost:8000/ > /dev/null; then
    echo "✅ Backend پاسخگو است"
else
    echo "❌ Backend پاسخگو نیست"
fi
