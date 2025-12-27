#!/bin/bash
echo "🔧 ساخت ریپازیتوری GitHub..."

# ساخت پوشه پروژه
cd ~/hdp-real
mkdir -p hdp-github
cp -r frontend/* hdp-github/
cd hdp-github

# ساخت README
cat > README.md << 'README_EOF'
# هرمزگان درایور پرو
پروژه محلی رانندگان هرمزگان
README_EOF

# راه‌اندازی Git
git init
git add .
git commit -m "اولین نسخه"

# ساخت ریپازیتوری با gh
if command -v gh &> /dev/null; then
    gh repo create hormozgan-driver --public --description "پروژه رانندگان هرمزگان" --source=. --remote=origin --push
else
    echo "⚠️ GitHub CLI نصب نیست. اول ریپازیتوری رو در مرورگر بساز:"
    echo "🌐 https://github.com/new"
    echo "سپس ادامه بده..."
fi
