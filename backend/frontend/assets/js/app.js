/**
 * Main JavaScript file for Hormozgan Driver Pro
 */

// Toast notification system
class Toast {
    static show(message, type = 'info', duration = 5000) {
        // Remove existing toasts
        document.querySelectorAll('.toast').forEach(toast => toast.remove());
        
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <i class="toast-icon ${this.getIcon(type)}"></i>
                <span class="toast-message">${message}</span>
            </div>
            <button class="toast-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        // Add to DOM
        document.body.appendChild(toast);
        
        // Show with animation
        setTimeout(() => toast.classList.add('show'), 10);
        
        // Auto remove
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }
    }
    
    static getIcon(type) {
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        return icons[type] || icons.info;
    }
}

// Form validation
class FormValidator {
    static validate(form) {
        const inputs = form.querySelectorAll('[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
                this.showError(input);
            } else {
                this.hideError(input);
            }
        });
        
        return isValid;
    }
    
    static validateField(input) {
        const value = input.value.trim();
        const type = input.type;
        
        if (!value) return false;
        
        switch (type) {
            case 'tel':
            case 'text':
                if (input.name === 'mobile') {
                    return /^09\d{9}$/.test(value);
                }
                if (input.name === 'national_id') {
                    return /^\d{10}$/.test(value);
                }
                return value.length >= 3;
                
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
                
            case 'number':
                return !isNaN(value) && value > 0;
                
            default:
                return true;
        }
    }
    
    static showError(input) {
        const errorDiv = input.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('error-message')) {
            errorDiv.style.display = 'block';
        } else {
            const div = document.createElement('div');
            div.className = 'error-message';
            div.textContent = this.getErrorMessage(input);
            div.style.display = 'block';
            input.parentNode.insertBefore(div, input.nextSibling);
        }
        
        input.classList.add('error');
    }
    
    static hideError(input) {
        const errorDiv = input.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('error-message')) {
            errorDiv.style.display = 'none';
        }
        input.classList.remove('error');
    }
    
    static getErrorMessage(input) {
        const name = input.name || input.id;
        
        const messages = {
            mobile: 'شماره موبایل معتبر وارد کنید (۰۹۱۲۳۴۵۶۷۸۹)',
            national_id: 'کد ملی ۱۰ رقمی معتبر وارد کنید',
            full_name: 'نام کامل باید حداقل ۳ حرف باشد',
            email: 'ایمیل معتبر وارد کنید',
            password: 'رمز عبور باید حداقل ۶ حرف باشد'
        };
        
        return messages[name] || 'این فیلد الزامی است';
    }
}

// API Service
class ApiService {
    static baseUrl = 'http://localhost:8000/api';
    
    static async request(endpoint, options = {}) {
        const url = `${this.baseUrl}/${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        
        const config = { ...defaultOptions, ...options };
        
        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }
    
    // Driver registration
    static async registerDriver(formData) {
        const response = await fetch(`${this.baseUrl}/register.php`, {
            method: 'POST',
            body: formData
        });
        
        return await response.json();
    }
    
    // Get drivers list
    static async getDrivers(status = 'active', city = null) {
        let url = `drivers?status=${status}`;
        if (city) url += `&city=${encodeURIComponent(city)}`;
        
        return await this.request(url);
    }
    
    // Get driver locations
    static async getDriverLocations() {
        return await this.request('drivers/locations');
    }
    
    // Get system stats
    static async getStats() {
        return await this.request('stats');
    }
}

// UI Components
class UIComponents {
    static createLoadingSpinner(text = 'در حال بارگذاری...') {
        return `
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>${text}</p>
            </div>
        `;
    }
    
    static createEmptyState(icon, title, message) {
        return `
            <div class="empty-state">
                <i class="${icon}"></i>
                <h3>${title}</h3>
                <p>${message}</p>
            </div>
        `;
    }
    
    static createDriverCard(driver) {
        const statusClass = driver.status === 'active' ? 'success' : 
                          driver.status === 'pending' ? 'warning' : 'danger';
        
        return `
            <div class="driver-card">
                <div class="driver-header">
                    <div class="driver-avatar">
                        ${driver.full_name.charAt(0)}
                    </div>
                    <div class="driver-info">
                        <h4>${driver.full_name}</h4>
                        <p class="driver-mobile">${driver.mobile}</p>
                    </div>
                    <span class="driver-status ${statusClass}">
                        ${driver.status === 'active' ? 'فعال' : 
                          driver.status === 'pending' ? 'در انتظار' : 'غیرفعال'}
                    </span>
                </div>
                <div class="driver-details">
                    <div class="detail">
                        <span class="label">شهر:</span>
                        <span class="value">${driver.city}</span>
                    </div>
                    <div class="detail">
                        <span class="label">خودرو:</span>
                        <span class="value">${driver.car_model || 'ثبت نشده'}</span>
                    </div>
                    <div class="detail">
                        <span class="label">سفرها:</span>
                        <span class="value">${driver.total_trips || 0}</span>
                    </div>
                    <div class="detail">
                        <span class="label">امتیاز:</span>
                        <span class="value rating">${driver.rating ? '★'.repeat(Math.floor(driver.rating)) : '---'}</span>
                    </div>
                </div>
                <div class="driver-actions">
                    <button class="btn btn-sm btn-primary" onclick="viewDriver(${driver.id})">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-sm btn-success" onclick="editDriver(${driver.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="deleteDriver(${driver.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize all forms
    document.querySelectorAll('form').forEach(form => {
        form.addEventListener('submit', function(e) {
            if (!FormValidator.validate(this)) {
                e.preventDefault();
                Toast.show('لطفا اطلاعات فرم را صحیح وارد کنید', 'error');
            }
        });
    });
    
    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-tooltip]');
    tooltips.forEach(element => {
        element.addEventListener('mouseenter', function() {
            const tooltip = document.createElement('div');
            tooltip.className = 'tooltip';
            tooltip.textContent = this.dataset.tooltip;
            document.body.appendChild(tooltip);
            
            const rect = this.getBoundingClientRect();
            tooltip.style.left = `${rect.left + window.scrollX}px`;
            tooltip.style.top = `${rect.top + window.scrollY - tooltip.offsetHeight - 10}px`;
            
            this._tooltip = tooltip;
        });
        
        element.addEventListener('mouseleave', function() {
            if (this._tooltip) {
                this._tooltip.remove();
                this._tooltip = null;
            }
        });
    });
    
    // Auto-update stats on dashboard
    if (document.querySelector('.dashboard-stats')) {
        updateDashboardStats();
        setInterval(updateDashboardStats, 60000); // Update every minute
    }
    
    // Initialize map if map container exists
    if (document.getElementById('map')) {
        initMap();
    }
});

// Dashboard functions
async function updateDashboardStats() {
    try {
        const stats = await ApiService.getStats();
        
        if (stats.success) {
            // Update stats cards
            document.querySelectorAll('.stat-value').forEach(element => {
                const statName = element.dataset.stat;
                if (stats.data[statName] !== undefined) {
                    element.textContent = stats.data[statName].toLocaleString('fa-IR');
                }
            });
        }
    } catch (error) {
        console.error('Failed to update stats:', error);
    }
}

// Map initialization
function initMap() {
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet not loaded');
        return;
    }
    
    const mapElement = document.getElementById('map');
    if (!mapElement) return;
    
    // Initialize map
    const map = L.map('map').setView([27.1865, 56.2808], 12);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Add scale control
    L.control.scale().addTo(map);
    
    // Try to locate user
    map.locate({setView: true, maxZoom: 16});
    
    // Add location found event
    map.on('locationfound', function(e) {
        const radius = e.accuracy / 2;
        
        L.marker(e.latlng).addTo(map)
            .bindPopup("شما اینجا هستید").openPopup();
        
        L.circle(e.latlng, radius).addTo(map);
    });
    
    // Add location error event
    map.on('locationerror', function(e) {
        console.log("Location error: " + e.message);
    });
    
    // Store map instance globally
    window.appMap = map;
}

// Driver functions
async function viewDriver(id) {
    Toast.show('در حال دریافت اطلاعات راننده...', 'info');
    // Implementation for viewing driver details
}

async function editDriver(id) {
    Toast.show('در حال بارگذاری فرم ویرایش...', 'info');
    // Implementation for editing driver
}

async function deleteDriver(id) {
    if (confirm('آیا از حذف این راننده مطمئن هستید؟')) {
        Toast.show('در حال حذف راننده...', 'info');
        // Implementation for deleting driver
    }
}

// Export to global scope
window.Toast = Toast;
window.FormValidator = FormValidator;
window.ApiService = ApiService;
window.UIComponents = UIComponents;
