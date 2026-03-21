# Superadmin Setup and Login Guide

## ✅ Superadmin Account

The superadmin account is **automatically created** when the server starts for the first time.

### Default Credentials
- **Email**: `superadmin@buneko.com`
- **Password**: `superadmin123`
- **Role**: `superadmin`

## 🔧 Manual Superadmin Creation

If you need to manually create or recreate the superadmin account:

```bash
cd server
npm run db:create-superadmin
```

This will:
- Check if superadmin already exists
- Create superadmin if it doesn't exist
- Display the credentials

## 🔐 Login Process

### 1. Start the Backend Server
```bash
cd server
npm run dev
```

The server will automatically:
- Create the database if it doesn't exist
- Create all tables
- Create the superadmin account

### 2. Start the Frontend
```bash
npm run dev
```

### 3. Login as Superadmin
1. Navigate to `http://localhost:8080/login`
2. Enter credentials:
   - Email: `superadmin@buneko.com`
   - Password: `superadmin123`
3. Click "Sign In"
4. You will be redirected to `/admin` dashboard

## 🎯 Superadmin Features

- **Full Access**: Superadmin has access to all admin features
- **User Management**: Can manage all users (customers, admins, superadmins)
- **Product Management**: Full CRUD operations on products
- **Order Management**: View and manage all orders
- **Category Management**: Manage product categories
- **Content Management**: Manage website content

## 🔒 Security Notes

1. **Change Default Password**: After first login, change the password through the profile settings
2. **Keep Credentials Secure**: Don't share superadmin credentials
3. **Use HTTPS**: In production, always use HTTPS
4. **Regular Backups**: Backup the database regularly

## 🛠️ Troubleshooting

### Superadmin Not Created
If superadmin is not created automatically:

1. **Check Database Connection**
   ```bash
   # Verify .env file has correct database credentials
   ```

2. **Manually Create Superadmin**
   ```bash
   cd server
   npm run db:create-superadmin
   ```

3. **Check Server Logs**
   - Look for "✅ Superadmin created" message
   - Check for any error messages

### Cannot Login
1. **Verify Credentials**
   - Email: `superadmin@buneko.com`
   - Password: `superadmin123`

2. **Check Database**
   ```sql
   SELECT * FROM users WHERE email = 'superadmin@buneko.com';
   ```

3. **Verify Backend is Running**
   - Check `http://localhost:5000/health`
   - Should return: `{"status":"ok","message":"Server is running"}`

4. **Check Frontend API URL**
   - Verify `VITE_API_URL` in frontend `.env` (if set)
   - Default: `http://localhost:5000/api`

### Redirect Issues
- Superadmin and Admin → `/admin` dashboard
- Customer → `/dashboard`
- If redirected incorrectly, check user role in database

## 📝 Database Verification

To verify superadmin exists in database:

```sql
SELECT id, name, email, role, created_at 
FROM users 
WHERE email = 'superadmin@buneko.com' OR role = 'superadmin';
```

Expected result:
- ID: 1 (or any number)
- Name: Super Admin
- Email: superadmin@buneko.com
- Role: superadmin
- Created_at: timestamp

## 🔄 Reset Superadmin Password

To reset superadmin password manually:

```sql
-- Generate new password hash (use bcrypt with salt rounds 10)
-- Then update:
UPDATE users 
SET password = '<new_bcrypt_hash>' 
WHERE email = 'superadmin@buneko.com';
```

Or use the create-superadmin script which will recreate if needed.

## 📚 Related Files

- Backend: `server/src/config/database.js` - Superadmin initialization
- Frontend: `src/pages/Login.tsx` - Login page
- Frontend: `src/contexts/AuthContext.tsx` - Authentication context
- Frontend: `src/components/ProtectedRoute.tsx` - Route protection

