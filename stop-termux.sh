#!/data/data/com.termux/files/usr/bin/bash

echo "🛑 توقف سیستم هرمزگان درایور پرو..."

# توقف Backend
if [ -f ~/hdp-real/.backend_pid ]; then
    BACKEND_PID=$(cat ~/hdp-real/.backend_pid)
    kill $BACKEND_PID 2>/dev/null && echo "✅ Backend متوقف شد"
    rm ~/hdp-real/.backend_pid
fi

# توقف Frontend
if [ -f ~/hdp-real/.frontend_pid ]; then
    FRONTEND_PID=$(cat ~/hdp-real/.frontend_pid)
    kill $FRONTEND_PID 2>/dev/null && echo "✅ Frontend متوقف شد"
    rm ~/hdp-real/.frontend_pid
fi

# توقف سرور استاتیک
if [ -f ~/hdp-real/.static_pid ]; then
    STATIC_PID=$(cat ~/hdp-real/.static_pid)
    kill $STATIC_PID 2>/dev/null && echo "✅ سرور استاتیک متوقف شد"
    rm ~/hdp-real/.static_pid
fi

# توقف PostgreSQL
pg_ctl -D ~/pgdata stop 2>/dev/null && echo "✅ PostgreSQL متوقف شد"

echo ""
echo "✅ همه سرویس‌ها متوقف شدند"
