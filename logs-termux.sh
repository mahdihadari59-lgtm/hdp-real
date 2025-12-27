#!/data/data/com.termux/files/usr/bin/bash

echo "📋 مشاهده لاگ‌های سیستم"
echo "======================"

echo ""
echo "🔵 لاگ Backend (10 خط آخر):"
echo "--------------------------"
tail -10 ~/hdp-real/backend/backend.log 2>/dev/null || echo "فایل لاگ یافت نشد"

echo ""
echo "🟢 لاگ Frontend (اگر وجود دارد):"
echo "-------------------------------"
tail -10 ~/hdp-real/frontend.log 2>/dev/null || echo "فایل لاگ یافت نشد"

echo ""
echo "🟡 لاگ PostgreSQL:"
echo "-----------------"
tail -10 ~/pgdata/log/*.log 2>/dev/null || echo "فایل لاگ یافت نشد"

echo ""
echo "📌 برای مشاهده لاگ زنده:"
echo "   tail -f ~/hdp-real/backend/backend.log"
