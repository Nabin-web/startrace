# CSV File Manager - Backend API

FastAPI backend for CSV file management with JWT authentication and real-time updates.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up PostgreSQL database and update `.env` file:
```bash
DATABASE_URL=postgresql://user:password@localhost:5432/csv_app_db
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
UPLOAD_DIR=./uploads
```

3. Run the server:
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## Default Admin User

- Username: `admin`
- Password: `admin123`

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Sign up new user
- `POST /api/auth/login` - Login (returns JWT tokens)
- `GET /api/auth/me` - Get current user info

### User Endpoints
- `GET /api/files` - List all CSV files
- `GET /api/files/{file_id}` - Download CSV file
- `GET /api/files/{file_id}/content` - Get CSV content as JSON

### Admin Endpoints
- `POST /api/admin/files/upload` - Upload CSV file
- `DELETE /api/admin/files/{file_id}` - Delete CSV file
- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/{user_id}` - Delete user

### WebSocket
- `WS /ws?token=<jwt_token>` - Real-time updates connection

