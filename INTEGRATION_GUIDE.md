# Backend-Frontend Integration Guide

## ✅ Completed Integration

### Backend Features
1. **Automatic Database Setup**
   - Database `EduConnect` is created automatically if it doesn't exist
   - All tables are created automatically on server startup
   - Superadmin is automatically created on first run

2. **Superadmin Account**
   - Email: `superadmin@buneko.com`
   - Password: `superadmin123`
   - Role: `superadmin` (has access to all admin features)
   - Created automatically, no registration needed

3. **Authentication API**
   - `POST /api/auth/register` - Register new customer
   - `POST /api/auth/login` - Login (works for customer, admin, superadmin)
   - `POST /api/auth/logout` - Logout
   - `GET /api/auth/me` - Get current user

### Frontend Integration
1. **API Client** (`src/lib/api.ts`)
   - Centralized API communication
   - Automatic token management
   - Error handling

2. **AuthContext** (`src/contexts/AuthContext.tsx`)
   - Integrated with real backend API
   - Token storage in localStorage
   - Auto-loads user on app start
   - Role-based routing support

3. **Login/Signup Pages**
   - Connected to backend API
   - Proper error handling
   - Role-based redirects

## 🚀 Quick Start

### 1. Start Backend Server
```bash
cd server
npm install
npm run dev
```

The server will:
- Create database `EduConnect` if it doesn't exist
- Create all tables automatically
- Create superadmin account
- Start on port 5000

### 2. Start Frontend
```bash
# In project root
npm install
npm run dev
```

Frontend runs on port 8080 and connects to backend on port 5000.

## 🔐 Default Credentials

### Superadmin
- Email: `superadmin@buneko.com`
- Password: `superadmin123`
- Access: Full admin panel access

### Test Customer (after registration)
- Register through `/signup` page
- Or use any email/password to register

## 📝 Environment Variables

### Backend (.env in server folder)
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=EduConnect
DB_PORT=3306
PORT=5000
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
FRONTEND_URL=http://localhost:8080
```

### Frontend (optional - .env in root)
```env
VITE_API_URL=http://localhost:5000/api
```

## 🔄 How It Works

### Registration Flow
1. User fills signup form
2. Frontend calls `POST /api/auth/register`
3. Backend creates customer account
4. Returns JWT token and user data
5. Frontend stores token and redirects to dashboard

### Login Flow
1. User enters credentials
2. Frontend calls `POST /api/auth/login`
3. Backend validates credentials
4. Returns JWT token and user data (including role)
5. Frontend stores token and redirects based on role:
   - `superadmin` or `admin` → `/admin`
   - `customer` → `/dashboard`

### Authentication
- JWT token stored in `localStorage`
- Token sent in `Authorization: Bearer <token>` header
- Auto-verification on app load
- Auto-logout on token expiration

## 🛠️ API Endpoints

### Authentication
- `POST /api/auth/register` - Register customer
- `POST /api/auth/login` - Login (all roles)
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Products
- `GET /api/products` - List products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin/superadmin)
- `PUT /api/products/:id` - Update product (admin/superadmin)
- `DELETE /api/products/:id` - Delete product (admin/superadmin)

### Orders
- `GET /api/orders/my-orders` - Get user orders
- `POST /api/orders` - Create order
- `GET /api/orders/:id` - Get order details

### Categories
- `GET /api/categories` - List categories

## 🔒 Role-Based Access

- **Customer**: Can register, login, view products, create orders
- **Admin**: All customer permissions + manage products/orders
- **Superadmin**: All admin permissions + full system access

## 📱 Frontend Routes

- `/` - Homepage
- `/login` - Login page
- `/signup` - Registration page
- `/dashboard` - Customer dashboard
- `/admin` - Admin/Superadmin dashboard

## 🐛 Troubleshooting

### Database Connection Issues
- Ensure MySQL is running
- Check `.env` file has correct credentials
- Verify database name matches `EduConnect`

### Authentication Issues
- Check browser console for errors
- Verify token is stored in localStorage
- Check backend logs for API errors
- Ensure CORS is configured correctly

### Port Conflicts
- Backend default: 5000
- Frontend default: 8080
- Update ports in `.env` if needed

## 📚 Next Steps

1. Add product management UI
2. Add order management UI
3. Add image upload functionality
4. Add payment integration
5. Add email notifications

