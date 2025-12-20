#!/bin/bash
# HDP Starter Script

G='\033[0;32m'; R='\033[0;31m'; Y='\033[1;33m'; C='\033[0;36m'; NC='\033[0m'

echo -e "${C}🚗 HDP - شروع راه‌اندازی...${NC}\n"

# توقف سرویس‌های قبلی
pkill -f "node.*server" 2>/dev/null
pkill -f "python.*http.server" 2>/dev/null
sleep 1

# پیدا کردن پروژه
if [ -d ~/hdp-real ]; then
    PROJECT=~/hdp-real
elif [ -d ~/hormozgan-driver-pro ]; then
    PROJECT=~/hormozgan-driver-pro
else
    echo -e "${R}❌ پروژه یافت نشد!${NC}"
    exit 1
fi

echo -e "${G}✅ پروژه: $PROJECT${NC}"

# Backend
echo -e "${Y}🚀 راه‌اندازی Backend...${NC}"
cd "$PROJECT/backend"
node server.js > /tmp/hdp-back.log 2>&1 &
echo "Backend PID: $!"

sleep 3

# تست Backend
if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo -e "${G}✅ Backend فعال (پورت 3000)${NC}"
else
    echo -e "${R}❌ Backend خطا دارد!${NC}"
    tail -10 /tmp/hdp-back.log
    exit 1
fi

# Frontend
echo -e "${Y}🌐 راه‌اندازی Frontend...${NC}"
cd "$PROJECT/frontend"
python -m http.server 8000 > /tmp/hdp-front.log 2>&1 &
echo "Frontend PID: $!"

sleep 2

echo ""
echo -e "${G}╔═══════════════════════════════════╗${NC}"
echo -e "${G}║     ✅ HDP آماده است!          ║${NC}"
echo -e "${G}╚═══════════════════════════════════╝${NC}"
echo ""
echo -e "${C}📍 آدرس‌ها:${NC}"
echo "   Dashboard: http://localhost:8000"
echo "   Map:       http://localhost:8000/map.html"
echo "   Backend:   http://localhost:3000"
echo ""
echo -e "${Y}باز کردن نقشه...${NC}"
termux-open-url http://localhost:8000/map.html
