#!/bin/bash

echo "🚀 آپلود پروژه hdpreal به GitHub"

cd ~/hdp-real

# 1. اضافه کردن فایل‌ها
echo "📁 اضافه کردن فایل‌ها..."
git add --all

# 2. commit
echo "💾 ذخیره تغییرات..."
git commit -m "هرمزگان درایور پرو - سیستم هوشمند رانندگان بندرعباس

یک سامانه کامل برای مدیریت و بهینه‌سازی خدمات حمل‌ونقل
در استان هرمزگان با قابلیت‌های مدرن و رابط کاربری فارسی"

# 3. push
echo ""
echo "⬆️ در حال آپلود به GitHub..."
echo ""
echo "⚠️  اگر از شما نام کاربری و رمز خواسته شد:"
echo "    Username: mahdihadari59-lgtm"
echo "    Password: باید GitHub Personal Access Token وارد کنید"
echo ""
echo "    برای ایجاد توکن: https://github.com/settings/tokens"
echo "    (فقط scope 'repo' را انتخاب کنید)"
echo ""

git push -u origin main

# بررسی نتیجه
if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 🎉 🎉 موفقیت! 🎉 🎉 🎉"
    echo ""
    echo "✅ پروژه با موفقیت در GitHub آپلود شد"
    echo "🌐 آدرس مخزن:"
    echo "    https://github.com/mahdihadari59-lgtm/hdpreal"
    echo ""
    echo "📊 برای کلون کردن:"
    echo "    git clone https://github.com/mahdihadari59-lgtm/hdpreal.git"
    echo ""
    echo "🚀 برای اجرای پروژه:"
    echo "    cd hdpreal"
    echo "    php -S localhost:8000 -t frontend"
    echo ""
    echo "📱 دسترسی:"
    echo "    • http://localhost:8000"
    echo "    • http://localhost:8000/admin.html"
    echo "    • http://localhost:8000/login.html"
else
    echo ""
    echo "❌ خطا در آپلود"
    echo ""
    echo "🔧 راه‌حل‌های جایگزین:"
    echo "1. از SSH استفاده کنید:"
    echo "   git remote set-url origin git@github.com:mahdihadari59-lgtm/hdpreal.git"
    echo "2. یا فایل‌ها را از طریق وب آپلود کنید"
    echo "3. یا همین الان پروژه را اجرا کنید"
fi
