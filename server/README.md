# Buneko Blooms Backend Server

Node.js backend server with MySQL database for the Buneko Blooms e-commerce platform.

## Features

- ✅ RESTful API with Express.js
- ✅ MySQL database integration
- ✅ JWT authentication
- ✅ Role-based access control (Admin/Customer)
- ✅ Product management
- ✅ Order management
- ✅ User management
- ✅ Category management
- ✅ Input validation
- ✅ Error handling
- ✅ Security middleware (Helmet, CORS, Rate limiting)

## Prerequisites

- Node.js (v18 or higher)
- MySQL (v8.0 or higher)
- npm or yarn

## Installation

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` file with your database credentials:
   ```env
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_password
   DB_NAME=buneko_blooms
   DB_PORT=3306
   
   JWT_SECRET=your-super-secret-jwt-key
   FRONTEND_URL=http://localhost:8080
   ```

3. **Create MySQL database:**
   ```sql
   CREATE DATABASE buneko_blooms;
   ```

4. **Run database migration:**
   ```bash
   npm run db:migrate
   ```

5. **Seed database with sample data (optional):**
   ```bash
   npm run db:seed
   ```

## Running the Server

**Development mode (with auto-reload):**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on `http://localhost:3000` (or the port specified in `.env`).

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/refresh` - Refresh JWT token

### Products
- `GET /api/products` - Get all products (with pagination, search, filter)
- `GET /api/products/:id` - Get product by ID
- `GET /api/products/category/:categoryId` - Get products by category
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Orders
- `GET /api/orders` - Get all orders (admin only)
- `GET /api/orders/my-orders` - Get user's orders (requires auth)
- `GET /api/orders/:id` - Get order by ID
- `POST /api/orders` - Create new order (requires auth)
- `PATCH /api/orders/:id/status` - Update order status (admin only)
- `PATCH /api/orders/:id/cancel` - Cancel order (requires auth)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/:id` - Get user by ID (admin only)
- `PUT /api/users/profile` - Update own profile (requires auth)
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

## Sample API Requests

### Register User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
  }'
```

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@buneko.com",
    "password": "admin123"
  }'
```

### Get Products
```bash
curl http://localhost:3000/api/products
```

### Create Order (with auth token)
```bash
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "items": [
      {"product_id": 1, "quantity": 2}
    ],
    "shipping_address": "123 Main St, Kathmandu",
    "phone": "+977-1234567890"
  }'
```

## Default Credentials (after seeding)

**Admin:**
- Email: `admin@buneko.com`
- Password: `admin123`

**Customer:**
- Email: `customer@example.com`
- Password: `customer123`

## Database Schema

The database includes the following tables:
- `users` - User accounts (customers and admins)
- `categories` - Product categories
- `products` - Product catalog
- `orders` - Customer orders
- `order_items` - Order line items
- `wishlist` - User wishlists

See `src/database/schema.sql` for full schema details.

## Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── database.js          # Database connection
│   ├── controllers/
│   │   ├── auth.controller.js   # Authentication logic
│   │   ├── product.controller.js
│   │   ├── order.controller.js
│   │   ├── user.controller.js
│   │   └── category.controller.js
│   ├── middleware/
│   │   └── auth.middleware.js    # JWT authentication middleware
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── product.routes.js
│   │   ├── order.routes.js
│   │   ├── user.routes.js
│   │   └── category.routes.js
│   ├── database/
│   │   ├── schema.sql            # Database schema
│   │   ├── migrate.js            # Migration script
│   │   └── seed.js               # Seed script
│   ├── utils/
│   │   └── validation.js         # Validation helpers
│   └── index.js                  # Server entry point
├── .env.example                  # Environment variables template
├── .gitignore
├── package.json
└── README.md
```

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Rate limiting on API endpoints
- CORS configuration
- Helmet.js for security headers
- Input validation with express-validator
- SQL injection prevention with parameterized queries

## Error Handling

All errors are handled consistently with the following format:
```json
{
  "success": false,
  "message": "Error message here"
}
```

## Development

- Uses ES6 modules
- Nodemon for auto-reload in development
- Environment-based configuration
- Structured error handling

## Frontend Integration

The backend is configured to work with the frontend running on `http://localhost:8080`. Update `FRONTEND_URL` in `.env` if your frontend runs on a different port.

## License

ISC

