#!/bin/bash

# Simple script to push Hormozgan Driver Pro to GitHub

echo "🚀 در حال آپلود پروژه به GitHub..."

# Get username
read -p "👤 نام کاربری GitHub شما: " username

# Get repository name
repo_name="hormozgan-driver-pro"

# Check if remote exists
if git remote | grep -q origin; then
    echo "🔄 Remote 'origin' از قبل وجود دارد"
    git remote remove origin
fi

# Add remote
git remote add origin "https://github.com/$username/$repo_name.git"

# Check if we can connect
echo "🔗 در حال آزمایش اتصال..."
if git ls-remote origin &> /dev/null; then
    echo "✅ اتصال برقرار شد"
else
    echo "❌ مخزن وجود ندارد. آیا می‌خواهید ایجاد کنید؟"
    read -p "ساخت مخزن جدید؟ (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "در حال ایجاد مخزن جدید..."
        # Try to create via API if token exists
        if [[ -n "$GH_TOKEN" ]]; then
            curl -X POST \
                -H "Authorization: token $GH_TOKEN" \
                -H "Accept: application/vnd.github.v3+json" \
                https://api.github.com/user/repos \
                -d "{\"name\":\"$repo_name\",\"description\":\"پروژه جامع سامانه رانندگان استان هرمزگان\",\"public\":true}"
        else
            echo "⚠️  لطفاً مخزن را به صورت دستی ایجاد کنید:"
            echo "1. به https://github.com/new بروید"
            echo "2. نام مخزن را '$repo_name' قرار دهید"
            echo "3. توضیحات: 'پروژه جامع سامانه رانندگان استان هرمزگان'"
            echo "4. Public را انتخاب کنید"
            echo "5. Create repository را بزنید"
            read -p "پس از ایجاد مخزن، Enter را بزنید..." -n 1 -r
        fi
    else
        echo "❌ عملیات لغو شد"
        exit 1
    fi
fi

# Change branch name to main
git branch -M main

# Push to GitHub
echo "⬆️ در حال آپلود فایل‌ها..."
git push -u origin main

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 پروژه با موفقیت آپلود شد!"
    echo "🌐 آدرس: https://github.com/$username/$repo_name"
    echo ""
    echo "📁 ساختار پروژه:"
    echo "├── frontend/ - رابط کاربری"
    echo "├── backend/ - سرور و API"
    echo "├── README.md - مستندات"
    echo "└── INSTALL.md - راهنمای نصب"
    echo ""
    echo "🚀 برای اجرای پروژه:"
    echo "php -S localhost:8000 -t frontend"
else
    echo "❌ خطا در آپلود"
    echo "ممکن است نیاز به احراز هویت داشته باشید:"
    echo "1. gh auth login"
    echo "2. یا export GH_TOKEN='your_token'"
fi
