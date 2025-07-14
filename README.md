# 🖥️ TECH STORE - E-Commerce Web Application

A complete, production-ready e-commerce web application for selling laptops and tech products, built with Flask, Bootstrap, and modern web technologies.

## 🌟 Features

### Customer Features
- **Modern Homepage** with hero section and featured products
- **Product Catalog** with category filtering
- **Product Details** with specifications and images
- **Search Functionality** with real-time results
- **Shopping Cart** with local storage persistence
- **Checkout Process** with dummy payment
- **Responsive Design** for all devices

### Admin Features
- **Secure Admin Panel** with authentication
- **Product Management** (Add, Delete, View)
- **Dashboard** with inventory statistics
- **Image Upload** for products
- **Real-time Product Preview**

### Technical Features
- **Flask Backend** with SQLite database
- **Bootstrap 5** for modern UI
- **JavaScript** for interactive features
- **Local Image Storage** for product photos
- **Session-based Authentication**
- **API Endpoints** for AJAX operations
- **Toast Notifications** for user feedback

## 🚀 Quick Start

### Prerequisites
- Python 3.7+
- pip (Python package manager)

### Installation & Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd tech-store
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   cd backend
   python app.py
   ```

4. **Access the application**
   - **Main Store**: http://localhost:5000
   - **Admin Panel**: http://localhost:5000/admin/login

### Default Admin Credentials
- **Username**: `admin`
- **Password**: `admin123`

## 📁 Project Structure

```
tech-store/
├── backend/
│   ├── app.py              # Main Flask application
│   ├── models.py           # Database models
│   ├── uploads/            # Product images storage
│   └── templates/          # HTML templates
│       ├── base.html       # Base template
│       ├── index.html      # Homepage
│       ├── products.html   # Product listing
│       ├── product_detail.html
│       ├── search.html     # Search results
│       ├── cart.html       # Shopping cart
│       ├── checkout.html   # Checkout form
│       ├── thank_you.html  # Order confirmation
│       ├── admin_login.html
│       ├── admin_dashboard.html
│       └── add_product.html
├── static/
│   ├── css/
│   │   └── style.css       # Custom styles
│   ├── js/
│   │   └── main.js         # JavaScript functionality
│   └── images/             # Static images
├── requirements.txt        # Python dependencies
└── README.md
```

## 🛠️ Technologies Used

### Backend
- **Flask** - Python web framework
- **SQLAlchemy** - Database ORM
- **SQLite** - Database (for development)
- **Werkzeug** - Password hashing and file uploads
- **Pillow** - Image processing

### Frontend
- **Bootstrap 5** - CSS framework
- **Font Awesome** - Icons
- **Vanilla JavaScript** - Interactive features
- **HTML5/CSS3** - Modern web standards

### Features
- **Responsive Design** - Mobile-first approach
- **Local Storage** - Persistent shopping cart
- **AJAX** - Dynamic content loading
- **File Upload** - Product image management
- **Form Validation** - Client and server-side
- **Toast Notifications** - User feedback

## 🎯 API Endpoints

### Public Endpoints
- `GET /` - Homepage
- `GET /products` - Product listing
- `GET /product/<id>` - Product details
- `GET /search` - Search products
- `GET /cart` - Shopping cart
- `GET /checkout` - Checkout page

### API Endpoints
- `GET /api/products` - Get all products (JSON)
- `GET /api/products/<id>` - Get product by ID
- `GET /api/search?q=term` - Search products
- `POST /api/checkout` - Process order
- `POST /api/products` - Create product (Admin)
- `DELETE /api/products/<id>` - Delete product (Admin)

### Admin Endpoints
- `GET /admin/login` - Admin login
- `GET /admin/dashboard` - Admin dashboard
- `GET /admin/add-product` - Add product form
- `POST /admin/logout` - Admin logout

## 🔧 Configuration

### Environment Variables
Create a `.env` file for production settings:
```
SECRET_KEY=your-secret-key-here
DATABASE_URL=sqlite:///techstore.db
UPLOAD_FOLDER=uploads
MAX_CONTENT_LENGTH=16777216
```

### Database Initialization
The application automatically creates the database and sample data on first run.

## 📱 Sample Data

The application includes sample products:
- MacBook Pro 16" M2 - $2,499.99
- Dell XPS 13 - $1,299.99
- Gaming Laptop ASUS ROG - $1,899.99
- Magic Mouse 2 - $79.99
- 4K USB-C Monitor - $449.99
- SSD 1TB External Drive - $129.99

## 🎨 Customization

### Adding New Categories
Edit the categories in `backend/templates/add_product.html`:
```html
<option value="YourCategory">Your Category</option>
```

### Modifying Styles
Edit `static/css/style.css` to customize the appearance.

### Adding Features
- Extend `models.py` for new database fields
- Add routes in `app.py`
- Create templates in `backend/templates/`
- Add JavaScript in `static/js/main.js`

## 🔒 Security Features

- **Password Hashing** - Werkzeug security
- **Session Management** - Flask sessions
- **File Upload Validation** - Secure filename and type checking
- **Admin Authentication** - Protected admin routes
- **Input Validation** - Server-side validation

## 🚀 Deployment

### Production Considerations
1. **Use a production database** (PostgreSQL, MySQL)
2. **Set environment variables** for sensitive data
3. **Use a WSGI server** (Gunicorn, uWSGI)
4. **Configure reverse proxy** (Nginx, Apache)
5. **Enable HTTPS** for secure transactions
6. **Set up file storage** (AWS S3, Google Cloud)

### Example Production Setup
```bash
# Install production server
pip install gunicorn

# Run with Gunicorn
gunicorn --bind 0.0.0.0:8000 app:app
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the code comments

## ✨ Acknowledgments

- Bootstrap team for the UI framework
- Font Awesome for icons
- Flask community for the web framework
- Unsplash for placeholder images

---

**Built with ❤️ for the tech community**

🎯 **Demo Credentials**
- Admin Username: `admin`
- Admin Password: `admin123`

🌐 **Live Demo**: [Your deployment URL here]
