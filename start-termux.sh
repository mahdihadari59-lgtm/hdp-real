#!/data/data/com.termux/files/usr/bin/bash

echo "🚀 راه‌اندازی هرمزگان درایور پرو در Termux"
echo "========================================="

# رنگ‌ها
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# توابع
success() { echo -e "${GREEN}✅ $1${NC}"; }
error() { echo -e "${RED}❌ $1${NC}"; }
info() { echo -e "${BLUE}ℹ️  $1${NC}"; }
warning() { echo -e "${YELLOW}⚠️  $1${NC}"; }

# 1. بررسی پیش‌نیازها
info "بررسی پیش‌نیازها..."

# بررسی پایتون
if command -v python &> /dev/null; then
    success "پایتون نصب است"
else
    error "پایتون نصب نیست. در حال نصب..."
    pkg install python -y
fi

# بررسی pip
if command -v pip &> /dev/null; then
    success "pip نصب است"
else
    pkg install python-pip -y
fi

# 2. راه‌اندازی PostgreSQL
info "راه‌اندازی PostgreSQL..."

# متوقف کردن اگر در حال اجراست
pg_ctl -D ~/pgdata stop 2>/dev/null

# شروع PostgreSQL
pg_ctl -D ~/pgdata start
sleep 3

# بررسی وضعیت PostgreSQL
if pg_ctl -D ~/pgdata status | grep -q "server is running"; then
    success "PostgreSQL در حال اجراست"
else
    warning "PostgreSQL شروع نمی‌شود. تلاش برای راه‌اندازی..."
    
    # راه‌اندازی مجدد
    initdb -D ~/pgdata 2>/dev/null || true
    pg_ctl -D ~/pgdata start
    sleep 3
fi

# 3. ایجاد دیتابیس (اگر وجود ندارد)
info "تنظیم دیتابیس..."
createdb hdp_database 2>/dev/null || warning "دیتابیس از قبل وجود دارد"

# 4. راه‌اندازی Backend
info "راه‌اندازی Backend API..."

# رفتن به دایرکتوری backend
cd ~/hdp-real/backend

# نصب وابستگی‌ها
info "نصب وابستگی‌های پایتون..."
pip install fastapi uvicorn sqlalchemy psycopg2-binary pydantic python-jose passlib alembic python-dotenv --quiet

# ایجاد فایل .env
cat > .env << 'ENVEOF'
DATABASE_URL=postgresql://hdp_admin:hdp123456@localhost:5432/hdp_database
SECRET_KEY=hdp-termux-secret-key-2024
CORS_ORIGINS=http://localhost:3000,http://localhost:8080
ENVEOF

# راه‌اندازی FastAPI در پس‌زمینه
info "راه‌اندازی سرور FastAPI..."
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload > backend.log 2>&1 &
BACKEND_PID=$!

# صبر کردن برای راه‌اندازی
sleep 5

# 5. راه‌اندازی Frontend (اگر Node.js دارد)
info "بررسی Frontend..."
cd ~/hdp-real/frontend

if [ -f "package.json" ]; then
    info "نصب وابستگی‌های Node.js..."
    npm install --silent
    
    info "راه‌اندازی React در توسعه..."
    nohup npm start > frontend.log 2>&1 &
    FRONTEND_PID=$!
    
    # اگر فایل‌های استاتیک دارد
    if [ -f "index.html" ]; then
        info "راه‌اندازی سرور ساده برای فایل‌های استاتیک..."
        cd ~/hdp-real
        nohup python -m http.server 3000 --bind 0.0.0.0 > static.log 2>&1 &
        STATIC_PID=$!
    fi
else
    warning "فایل package.json یافت نشد. Frontend راه‌اندازی نمی‌شود."
fi

# 6. ایجاد جداول دیتابیس
info "ایجاد جداول دیتابیس..."
cd ~/hdp-real/backend
python -c "
try:
    from main import Base, engine
    Base.metadata.create_all(bind=engine)
    print('✅ جداول دیتابیس ایجاد شدند')
except Exception as e:
    print(f'⚠️  خطا: {e}')
"

# 7. نمایش اطلاعات
echo ""
echo "🎉 سیستم با موفقیت راه‌اندازی شد!"
echo ""
echo "🔗 دسترسی به سرویس‌ها:"
echo "   Backend API:  http://localhost:8000"
echo "   API Docs:     http://localhost:8000/docs"
echo "   Frontend:     http://localhost:3000 (اگر راه‌اندازی شد)"
echo ""
echo "📋 اطلاعات دیتابیس:"
echo "   Host: localhost"
echo "   Port: 5432"
echo "   Database: hdp_database"
echo "   User: hdp_admin"
echo "   Password: hdp123456"
echo ""
echo "📊 دستورات مدیریتی:"
echo "   مشاهده لاگ بک‌اند: tail -f ~/hdp-real/backend/backend.log"
echo "   توقف بک‌اند: kill $BACKEND_PID"
echo "   توقف دیتابیس: pg_ctl -D ~/pgdata stop"
echo "   راه‌اندازی مجدد: ./restart-termux.sh"
echo ""
echo "📞 برای تست:"
echo "   curl http://localhost:8000/"
echo "   curl http://localhost:8000/api/stats"

# ذخیره PIDها
echo $BACKEND_PID > ~/hdp-real/.backend_pid
[ ! -z "$FRONTEND_PID" ] && echo $FRONTEND_PID > ~/hdp-real/.frontend_pid
[ ! -z "$STATIC_PID" ] && echo $STATIC_PID > ~/hdp-real/.static_pid

# نمایش لاگ‌ها
echo ""
info "آخرین خطوط لاگ بک‍اند:"
tail -5 ~/hdp-real/backend/backend.log
