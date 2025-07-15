// TECH STORE Main JavaScript

// Global cart functionality
let cart = { items: [], total: 0, item_count: 0 };

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeCart();
    initializeAddToCartButtons();
    initializeToasts();
    initializeScrollAnimations();
    initializeCartPage();
    initializeCheckoutPage();
    loadCartData();
});

// Cart Management Functions
async function loadCartData() {
    try {
        const response = await fetch('/api/cart');
        if (response.ok) {
            cart = await response.json();
            updateCartCount();
            updateCartDisplay();
        }
    } catch (error) {
        console.error('Error loading cart:', error);
    }
}

async function addToCart(productData) {
    try {
        const response = await fetch('/api/cart/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                product_id: productData.id,
                quantity: productData.quantity || 1
            })
        });
        
        if (response.ok) {
            cart = await response.json();
            updateCartCount();
            updateCartDisplay();
            showToast(`${productData.name} added to cart!`, 'success');
        } else {
            const error = await response.json();
            showToast(error.error || 'Error adding to cart', 'error');
        }
    } catch (error) {
        console.error('Error adding to cart:', error);
        showToast('Error adding to cart', 'error');
    }
}

async function updateCartItemQuantity(itemId, quantity) {
    try {
        const response = await fetch('/api/cart/update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                item_id: itemId,
                quantity: quantity
            })
        });
        
        if (response.ok) {
            cart = await response.json();
            updateCartCount();
            updateCartDisplay();
        } else {
            const error = await response.json();
            showToast(error.error || 'Error updating cart', 'error');
        }
    } catch (error) {
        console.error('Error updating cart:', error);
        showToast('Error updating cart', 'error');
    }
}

async function removeFromCart(itemId) {
    try {
        const response = await fetch('/api/cart/remove', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                item_id: itemId
            })
        });
        
        if (response.ok) {
            cart = await response.json();
            updateCartCount();
            updateCartDisplay();
            showToast('Item removed from cart', 'info');
        } else {
            const error = await response.json();
            showToast(error.error || 'Error removing from cart', 'error');
        }
    } catch (error) {
        console.error('Error removing from cart:', error);
        showToast('Error removing from cart', 'error');
    }
}

async function clearCart() {
    try {
        const response = await fetch('/api/cart/clear', {
            method: 'DELETE'
        });
        
        if (response.ok) {
            cart = { items: [], total: 0, item_count: 0 };
            updateCartCount();
            updateCartDisplay();
            showToast('Cart cleared', 'info');
        }
    } catch (error) {
        console.error('Error clearing cart:', error);
        showToast('Error clearing cart', 'error');
    }
}

function updateCartCount() {
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = cart.item_count || 0;
        
        // Add bounce animation when count changes
        cartCountElement.classList.add('cart-count-bounce');
        setTimeout(() => {
            cartCountElement.classList.remove('cart-count-bounce');
        }, 600);
    }
}

// Cart Page Functions
function initializeCartPage() {
    if (window.location.pathname === '/cart') {
        loadCartData();
    }
}

function updateCartDisplay() {
    const cartItemsContainer = document.getElementById('cart-items');
    const cartSummary = document.getElementById('cart-summary');
    const emptyCart = document.getElementById('empty-cart');
    
    if (!cartItemsContainer) return;
    
    if (!cart.items || cart.items.length === 0) {
        cartItemsContainer.innerHTML = '';
        emptyCart.style.display = 'block';
        cartSummary.style.display = 'none';
        return;
    }
    
    emptyCart.style.display = 'none';
    cartSummary.style.display = 'block';
    
    // Build cart items HTML
    let cartHTML = '';
    cart.items.forEach(item => {
        cartHTML += `
            <div class="card mb-3 cart-item fade-in-up" data-item-id="${item.id}">
                <div class="row g-0">
                    <div class="col-md-3">
                        <img src="${item.product.image_url || '/static/images/placeholder.jpg'}" 
                             class="img-fluid rounded-start cart-item-image" 
                             alt="${item.product.name}">
                    </div>
                    <div class="col-md-9">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-8">
                                    <h5 class="card-title">${item.product.name}</h5>
                                    <p class="card-text text-muted">${item.product.description.substring(0, 100)}...</p>
                                    <p class="card-text">
                                        <strong class="text-primary">$${item.product.price.toFixed(2)}</strong>
                                    </p>
                                </div>
                                <div class="col-md-4">
                                    <div class="d-flex align-items-center justify-content-end">
                                        <div class="quantity-controls me-3">
                                            <button class="btn btn-outline-secondary btn-sm" 
                                                    onclick="updateQuantity(${item.id}, ${item.quantity - 1})">
                                                <i class="fas fa-minus"></i>
                                            </button>
                                            <span class="quantity-display mx-2">${item.quantity}</span>
                                            <button class="btn btn-outline-secondary btn-sm" 
                                                    onclick="updateQuantity(${item.id}, ${item.quantity + 1})">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                                        <button class="btn btn-outline-danger btn-sm" 
                                                onclick="removeItem(${item.id})">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                    <div class="text-end mt-2">
                                        <strong>$${item.subtotal.toFixed(2)}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    });
    
    cartItemsContainer.innerHTML = cartHTML;
    
    // Update cart summary
    const subtotal = cart.total || 0;
    const tax = subtotal * 0.08; // 8% tax
    const shipping = subtotal > 50 ? 0 : 9.99;
    const total = subtotal + tax + shipping;
    
    document.getElementById('subtotal').textContent = `$${subtotal.toFixed(2)}`;
    document.getElementById('tax').textContent = `$${tax.toFixed(2)}`;
    document.getElementById('shipping').textContent = shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`;
    document.getElementById('total').textContent = `$${total.toFixed(2)}`;
    
    // Add checkout button functionality
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.onclick = () => {
            window.location.href = '/checkout';
        };
    }
    
    // Animate cart items
    const cartItems = document.querySelectorAll('.cart-item');
    cartItems.forEach((item, index) => {
        item.style.animationDelay = `${index * 0.1}s`;
    });
}

// Quantity and item management functions
function updateQuantity(itemId, newQuantity) {
    if (newQuantity < 1) {
        removeItem(itemId);
        return;
    }
    updateCartItemQuantity(itemId, newQuantity);
}

function removeItem(itemId) {
    removeFromCart(itemId);
}

// Initialize cart functionality
function initializeCart() {
    // This is now handled by loadCartData
}

// Checkout Page Functions
function initializeCheckoutPage() {
    if (window.location.pathname === '/checkout') {
        loadCartData();
        initializeCheckoutForm();
    }
}

function initializeCheckoutForm() {
    const checkoutForm = document.getElementById('checkout-form');
    if (checkoutForm) {
        checkoutForm.addEventListener('submit', handleCheckoutSubmit);
    }
}

async function handleCheckoutSubmit(e) {
    e.preventDefault();
    
    // Get form data
    const formData = new FormData(e.target);
    const checkoutData = {
        firstName: formData.get('firstName'),
        lastName: formData.get('lastName'),
        email: formData.get('email'),
        phone: formData.get('phone'),
        address: formData.get('address'),
        city: formData.get('city'),
        state: formData.get('state'),
        zip: formData.get('zip'),
        paymentMethod: formData.get('paymentMethod') || 'credit_card'
    };
    
    // Validate required fields
    if (!checkoutData.firstName || !checkoutData.lastName || !checkoutData.email || !checkoutData.address || !checkoutData.city || !checkoutData.state || !checkoutData.zip) {
        showToast('Please fill in all required fields', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Processing...';
    submitBtn.disabled = true;
    
    try {
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(checkoutData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showToast('Order placed successfully!', 'success');
            
            // Redirect to thank you page with order details
            setTimeout(() => {
                window.location.href = `/thank-you?order=${result.order.order_number}`;
            }, 1500);
        } else {
            const error = await response.json();
            showToast(error.error || 'Error processing order', 'error');
            
            // Reset button
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    } catch (error) {
        console.error('Error processing checkout:', error);
        showToast('Error processing order', 'error');
        
        // Reset button
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    }
}

// Add to Cart Button Initialization
function initializeAddToCartButtons() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const productData = {
                id: this.getAttribute('data-product-id'),
                name: this.getAttribute('data-product-name'),
                price: parseFloat(this.getAttribute('data-product-price')),
                image: this.getAttribute('data-product-image'),
                quantity: 1
            };
            
            // Add loading state
            const originalText = this.innerHTML;
            this.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Adding...';
            this.disabled = true;
            
            // Simulate API call delay
            setTimeout(() => {
                addToCart(productData);
                
                // Reset button
                this.innerHTML = originalText;
                this.disabled = false;
                
                // Add success animation
                this.classList.add('btn-success');
                this.innerHTML = '<i class="fas fa-check me-1"></i>Added!';
                
                setTimeout(() => {
                    this.classList.remove('btn-success');
                    this.innerHTML = originalText;
                }, 1500);
            }, 500);
        });
    });
}

// Toast Notification System
function initializeToasts() {
    // Create toast container if it doesn't exist
    if (!document.querySelector('.toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '1055';
        document.body.appendChild(toastContainer);
    }
}

function showToast(message, type = 'info', duration = 3000) {
    const toastContainer = document.querySelector('.toast-container');
    const toastId = 'toast-' + Date.now();
    
    const iconClass = {
        'success': 'fas fa-check-circle text-success',
        'error': 'fas fa-exclamation-circle text-danger',
        'warning': 'fas fa-exclamation-triangle text-warning',
        'info': 'fas fa-info-circle text-info'
    }[type] || 'fas fa-info-circle text-info';
    
    const toastHTML = `
        <div id="${toastId}" class="toast align-items-center border-0" role="alert">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center">
                    <i class="${iconClass} me-2"></i>
                    ${message}
                </div>
                <button type="button" class="btn-close me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    const toast = new bootstrap.Toast(toastElement);
    toast.show();
    
    // Auto remove after duration
    setTimeout(() => {
        toastElement.remove();
    }, duration + 500);
}

// Scroll Animations
function initializeScrollAnimations() {
    const animateElements = document.querySelectorAll('.fade-in, .zoom-in');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
            }
        });
    }, {
        threshold: 0.1
    });
    
    animateElements.forEach(element => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(element);
    });
}

// Search Functionality
function initializeSearch() {
    const searchForm = document.querySelector('form[action*="search"]');
    const searchInput = document.querySelector('input[name="q"]');
    
    if (searchForm && searchInput) {
        // Add search suggestions (optional)
        searchInput.addEventListener('input', function() {
            // Implement search suggestions here if needed
        });
        
        // Prevent empty searches
        searchForm.addEventListener('submit', function(e) {
            if (searchInput.value.trim() === '') {
                e.preventDefault();
                showToast('Please enter a search term', 'warning');
                searchInput.focus();
            }
        });
    }
}

// Product Image Lazy Loading
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.remove('lazy');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

// Form Validation Enhancement
function enhanceFormValidation() {
    const forms = document.querySelectorAll('form');
    
    forms.forEach(form => {
        form.addEventListener('submit', function(e) {
            const requiredFields = form.querySelectorAll('[required]');
            let isValid = true;
            
            requiredFields.forEach(field => {
                if (!field.value.trim()) {
                    field.classList.add('is-invalid');
                    isValid = false;
                } else {
                    field.classList.remove('is-invalid');
                    field.classList.add('is-valid');
                }
            });
            
            if (!isValid) {
                e.preventDefault();
                showToast('Please fill in all required fields', 'error');
            }
        });
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                if (this.hasAttribute('required')) {
                    if (!this.value.trim()) {
                        this.classList.add('is-invalid');
                        this.classList.remove('is-valid');
                    } else {
                        this.classList.remove('is-invalid');
                        this.classList.add('is-valid');
                    }
                }
            });
        });
    });
}

// Smooth Scrolling for Anchor Links
function initializeSmoothScrolling() {
    const links = document.querySelectorAll('a[href^="#"]');
    
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                e.preventDefault();
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
}

// Newsletter Subscription (Demo)
function initializeNewsletter() {
    const newsletterForms = document.querySelectorAll('form[action*="newsletter"], .newsletter-form');
    
    newsletterForms.forEach(form => {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const emailInput = form.querySelector('input[type="email"]');
            const email = emailInput.value.trim();
            
            if (email && isValidEmail(email)) {
                showToast('Thank you for subscribing to our newsletter!', 'success');
                emailInput.value = '';
            } else {
                showToast('Please enter a valid email address', 'error');
            }
        });
    });
}

// Utility Functions
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize additional features
document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
    initializeLazyLoading();
    enhanceFormValidation();
    initializeSmoothScrolling();
    initializeNewsletter();
});

// Export functions for global use
window.TechStore = {
    addToCart,
    removeFromCart,
    getCart,
    clearCart,
    updateCartCount,
    showToast,
    formatCurrency
};