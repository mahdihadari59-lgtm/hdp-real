// 📡 API Manager for HDP Booking System
const API_BASE = 'http://localhost:3000/api';

class BookingAPI {
    // ایجاد رزرو جدید
    static async createBooking(bookingData) {
        try {
            console.log('📤 ارسال درخواست رزرو:', bookingData);
            
            const response = await fetch(`${API_BASE}/bookings/create`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pickup: bookingData.pickup,
                    destination: bookingData.destination,
                    driver_id: bookingData.driver_id,
                    passengers: parseInt(bookingData.passengers),
                    trip_type: bookingData.trip_type || 'normal',
                    payment_method: bookingData.payment_method || 'cash',
                    notes: bookingData.notes || '',
                    customer_name: bookingData.customer_name || 'مهمان',
                    customer_phone: bookingData.customer_phone || '09123456789'
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                console.log('✅ رزرو موفق:', data.booking.code);
                return {
                    success: true,
                    booking: data.booking,
                    message: data.message,
                    next_steps: data.next_steps
                };
            } else {
                console.error('❌ خطا در رزرو:', data.message);
                return {
                    success: false,
                    message: data.message
                };
            }
        } catch (error) {
            console.error('🌐 خطای شبکه:', error);
            return {
                success: false,
                message: 'خطا در ارتباط با سرور',
                error: error.message
            };
        }
    }
    
    // دریافت لیست رانندگان آنلاین
    static async getAvailableDrivers() {
        try {
            const response = await fetch(`${API_BASE}/drivers`);
            const data = await response.json();
            
            if (data.success) {
                // فیلتر رانندگان آنلاین و آماده
                return data.drivers.filter(driver => 
                    driver.status === 'available' && driver.online
                );
            }
            return [];
        } catch (error) {
            console.log('🔄 استفاده از داده‌های نمونه رانندگان');
            return this.getSampleDrivers();
        }
    }
    
    // دریافت جزئیات یک رزرو
    static async getBookingDetails(code) {
        try {
            const response = await fetch(`${API_BASE}/bookings/${code}`);
            const data = await response.json();
            
            if (data.success) {
                return {
                    success: true,
                    booking: data.booking,
                    timeline: data.timeline
                };
            } else {
                return {
                    success: false,
                    message: data.message
                };
            }
        } catch (error) {
            return {
                success: false,
                message: 'خطا در دریافت اطلاعات'
            };
        }
    }
    
    // تغییر وضعیت رزرو
    static async updateBookingStatus(code, status, driver_id = null) {
        try {
            const payload = { status };
            if (driver_id) payload.driver_id = driver_id;
            
            const response = await fetch(`${API_BASE}/bookings/${code}/status`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            return {
                success: false,
                message: 'خطا در به‌روزرسانی'
            };
        }
    }
    
    // لغو رزرو
    static async cancelBooking(code, reason = 'درخواست کاربر') {
        try {
            const response = await fetch(`${API_BASE}/bookings/${code}/cancel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ reason })
            });
            
            const data = await response.json();
            return data;
        } catch (error) {
            return {
                success: false,
                message: 'خطا در لغو رزرو'
            };
        }
    }
    
    // دریافت آمار سیستم
    static async getSystemStats() {
        try {
            const response = await fetch(`${API_BASE}/stats`);
            const data = await response.json();
            
            if (data.success) {
                return data.stats;
            }
            return null;
        } catch (error) {
            console.log('📊 استفاده از آمار نمونه');
            return {
                drivers: 1247,
                online: 842,
                trips_today: 8942,
                active_bookings: 12
            };
        }
    }
    
    // داده‌های نمونه رانندگان
    static getSampleDrivers() {
        return [
            {
                id: 'DRV-001',
                name: 'رضا محمدی',
                phone: '09121234567',
                rating: 4.8,
                status: 'available',
                car: { model: 'پژو 206', color: 'سفید', plate: '75-ع 123' },
                location: { lat: 27.1865, lng: 56.2768 },
                experience: '5 سال',
                trips_completed: 1242
            },
            {
                id: 'DRV-002',
                name: 'علی کریمی',
                phone: '09129876543',
                rating: 4.9,
                status: 'available',
                car: { model: 'سمند', color: 'مشکی', plate: '75-ع 456' },
                location: { lat: 27.1920, lng: 56.2650 },
                experience: '7 سال',
                trips_completed: 1856
            },
            {
                id: 'DRV-003',
                name: 'محمد حسینی',
                phone: '09131112233',
                rating: 4.7,
                status: 'available',
                car: { model: 'تیبا', color: 'نقره‌ای', plate: '75-ع 789' },
                location: { lat: 27.1750, lng: 56.2850 },
                experience: '3 سال',
                trips_completed: 876
            }
        ];
    }
    
    // محاسبه هزینه تقریبی
    static async estimateCost(pickup, destination, trip_type = 'normal', passengers = 1) {
        try {
            const response = await fetch(`${API_BASE}/map/route?origin=27.1832,56.2666&destination=27.1865,56.2768`);
            const data = await response.json();
            
            if (data.success) {
                // شبیه‌سازی محاسبه هزینه
                const baseCost = 10000;
                const distance = data.route.distance?.value || 8500;
                const duration = data.route.duration?.value || 720;
                
                let cost = baseCost + (distance / 1000 * 5000) + (duration / 60 * 2000);
                
                // ضریب نوع سفر
                if (trip_type === 'premium') cost *= 1.5;
                if (trip_type === 'share') cost *= 0.7;
                
                // ضریب مسافران
                cost *= passengers;
                
                return Math.round(cost / 1000) * 1000;
            }
        } catch (error) {
            console.log('💰 استفاده از محاسبه نمونه');
        }
        
        // محاسبه نمونه
        return 85000;
    }
}

// 📝 Utility Functions
const BookingUtils = {
    // فرمت‌کردن عدد به فارسی
    formatNumber: (num) => {
        return new Intl.NumberFormat('fa-IR').format(num);
    },
    
    // فرمت‌کردن زمان
    formatTime: (date) => {
        return new Date(date).toLocaleTimeString('fa-IR', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // تولید کد رهگیری زیبا
    formatBookingCode: (code) => {
        return `<span style="font-family: monospace; background: rgba(0,255,136,0.1); padding: 5px 10px; border-radius: 5px;">${code}</span>`;
    },
    
    // نمایش پیام
    showMessage: (type, message, duration = 5000) => {
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            padding: 15px 25px;
            border-radius: 50px;
            color: white;
            font-family: 'Vazirmatn', Tahoma;
            z-index: 10000;
            box-shadow: 0 5px 20px rgba(0,0,0,0.3);
            animation: slideDown 0.3s ease;
        `;
        
        if (type === 'success') {
            messageDiv.style.background = 'linear-gradient(135deg, #00ff88, #00A693)';
        } else if (type === 'error') {
            messageDiv.style.background = 'linear-gradient(135deg, #ff4444, #cc0000)';
        } else {
            messageDiv.style.background = 'linear-gradient(135deg, #00d4ff, #0088cc)';
        }
        
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            ${message}
        `;
        
        document.body.appendChild(messageDiv);
        
        // حذف خودکار
        setTimeout(() => {
            messageDiv.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, duration);
    }
};

// اضافه کردن استایل‌های انیمیشن
const style = document.createElement('style');
style.textContent = `
    @keyframes slideDown {
        from { top: -50px; opacity: 0; }
        to { top: 20px; opacity: 1; }
    }
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// 📱 اکسپورت برای استفاده در booking.html
window.BookingAPI = BookingAPI;
window.BookingUtils = BookingUtils;
