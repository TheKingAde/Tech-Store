import os
import secrets
from flask import Flask, render_template, request, jsonify, redirect, url_for, session, flash, send_from_directory
from werkzeug.utils import secure_filename
from models import db, Product, AdminUser, Cart, CartItem, Order
import json

app = Flask(__name__)
app.config['SECRET_KEY'] = secrets.token_hex(16)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///techstore.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# Ensure upload directory exists
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

db.init_app(app)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def admin_required(f):
    def decorated_function(*args, **kwargs):
        if 'admin_logged_in' not in session:
            return redirect(url_for('admin_login'))
        return f(*args, **kwargs)
    decorated_function.__name__ = f.__name__
    return decorated_function

# Routes
@app.route('/')
def home():
    # Get featured products (latest 6)
    featured_products = Product.query.order_by(Product.created_at.desc()).limit(6).all()
    return render_template('index.html', featured_products=featured_products)

@app.route('/products')
def products():
    category = request.args.get('category', '')
    if category:
        products = Product.query.filter_by(category=category).all()
    else:
        products = Product.query.all()
    
    categories = db.session.query(Product.category).distinct().all()
    categories = [cat[0] for cat in categories]
    
    return render_template('products.html', products=products, categories=categories, current_category=category)

@app.route('/product/<int:product_id>')
def product_detail(product_id):
    product = Product.query.get_or_404(product_id)
    return render_template('product_detail.html', product=product)

@app.route('/search')
def search():
    query = request.args.get('q', '')
    if query:
        products = Product.query.filter(
            Product.name.ilike(f'%{query}%') | 
            Product.description.ilike(f'%{query}%') |
            Product.category.ilike(f'%{query}%')
        ).all()
    else:
        products = []
    return render_template('search.html', products=products, query=query)

@app.route('/cart')
def cart():
    return render_template('cart.html')

@app.route('/checkout')
def checkout():
    return render_template('checkout.html')

@app.route('/thank-you')
def thank_you():
    return render_template('thank_you.html')

# Admin Routes
@app.route('/admin/login', methods=['GET', 'POST'])
def admin_login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        admin = AdminUser.query.filter_by(username=username).first()
        if admin and admin.check_password(password):
            session['admin_logged_in'] = True
            session['admin_id'] = admin.id
            flash('Login successful!', 'success')
            return redirect(url_for('admin_dashboard'))
        else:
            flash('Invalid username or password!', 'error')
    
    return render_template('admin_login.html')

@app.route('/admin/logout')
def admin_logout():
    session.pop('admin_logged_in', None)
    session.pop('admin_id', None)
    flash('Logged out successfully!', 'success')
    return redirect(url_for('home'))

@app.route('/admin/dashboard')
@admin_required
def admin_dashboard():
    products = Product.query.all()
    total_products = len(products)
    return render_template('admin_dashboard.html', products=products, total_products=total_products)

@app.route('/admin/add-product', methods=['GET', 'POST'])
@admin_required
def add_product():
    if request.method == 'POST':
        return handle_product_creation()
    
    categories = db.session.query(Product.category).distinct().all()
    categories = [cat[0] for cat in categories]
    return render_template('add_product.html', categories=categories)

@app.route('/admin/edit-product/<int:product_id>', methods=['GET', 'POST'])
@admin_required
def edit_product(product_id):
    product = Product.query.get_or_404(product_id)
    
    if request.method == 'POST':
        return handle_product_update(product)
    
    categories = db.session.query(Product.category).distinct().all()
    categories = [cat[0] for cat in categories]
    return render_template('edit_product.html', product=product, categories=categories)

def handle_product_creation():
    try:
        name = request.form['name']
        price = float(request.form['price'])
        description = request.form['description']
        category = request.form['category']
        
        image_url = None
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                # Add timestamp to filename to avoid conflicts
                import time
                filename = f"{int(time.time())}_{filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                image_url = f"/uploads/{filename}"
        
        product = Product(
            name=name,
            price=price,
            description=description,
            category=category,
            image_url=image_url
        )
        
        db.session.add(product)
        db.session.commit()
        
        flash('Product added successfully!', 'success')
        return redirect(url_for('admin_dashboard'))
        
    except Exception as e:
        flash(f'Error adding product: {str(e)}', 'error')
        return redirect(url_for('add_product'))

def handle_product_update(product):
    try:
        # Store old image for potential cleanup
        old_image_url = product.image_url
        
        # Update product fields
        product.name = request.form['name']
        product.price = float(request.form['price'])
        product.description = request.form['description']
        product.category = request.form['category']
        
        # Handle image update
        if 'image' in request.files:
            file = request.files['image']
            if file and file.filename and allowed_file(file.filename):
                # Delete old image if exists
                if old_image_url:
                    old_image_path = old_image_url.lstrip('/')
                    if os.path.exists(old_image_path):
                        os.remove(old_image_path)
                
                # Save new image
                filename = secure_filename(file.filename)
                import time
                filename = f"{int(time.time())}_{filename}"
                file.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
                product.image_url = f"/uploads/{filename}"
        
        db.session.commit()
        
        flash('Product updated successfully!', 'success')
        return redirect(url_for('admin_dashboard'))
        
    except Exception as e:
        flash(f'Error updating product: {str(e)}', 'error')
        return redirect(url_for('edit_product', product_id=product.id))

# API Routes
@app.route('/api/products')
def api_products():
    products = Product.query.all()
    return jsonify([product.to_dict() for product in products])

@app.route('/api/products/<int:product_id>')
def api_product(product_id):
    product = Product.query.get_or_404(product_id)
    return jsonify(product.to_dict())

@app.route('/api/search')
def api_search():
    query = request.args.get('q', '')
    if query:
        products = Product.query.filter(
            Product.name.ilike(f'%{query}%') | 
            Product.description.ilike(f'%{query}%') |
            Product.category.ilike(f'%{query}%')
        ).all()
    else:
        products = []
    return jsonify([product.to_dict() for product in products])

@app.route('/api/products', methods=['POST'])
@admin_required
def api_create_product():
    return handle_product_creation()

@app.route('/api/products/<int:product_id>', methods=['PUT'])
@admin_required
def api_update_product(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        data = request.get_json()
        
        # Update product fields
        if 'name' in data:
            product.name = data['name']
        if 'price' in data:
            product.price = float(data['price'])
        if 'description' in data:
            product.description = data['description']
        if 'category' in data:
            product.category = data['category']
        
        db.session.commit()
        
        return jsonify(product.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/products/<int:product_id>', methods=['DELETE'])
@admin_required
def api_delete_product(product_id):
    try:
        product = Product.query.get_or_404(product_id)
        
        # Delete image file if exists
        if product.image_url:
            image_path = product.image_url.lstrip('/')
            if os.path.exists(image_path):
                os.remove(image_path)
        
        db.session.delete(product)
        db.session.commit()
        
        return jsonify({'message': 'Product deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Cart API endpoints
def get_or_create_cart():
    """Get or create a cart for the current session"""
    cart_session_id = session.get('cart_session_id')
    if not cart_session_id:
        cart_session_id = secrets.token_hex(16)
        session['cart_session_id'] = cart_session_id
    
    cart = Cart.query.filter_by(session_id=cart_session_id).first()
    if not cart:
        cart = Cart(session_id=cart_session_id)
        db.session.add(cart)
        db.session.commit()
    
    return cart

@app.route('/api/cart', methods=['GET'])
def api_get_cart():
    """Get current cart with all items"""
    try:
        cart = get_or_create_cart()
        return jsonify(cart.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cart/add', methods=['POST'])
def api_add_to_cart():
    """Add an item to cart"""
    try:
        data = request.get_json()
        product_id = data.get('product_id')
        quantity = data.get('quantity', 1)
        
        # Validate product exists
        product = Product.query.get(product_id)
        if not product:
            return jsonify({'error': 'Product not found'}), 404
        
        cart = get_or_create_cart()
        
        # Check if item already exists in cart
        existing_item = CartItem.query.filter_by(
            cart_id=cart.id, 
            product_id=product_id
        ).first()
        
        if existing_item:
            existing_item.quantity += quantity
        else:
            new_item = CartItem(
                cart_id=cart.id,
                product_id=product_id,
                quantity=quantity
            )
            db.session.add(new_item)
        
        db.session.commit()
        return jsonify(cart.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cart/update', methods=['PUT'])
def api_update_cart_item():
    """Update quantity of an item in cart"""
    try:
        data = request.get_json()
        item_id = data.get('item_id')
        quantity = data.get('quantity')
        
        if quantity <= 0:
            return jsonify({'error': 'Quantity must be greater than 0'}), 400
        
        cart = get_or_create_cart()
        cart_item = CartItem.query.filter_by(
            id=item_id, 
            cart_id=cart.id
        ).first()
        
        if not cart_item:
            return jsonify({'error': 'Cart item not found'}), 404
        
        cart_item.quantity = quantity
        db.session.commit()
        
        return jsonify(cart.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cart/remove', methods=['DELETE'])
def api_remove_from_cart():
    """Remove an item from cart"""
    try:
        data = request.get_json()
        item_id = data.get('item_id')
        
        cart = get_or_create_cart()
        cart_item = CartItem.query.filter_by(
            id=item_id, 
            cart_id=cart.id
        ).first()
        
        if not cart_item:
            return jsonify({'error': 'Cart item not found'}), 404
        
        db.session.delete(cart_item)
        db.session.commit()
        
        return jsonify(cart.to_dict()), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/cart/clear', methods=['DELETE'])
def api_clear_cart():
    """Clear all items from cart"""
    try:
        cart = get_or_create_cart()
        CartItem.query.filter_by(cart_id=cart.id).delete()
        db.session.commit()
        
        return jsonify({'message': 'Cart cleared successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/checkout', methods=['POST'])
def api_checkout():
    """Process checkout and create order"""
    try:
        data = request.get_json()
        
        # Get cart
        cart = get_or_create_cart()
        if not cart.items:
            return jsonify({'error': 'Cart is empty'}), 400
        
        # Create order
        order_number = f"ORD-{secrets.token_hex(6).upper()}"
        order = Order(
            order_number=order_number,
            customer_email=data.get('email'),
            customer_name=f"{data.get('firstName')} {data.get('lastName')}",
            customer_phone=data.get('phone'),
            shipping_address=f"{data.get('address')}, {data.get('city')}, {data.get('state')} {data.get('zip')}",
            total_amount=cart.to_dict()['total'],
            payment_method=data.get('paymentMethod', 'credit_card'),
            status='confirmed'
        )
        
        db.session.add(order)
        
        # Clear cart after successful order
        CartItem.query.filter_by(cart_id=cart.id).delete()
        
        db.session.commit()
        
        return jsonify({
            'message': 'Order processed successfully',
            'order': order.to_dict()
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/admin/login', methods=['POST'])
def api_admin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    
    admin = AdminUser.query.filter_by(username=username).first()
    if admin and admin.check_password(password):
        session['admin_logged_in'] = True
        session['admin_id'] = admin.id
        return jsonify({'message': 'Login successful'}), 200
    else:
        return jsonify({'error': 'Invalid credentials'}), 401

# Static file serving
@app.route('/uploads/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# Initialize database and sample data
def init_db():
    with app.app_context():
        db.create_all()
        
        # Create admin user if doesn't exist
        if not AdminUser.query.filter_by(username='admin').first():
            admin = AdminUser(username='admin')
            admin.set_password('admin123')
            db.session.add(admin)
        
        # Add sample products if database is empty
        if Product.query.count() == 0:
            sample_products = [
                {
                    'name': 'MacBook Pro 16" M2',
                    'price': 2499.99,
                    'description': 'Powerful laptop with M2 chip, 16GB RAM, 512GB SSD. Perfect for professional work and creative tasks.',
                    'category': 'Laptops',
                    'image_url': '/static/images/macbook-pro.jpg'
                },
                {
                    'name': 'Dell XPS 13',
                    'price': 1299.99,
                    'description': 'Ultra-portable laptop with Intel Core i7, 16GB RAM, 256GB SSD. Ideal for business and productivity.',
                    'category': 'Laptops',
                    'image_url': '/static/images/dell-xps.jpg'
                },
                {
                    'name': 'Gaming Laptop ASUS ROG',
                    'price': 1899.99,
                    'description': 'High-performance gaming laptop with RTX 4060, Intel i7, 32GB RAM, 1TB SSD.',
                    'category': 'Laptops',
                    'image_url': '/static/images/asus-rog.jpg'
                },
                {
                    'name': 'Magic Mouse 2',
                    'price': 79.99,
                    'description': 'Wireless mouse with multi-touch surface and rechargeable battery.',
                    'category': 'Accessories',
                    'image_url': '/static/images/magic-mouse.jpg'
                },
                {
                    'name': '4K USB-C Monitor',
                    'price': 449.99,
                    'description': '27-inch 4K monitor with USB-C connectivity and HDR support.',
                    'category': 'Monitors',
                    'image_url': '/static/images/4k-monitor.jpg'
                },
                {
                    'name': 'SSD 1TB External Drive',
                    'price': 129.99,
                    'description': 'Fast external SSD with USB 3.2 Gen 2 for quick file transfers.',
                    'category': 'Storage',
                    'image_url': '/static/images/external-ssd.jpg'
                }
            ]
            
            for product_data in sample_products:
                product = Product(**product_data)
                db.session.add(product)
        
        db.session.commit()

if __name__ == '__main__':
    init_db()
    app.run(debug=True, host='0.0.0.0', port=5000)