#!/bin/bash
echo "🔍 تست کامل سیستم HDP..."
echo ""

echo "1. بررسی Backend..."
curl -s http://localhost:3000/api/health | grep -q "success" && echo "✅ Backend فعال" || echo "❌ Backend مشکل دارد"

echo ""
echo "2. بررسی Frontend..."
curl -s -I http://localhost:8000 | grep -q "200 OK" && echo "✅ Frontend فعال" || echo "❌ Frontend مشکل دارد"

echo ""
echo "3. بررسی اتصال..."
curl -s http://localhost:3000/api/stats > /dev/null && echo "✅ اتصال Backend-Frontend OK" || echo "❌ اتصال مشکل دارد"

echo ""
echo "🌐 Frontend: http://localhost:8000"
echo "🔧 Backend:  http://localhost:3000"
echo ""
echo "🎯 آماده برای استفاده!"
