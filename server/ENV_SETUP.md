# Environment Variables Setup

Create a `.env` file in the `server` directory with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=buneko_blooms
DB_PORT=3306

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# CORS Configuration
FRONTEND_URL=http://localhost:8080

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=5242880
```

## Quick Setup Instructions

1. Copy this content and create a `.env` file in the `server` directory
2. Replace `your_mysql_password` with your actual MySQL password
3. Replace `your-super-secret-jwt-key-change-this-in-production` with a strong random string
4. Adjust `FRONTEND_URL` if your frontend runs on a different port

## Security Notes

- Never commit the `.env` file to version control
- Use a strong, random string for `JWT_SECRET` in production
- Change default passwords in production environments

